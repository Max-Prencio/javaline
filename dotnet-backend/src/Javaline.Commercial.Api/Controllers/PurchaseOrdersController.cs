using System.Security.Claims;
using Javaline.Commercial.Application.DTOs;
using Javaline.Commercial.Application.Interfaces;
using Javaline.Commercial.Domain.Common;
using Javaline.Commercial.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Javaline.Commercial.Api.Controllers;

[ApiController]
[Route("purchases")]
[Authorize]
public class PurchaseOrdersController : ControllerBase
{
    private readonly IPurchaseService _purchaseService;
    private readonly IStockService _stockService;

    public PurchaseOrdersController(IPurchaseService purchaseService, IStockService stockService)
    {
        _purchaseService = purchaseService;
        _stockService = stockService;
    }

    private string? GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? User.FindFirst("sub")?.Value;

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null)
    {
        var result = await _purchaseService.GetAllAsync(page, pageSize, search, status);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var item = await _purchaseService.GetByIdAsync(id);
        if (item == null) return NotFound(new { detail = "Purchase order not found." });
        return Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePurchaseOrderDto dto)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { detail = "User not authenticated." });

        var item = await _purchaseService.CreateAsync(dto, userId);
        return Ok(item);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] CreatePurchaseOrderDto dto)
    {
        var item = await _purchaseService.UpdateAsync(id, dto);
        if (item == null) return NotFound(new { detail = "Purchase order not found." });
        return Ok(item);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var deleted = await _purchaseService.DeleteAsync(id);
        if (!deleted) return NotFound(new { detail = "Purchase order not found." });
        return Ok(new { success = true });
    }

    // ─── Order Items ───

    [HttpGet("{id}/items")]
    public async Task<IActionResult> GetItems(string id)
    {
        var items = await _purchaseService.GetItemsByOrderIdAsync(id);
        return Ok(items);
    }

    [HttpPost("{id}/items")]
    public async Task<IActionResult> AddItem(string id, [FromBody] CreatePurchaseOrderItemDto dto)
    {
        var orderDto = dto with { OrderId = id };
        var item = await _purchaseService.CreateItemAsync(orderDto);
        return Ok(item);
    }

    [HttpDelete("{id}/items/{itemId}")]
    public async Task<IActionResult> DeleteItem(string id, string itemId)
    {
        var deleted = await _purchaseService.DeleteItemAsync(itemId);
        if (!deleted) return NotFound(new { detail = "Item not found." });
        return Ok(new { success = true });
    }

    [HttpPost("{id}/receive")]
    public async Task<IActionResult> ReceiveOrder(string id)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var results = await _stockService.ReceiveFromPurchaseAsync(id, userId);
        return Ok(results);
    }
}
