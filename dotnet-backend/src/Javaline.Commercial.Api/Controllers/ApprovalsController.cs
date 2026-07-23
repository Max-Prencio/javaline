using System.Security.Claims;
using Javaline.Commercial.Domain.Entities;
using Javaline.Commercial.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Javaline.Commercial.Api.Controllers;

[ApiController]
[Route("approvals")]
[Authorize]
public class ApprovalsController : ControllerBase
{
    private readonly JavalineDbContext _db;

    public ApprovalsController(JavalineDbContext db) => _db = db;

    private string? GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? User.FindFirst("sub")?.Value;
    private string? GetUserRole() => User.FindFirst(ClaimTypes.Role)?.Value;

    // ─── Approvals CRUD ───

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = _db.Approvals.OrderByDescending(a => a.CreatedAt);
        var totalCount = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).AsNoTracking().ToListAsync();
        return Ok(new { items, totalCount, page, pageSize });
    }

    [HttpGet("pending")]
    public async Task<IActionResult> GetPending()
    {
        var role = GetUserRole();
        if (role != "admin" && role != "manager")
            return Forbid();

        var orders = await _db.PurchaseOrders
            .Where(o => o.Status == "pending_approval")
            .OrderByDescending(o => o.CreatedAt)
            .AsNoTracking()
            .ToListAsync();
        return Ok(orders);
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory()
    {
        var approvals = await _db.Approvals
            .OrderByDescending(a => a.ApprovedAt)
            .Take(50)
            .AsNoTracking()
            .ToListAsync();
        return Ok(approvals);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var item = await _db.Approvals.FindAsync(id);
        if (item == null) return NotFound(new { detail = "Approval not found." });
        return Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Approval approval)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        approval.Id = Guid.NewGuid().ToString();
        approval.ApprovedBy = userId;
        approval.ApprovedAt = DateTime.UtcNow;
        approval.CreatedAt = DateTime.UtcNow;
        await _db.Approvals.AddAsync(approval);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = approval.Id }, approval);
    }

    [HttpPost("{orderId}/approve")]
    public async Task<IActionResult> ApproveOrder(string orderId, [FromBody] ApproveRejectDto data)
    {
        var userId = GetUserId();
        var role = GetUserRole();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        if (role != "admin" && role != "manager") return Forbid();

        var order = await _db.PurchaseOrders.FindAsync(orderId);
        if (order == null) return NotFound(new { detail = "Orden no encontrada" });

        var user = await _db.Users.FindAsync(userId);
        var amount = data.AmountApproved ?? order.Total;

        var approval = new Approval
        {
            Id = Guid.NewGuid().ToString(),
            PurchaseOrderId = orderId,
            ApprovedBy = userId,
            Status = "approved",
            AmountApproved = amount,
            Comment = data.Comment ?? "",
            ApprovedAt = DateTime.UtcNow
        };
        _db.Approvals.Add(approval);

        order.Status = "aprobado";
        order.Notes = $"Aprobado por {user?.Name} — Monto: {amount:,.2f} {order.Currency}";
        await _db.SaveChangesAsync();

        return Ok(new { order, approval });
    }

    [HttpPost("{orderId}/reject")]
    public async Task<IActionResult> RejectOrder(string orderId, [FromBody] ApproveRejectDto data)
    {
        var userId = GetUserId();
        var role = GetUserRole();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        if (role != "admin" && role != "manager") return Forbid();

        var order = await _db.PurchaseOrders.FindAsync(orderId);
        if (order == null) return NotFound(new { detail = "Orden no encontrada" });

        var user = await _db.Users.FindAsync(userId);

        var approval = new Approval
        {
            Id = Guid.NewGuid().ToString(),
            PurchaseOrderId = orderId,
            ApprovedBy = userId,
            Status = "rejected",
            AmountApproved = 0,
            Comment = data.Comment ?? "Solicitud rechazada",
            ApprovedAt = DateTime.UtcNow
        };
        _db.Approvals.Add(approval);

        order.Status = "rechazado";
        order.Notes = $"Rechazado por {user?.Name}: {data.Comment}";
        await _db.SaveChangesAsync();

        return Ok(new { order, approval });
    }

    // ─── Hierarchies ───

    [HttpGet("hierarchies")]
    public async Task<IActionResult> GetAllHierarchies()
    {
        var items = await _db.ApprovalHierarchies
            .OrderBy(h => h.MinAmount)
            .AsNoTracking()
            .ToListAsync();
        return Ok(items);
    }

    [HttpGet("hierarchies/default")]
    public async Task<IActionResult> GetDefaultHierarchies()
    {
        var items = await _db.ApprovalHierarchies
            .OrderBy(h => h.MinAmount)
            .AsNoTracking()
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost("hierarchies")]
    public async Task<IActionResult> CreateHierarchy([FromBody] ApprovalHierarchy hierarchy)
    {
        var userId = GetUserId();
        hierarchy.Id = Guid.NewGuid().ToString();
        hierarchy.CreatedBy = userId;
        hierarchy.CreatedAt = DateTime.UtcNow;
        await _db.ApprovalHierarchies.AddAsync(hierarchy);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAllHierarchies), hierarchy);
    }

    [HttpPut("hierarchies/{id}")]
    public async Task<IActionResult> UpdateHierarchy(string id, [FromBody] ApprovalHierarchy data)
    {
        var h = await _db.ApprovalHierarchies.FindAsync(id);
        if (h == null) return NotFound(new { detail = "Regla no encontrada" });

        h.Currency = data.Currency;
        h.Role = data.Role;
        h.MinAmount = data.MinAmount;
        h.MaxAmount = data.MaxAmount;
        await _db.SaveChangesAsync();
        return Ok(h);
    }

    [HttpDelete("hierarchies/{id}")]
    public async Task<IActionResult> DeleteHierarchy(string id)
    {
        var h = await _db.ApprovalHierarchies.FindAsync(id);
        if (h == null) return NotFound(new { detail = "Regla no encontrada" });
        _db.ApprovalHierarchies.Remove(h);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Regla eliminada" });
    }

    [HttpPost("can-approve")]
    public async Task<IActionResult> CanApprove([FromBody] CanApproveDto data)
    {
        var rules = await _db.ApprovalHierarchies
            .Where(h => h.Role == data.UserRole &&
                        h.Currency == data.Currency &&
                        h.MinAmount <= data.OrderTotal &&
                        h.MaxAmount >= data.OrderTotal)
            .AsNoTracking()
            .ToListAsync();
        return Ok(new { can_approve = rules.Count > 0, rules });
    }
}

public class ApproveRejectDto
{
    public decimal? AmountApproved { get; set; }
    public string? Comment { get; set; }
}

public class CanApproveDto
{
    public string Currency { get; set; } = "DOP";
    public decimal OrderTotal { get; set; }
    public string UserRole { get; set; } = "";
}
