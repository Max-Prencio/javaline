using System.Security.Claims;
using System.Text.Json;
using Javaline.Commercial.Domain.Entities;
using Javaline.Commercial.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Javaline.Commercial.Api.Controllers;

[ApiController]
[Route("pocket")]
[Authorize]
public class PocketController : ControllerBase
{
    private readonly JavalineDbContext _db;

    public PocketController(JavalineDbContext db) => _db = db;

    private string? GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;

    private string GetTenantId()
    {
        var userId = GetUserId();
        var user = _db.Users.FirstOrDefault(u => u.Id == userId);
        return user?.TenantId ?? "default";
    }

    // ─── Dashboard ───

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var tenantId = GetTenantId();
        var userId = GetUserId()!;

        var tasksCount = await _db.InventoryCounts
            .CountAsync(c => c.TenantId == tenantId && c.UserId == userId && c.Status == "pending");

        var unreadNotifs = await _db.PocketNotifications
            .CountAsync(n => n.TenantId == tenantId && n.UserId == userId && !n.Read);

        var lowStock = await _db.InventoryItems
            .CountAsync(i => i.TenantId == tenantId && i.Active && i.Stock <= i.MinStock);

        var userName = (await _db.Users.FindAsync(userId))?.Name ?? "";

        return Ok(new
        {
            tasks_count = tasksCount,
            unread_notifications = unreadNotifs,
            low_stock_alerts = lowStock,
            user_name = userName
        });
    }

    // ─── Notifications ───

    [HttpGet("notifications")]
    public async Task<IActionResult> GetNotifications([FromQuery] int limit = 20)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId()!;

        var notifs = await _db.PocketNotifications
            .Where(n => n.TenantId == tenantId && n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(limit)
            .ToListAsync();

        return Ok(notifs);
    }

    [HttpPost("notifications/{id}/read")]
    public async Task<IActionResult> MarkNotificationRead(string id)
    {
        var userId = GetUserId()!;
        var notif = await _db.PocketNotifications.FirstOrDefaultAsync(n =>
            n.Id == id && n.UserId == userId);

        if (notif == null) return NotFound(new { detail = "Notificación no encontrada" });
        notif.Read = true;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Marcada como leída" });
    }

    [HttpPost("notifications/read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        var tenantId = GetTenantId();
        var userId = GetUserId()!;

        var notifs = await _db.PocketNotifications
            .Where(n => n.TenantId == tenantId && n.UserId == userId && !n.Read)
            .ToListAsync();

        foreach (var n in notifs) n.Read = true;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Todas marcadas como leídas" });
    }

    // ─── Inventory Count ───

    [HttpPost("inventory-count/start")]
    public IActionResult StartCountSession()
    {
        var sessionId = $"COUNT-{Guid.NewGuid().ToString("N")[..8].ToUpper()}";
        return Ok(new { session_id = sessionId });
    }

    [HttpPost("inventory-count/scan")]
    public async Task<IActionResult> ScanProduct([FromBody] ScanDto data)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId()!;
        var userName = (await _db.Users.FindAsync(userId))?.Name ?? "";

        if (string.IsNullOrEmpty(data.SessionId) || string.IsNullOrEmpty(data.Sku))
            return BadRequest(new { detail = "session_id y sku requeridos" });

        var product = await _db.InventoryItems.FirstOrDefaultAsync(i =>
            i.TenantId == tenantId && i.Sku == data.Sku && i.Active);

        if (product == null) return NotFound(new { detail = $"Producto con SKU {data.Sku} no encontrado" });

        var existing = await _db.InventoryCounts.FirstOrDefaultAsync(c =>
            c.TenantId == tenantId && c.SessionId == data.SessionId && c.ProductId == product.Id);

        if (existing != null)
        {
            existing.ScannedCount += 1;
            existing.Shelf = data.Shelf ?? existing.Shelf;
            existing.Row = data.Row ?? existing.Row;
            existing.Box = data.Box ?? existing.Box;
        }
        else
        {
            existing = new InventoryCount
            {
                Id = Guid.NewGuid().ToString(),
                TenantId = tenantId,
                UserId = userId,
                UserName = userName,
                ProductId = product.Id,
                ProductName = product.Name,
                Sku = product.Sku ?? "",
                Warehouse = data.Warehouse ?? "",
                Shelf = data.Shelf ?? "",
                Row = data.Row ?? "",
                Box = data.Box ?? "",
                ScannedCount = 1,
                SessionId = data.SessionId,
                Status = "pending",
                CreatedAt = DateTime.UtcNow
            };
            _db.InventoryCounts.Add(existing);
        }

        await _db.SaveChangesAsync();

        return Ok(new
        {
            product_name = product.Name,
            scanned_count = existing.ScannedCount,
            shelf = data.Shelf ?? product.Shelf,
            row = data.Row ?? product.Row,
            box = data.Box ?? product.Box,
            stock = product.Stock
        });
    }

    [HttpPost("inventory-count/finish")]
    public async Task<IActionResult> FinishCountSession([FromBody] FinishCountDto data)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId()!;

        if (string.IsNullOrEmpty(data.SessionId))
            return BadRequest(new { detail = "session_id requerido" });

        var counts = await _db.InventoryCounts
            .Where(c => c.TenantId == tenantId && c.SessionId == data.SessionId)
            .ToListAsync();

        if (counts.Count == 0)
            return NotFound(new { detail = "Sesión de conteo no encontrada" });

        if (data.Action == "confirm")
        {
            foreach (var c in counts)
            {
                var product = await _db.InventoryItems.FindAsync(c.ProductId);
                if (product != null && c.ScannedCount != product.Stock)
                {
                    var delta = c.ScannedCount - product.Stock;
                    product.Stock = Math.Max(0, product.Stock + delta);
                    _db.StockMovements.Add(new StockMovement
                    {
                        Id = Guid.NewGuid().ToString(),
                        ProductId = product.Id,
                        Quantity = delta,
                        Type = delta > 0 ? "in" : "out",
                        Reason = $"Conteo físico: {c.ScannedCount} unidades en {c.Shelf}-{c.Row}-{c.Box}",
                        BeforeStock = product.Stock - delta,
                        AfterStock = product.Stock,
                        UserId = userId,
                        Date = DateTime.UtcNow
                    });
                }
                c.Status = "completed";
                c.CompletedAt = DateTime.UtcNow;
            }

            _db.ActivityLogs.Add(new ActivityLog
            {
                Id = Guid.NewGuid().ToString(),
                TenantId = tenantId,
                UserId = userId,
                UserName = (await _db.Users.FindAsync(userId))?.Name ?? "",
                Action = "inventory_count_finish",
                Detail = $"Conteo finalizado: {counts.Count} productos en sesión {data.SessionId}",
                Store = "inventory_counts",
                CreatedAt = DateTime.UtcNow
            });
        }

        await _db.SaveChangesAsync();
        return Ok(new { message = "Conteo finalizado", counted_products = counts.Count });
    }

    [HttpGet("inventory-count/history")]
    public async Task<IActionResult> GetCountHistory()
    {
        var tenantId = GetTenantId();
        var userId = GetUserId()!;

        var history = await _db.InventoryCounts
            .Where(c => c.TenantId == tenantId && c.UserId == userId)
            .OrderByDescending(c => c.CreatedAt)
            .Take(50)
            .ToListAsync();

        return Ok(history);
    }
}

public class ScanDto
{
    public string SessionId { get; set; } = "";
    public string Sku { get; set; } = "";
    public string? Warehouse { get; set; }
    public string? Shelf { get; set; }
    public string? Row { get; set; }
    public string? Box { get; set; }
}

public class FinishCountDto
{
    public string SessionId { get; set; } = "";
    public string Action { get; set; } = "confirm";
}
