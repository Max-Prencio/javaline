using System.Security.Claims;
using Javaline.Commercial.Application.DTOs;
using Javaline.Commercial.Application.Interfaces;
using Javaline.Commercial.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Javaline.Commercial.Api.Controllers;

[ApiController]
[Route("invoices")]
[Authorize]
public class InvoicesController : ControllerBase
{
    private readonly IInvoiceService _invoiceService;
    private readonly ICacheService _cache;
    private readonly IBackgroundTaskQueue _queue;

    private static readonly TimeSpan ListTtl  = TimeSpan.FromMinutes(1);
    private static readonly TimeSpan StatsTtl = TimeSpan.FromMinutes(2);
    private const string Prefix = "invs:";

    public InvoicesController(IInvoiceService invoiceService, ICacheService cache, IBackgroundTaskQueue queue)
    {
        _invoiceService = invoiceService;
        _cache = cache;
        _queue = queue;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] string? type = null,
        [FromQuery] string? search = null)
    {
        var key = $"{Prefix}list:{page}:{pageSize}:{status}:{type}:{search}";
        var result = await _cache.GetOrCreateAsync(key,
            () => _invoiceService.GetAllAsync(page, pageSize, status, type, search),
            ListTtl);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var key = $"{Prefix}id:{id}";
        var invoice = await _cache.GetOrCreateAsync(key,
            () => _invoiceService.GetByIdAsync(id),
            ListTtl);

        if (invoice == null)
            return NotFound(new { detail = "Invoice not found." });

        return Ok(invoice);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateInvoiceDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { detail = "User not authenticated." });

        var invoice = await _invoiceService.CreateAsync(dto, userId);
        _cache.RemoveByPrefix(Prefix);

        // Notify admins in background — response already returned to client
        var invoiceId = invoice.Id;
        var total     = invoice.Total;
        await _queue.QueueAsync(async (sp, ct) =>
        {
            var db = sp.GetRequiredService<Javaline.Commercial.Infrastructure.Data.JavalineDbContext>();
            var adminEmails = await db.Users
                .Where(u => u.Role == "admin" && u.Status == "active")
                .Select(u => u.Email)
                .ToListAsync(ct);

            var emailSvc = sp.GetRequiredService<IEmailService>();
            foreach (var adminEmail in adminEmails)
                await emailSvc.SendInvoiceNotificationAsync(adminEmail, invoiceId, total, ct);
        });

        return CreatedAtAction(nameof(GetById), new { id = invoice.Id }, invoice);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] CreateInvoiceDto dto)
    {
        var invoice = await _invoiceService.UpdateAsync(id, dto);
        if (invoice == null)
            return NotFound(new { detail = "Invoice not found." });

        _cache.RemoveByPrefix(Prefix);
        return Ok(invoice);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var deleted = await _invoiceService.DeleteAsync(id);
        if (!deleted)
            return NotFound(new { detail = "Invoice not found." });

        _cache.RemoveByPrefix(Prefix);
        return Ok(new { success = true });
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateInvoiceStatusDto dto)
    {
        var invoice = await _invoiceService.UpdateStatusAsync(id, dto);
        if (invoice == null)
            return NotFound(new { detail = "Invoice not found." });

        _cache.RemoveByPrefix(Prefix);
        return Ok(invoice);
    }

    [HttpGet("accounts-receivable")]
    public async Task<IActionResult> GetAccountsReceivable([FromQuery] string? status = null)
    {
        var key = $"{Prefix}ar:{status}";
        var result = await _cache.GetOrCreateAsync(key,
            () => _invoiceService.GetAccountsReceivableAsync(status),
            StatsTtl);
        return Ok(result);
    }

    [HttpGet("dashboard-stats")]
    public async Task<IActionResult> GetDashboardStats()
    {
        var key = $"{Prefix}stats";
        var stats = await _cache.GetOrCreateAsync(key,
            () => _invoiceService.GetDashboardStatsAsync(),
            StatsTtl);
        return Ok(stats);
    }
}
