using System.Security.Claims;
using System.Text.Json;
using Javaline.Commercial.Domain.Entities;
using Javaline.Commercial.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Javaline.Commercial.Api.Middleware;

/// <summary>
/// Middleware that automatically logs write operations (POST, PUT, PATCH, DELETE)
/// to the AuditLog table for compliance and traceability.
/// Read-only operations (GET) are not logged to reduce noise.
/// </summary>
public class AuditTrailMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IServiceScopeFactory _scopeFactory;

    private static readonly HashSet<string> IgnoredPaths = new(StringComparer.OrdinalIgnoreCase)
    {
        "/health",
        "/metrics",
        "/swagger",
        "/favicon.ico"
    };

    public AuditTrailMiddleware(RequestDelegate next, IServiceScopeFactory scopeFactory)
    {
        _next = next;
        _scopeFactory = scopeFactory;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var method = context.Request.Method;

        // Only audit write operations
        if (HttpMethods.IsGet(method) || HttpMethods.IsHead(method) || HttpMethods.IsOptions(method))
        {
            await _next(context);
            return;
        }

        var path = context.Request.Path.Value ?? "";
        if (IgnoredPaths.Any(p => path.StartsWith(p, StringComparison.OrdinalIgnoreCase)))
        {
            await _next(context);
            return;
        }

        await _next(context);

        // Log after the response is generated so we can capture the result
        try
        {
            var userId = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var entityType = ExtractEntityType(path);
            var action = $"{method} {path}";
            var statusCode = context.Response.StatusCode;

            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<JavalineDbContext>();

            var auditLog = new AuditLog
            {
                Id = Guid.NewGuid().ToString("N"),
                UserId = userId ?? "system",
                Action = action,
                EntityType = entityType,
                EntityId = ExtractEntityId(path),
                Details = JsonSerializer.Serialize(new
                {
                    method,
                    path,
                    statusCode,
                    timestamp = DateTime.UtcNow
                }),
                IpAddress = context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                CreatedAt = DateTime.UtcNow
            };

            db.AuditLogs.Add(auditLog);
            await db.SaveChangesAsync();
        }
        catch
        {
            // Never let audit logging crash the request
        }
    }

    private static string ExtractEntityType(string path)
    {
        var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
        return segments.Length > 0 ? segments[0] : "unknown";
    }

    private static string? ExtractEntityId(string path)
    {
        var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
        // If path is like /invoices/abc123, the entity ID is the last segment
        if (segments.Length > 1)
        {
            var last = segments[^1];
            // Only return if it looks like an ID (GUID or numeric)
            if (last.Length >= 8 && (last.Contains('-') || last.All(char.IsLetterOrDigit)))
                return last;
        }
        return null;
    }
}
