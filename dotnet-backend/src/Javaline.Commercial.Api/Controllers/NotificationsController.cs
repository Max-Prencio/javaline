using Javaline.Commercial.Domain.Entities;
using Javaline.Commercial.Domain.Interfaces;
using Javaline.Commercial.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Javaline.Commercial.Api.Controllers;

[ApiController]
[Route("notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly JavalineDbContext _db;
    private readonly IUnitOfWork _unitOfWork;

    public NotificationsController(JavalineDbContext db, IUnitOfWork unitOfWork)
    {
        _db = db;
        _unitOfWork = unitOfWork;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? userId = null)
    {
        IQueryable<Notification> query = _db.Notifications.AsQueryable();

        if (!string.IsNullOrWhiteSpace(userId))
            query = query.Where(n => n.UserId == userId);

        var items = await query
            .OrderByDescending(n => n.CreatedAt)
            .AsNoTracking()
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount([FromQuery] string userId)
    {
        var count = await _db.Notifications
            .Where(n => n.UserId == userId && !n.Read)
            .CountAsync();

        return Ok(new { count });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Notification notification)
    {
        notification.Id = Guid.NewGuid().ToString();
        notification.CreatedAt = DateTime.UtcNow;
        notification.Read = false;

        await _db.Notifications.AddAsync(notification);
        await _unitOfWork.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { userId = notification.UserId }, notification);
    }

    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkRead(string id)
    {
        var notification = await _db.Notifications.FindAsync(new object[] { id });
        if (notification == null)
            return NotFound(new { detail = "Notificación no encontrada." });

        notification.Read = true;
        _db.Notifications.Update(notification);
        await _unitOfWork.SaveChangesAsync();

        return Ok(notification);
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllRead([FromBody] MarkAllReadRequest request)
    {
        var notifications = await _db.Notifications
            .Where(n => n.UserId == request.UserId && !n.Read)
            .ToListAsync();

        foreach (var n in notifications)
            n.Read = true;

        await _unitOfWork.SaveChangesAsync();

        return Ok(new { updated = notifications.Count });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var notification = await _db.Notifications.FindAsync(new object[] { id });
        if (notification == null)
            return NotFound(new { detail = "Notificación no encontrada." });

        _db.Notifications.Remove(notification);
        await _unitOfWork.SaveChangesAsync();

        return Ok(new { success = true });
    }
}

public record MarkAllReadRequest(string UserId);
