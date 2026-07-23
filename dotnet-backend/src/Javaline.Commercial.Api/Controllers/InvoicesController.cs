using System.Security.Claims;
using Javaline.Commercial.Application.DTOs;
using Javaline.Commercial.Application.Interfaces;
using Javaline.Commercial.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Javaline.Commercial.Api.Controllers;

[ApiController]
[Route("invoices")]
[Authorize]
public class InvoicesController : ControllerBase
{
    private readonly IInvoiceService _invoiceService;

    public InvoicesController(IInvoiceService invoiceService) => _invoiceService = invoiceService;

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] string? type = null,
        [FromQuery] string? search = null)
    {
        var result = await _invoiceService.GetAllAsync(page, pageSize, status, type, search);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var invoice = await _invoiceService.GetByIdAsync(id);
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
        return CreatedAtAction(nameof(GetById), new { id = invoice.Id }, invoice);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] CreateInvoiceDto dto)
    {
        var invoice = await _invoiceService.UpdateAsync(id, dto);
        if (invoice == null)
            return NotFound(new { detail = "Invoice not found." });

        return Ok(invoice);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var deleted = await _invoiceService.DeleteAsync(id);
        if (!deleted)
            return NotFound(new { detail = "Invoice not found." });

        return Ok(new { success = true });
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateInvoiceStatusDto dto)
    {
        var invoice = await _invoiceService.UpdateStatusAsync(id, dto);
        if (invoice == null)
            return NotFound(new { detail = "Invoice not found." });

        return Ok(invoice);
    }

    [HttpGet("accounts-receivable")]
    public async Task<IActionResult> GetAccountsReceivable([FromQuery] string? status = null)
    {
        var result = await _invoiceService.GetAccountsReceivableAsync(status);
        return Ok(result);
    }

    [HttpGet("dashboard-stats")]
    public async Task<IActionResult> GetDashboardStats()
    {
        var stats = await _invoiceService.GetDashboardStatsAsync();
        return Ok(stats);
    }
}
