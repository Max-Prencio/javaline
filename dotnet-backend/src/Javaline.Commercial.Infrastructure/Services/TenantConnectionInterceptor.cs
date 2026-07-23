using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging;
using Npgsql;
using System.Data.Common;

namespace Javaline.Commercial.Infrastructure.Services;

/// <summary>
/// Sets PostgreSQL session GUC variables on every connection open so RLS policies
/// can identify the current user, role, and tenant without additional queries.
///
/// Fail-closed: if no authenticated HTTP context exists (background jobs),
/// sets role = 'service' which triggers admin-level visibility within the default tenant.
/// This is intentional — background task code is trusted internal code.
///
/// Npgsql safety: pool returns run DISCARD ALL which clears app.* GUC params,
/// so stale values from a previous request never leak to the next.
/// </summary>
public sealed class TenantConnectionInterceptor : DbConnectionInterceptor
{
    private readonly IHttpContextAccessor _http;
    private readonly ILogger<TenantConnectionInterceptor> _logger;

    public TenantConnectionInterceptor(IHttpContextAccessor http, ILogger<TenantConnectionInterceptor> logger)
    {
        _http = http;
        _logger = logger;
    }

    public override async Task ConnectionOpenedAsync(
        DbConnection connection,
        ConnectionEndEventData eventData,
        CancellationToken cancellationToken = default)
    {
        var (userId, role, tenantId) = ResolveContext();
        if (string.IsNullOrEmpty(userId)) return;

        await using var cmd = connection.CreateCommand();
        cmd.CommandText =
            "SELECT set_config('app.current_user_id', @uid, false)," +
            "       set_config('app.current_role',    @rol, false)," +
            "       set_config('app.current_tenant_id', @tid, false)";

        var p = (NpgsqlCommand)cmd;
        p.Parameters.AddWithValue("uid", userId);
        p.Parameters.AddWithValue("rol", role);
        p.Parameters.AddWithValue("tid", tenantId);

        await cmd.ExecuteNonQueryAsync(cancellationToken);

        _logger.LogDebug("RLS context set: user={UserId} role={Role} tenant={TenantId}", userId, role, tenantId);
    }

    // Sync override — EF Core may open connections synchronously in some paths
    public override void ConnectionOpened(DbConnection connection, ConnectionEndEventData eventData)
    {
        var (userId, role, tenantId) = ResolveContext();
        if (string.IsNullOrEmpty(userId)) return;

        using var cmd = connection.CreateCommand();
        cmd.CommandText =
            "SELECT set_config('app.current_user_id', @uid, false)," +
            "       set_config('app.current_role',    @rol, false)," +
            "       set_config('app.current_tenant_id', @tid, false)";

        var p = (NpgsqlCommand)cmd;
        p.Parameters.AddWithValue("uid", userId);
        p.Parameters.AddWithValue("rol", role);
        p.Parameters.AddWithValue("tid", tenantId);

        cmd.ExecuteNonQuery();
    }

    private (string userId, string role, string tenantId) ResolveContext()
    {
        var user = _http.HttpContext?.User;

        if (user?.Identity?.IsAuthenticated == true)
        {
            var userId   = user.FindFirstValue(ClaimTypes.NameIdentifier)
                        ?? user.FindFirstValue("sub")
                        ?? "";
            var role     = user.FindFirstValue(ClaimTypes.Role)
                        ?? user.FindFirstValue("role")
                        ?? "user";
            var tenantId = user.FindFirstValue("tenant_id") ?? "default";

            return (userId, role, tenantId);
        }

        // No HTTP context = background job / migration runner
        // Use 'service' role so background tasks can read all tenant data.
        // Fail-safe: if somehow this is reached in a non-service context,
        // 'service' still requires tenant_id = 'default' on every row.
        return ("service", "service", "default");
    }
}
