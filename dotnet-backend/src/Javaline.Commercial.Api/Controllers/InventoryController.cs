using System.Security.Claims;
using Javaline.Commercial.Application.DTOs;
using Javaline.Commercial.Application.Interfaces;
using Javaline.Commercial.Domain.Common;
using Javaline.Commercial.Infrastructure.Data;
using Javaline.Commercial.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Javaline.Commercial.Api.Controllers;

[ApiController]
[Route("inventory")]
[Authorize]
public class InventoryController : ControllerBase
{
    private readonly IInventoryService _inventoryService;
    private readonly IStockService _stockService;
    private readonly JavalineDbContext _db;

    public InventoryController(IInventoryService inventoryService, IStockService stockService, JavalineDbContext db)
    {
        _inventoryService = inventoryService;
        _stockService = stockService;
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? category = null)
    {
        var result = await _inventoryService.GetAllAsync(page, pageSize, search, category);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var item = await _inventoryService.GetByIdAsync(id);
        if (item == null)
            return NotFound(new { detail = "Inventory item not found." });

        return Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateInventoryItemDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { detail = "User not authenticated." });

        var item = await _inventoryService.CreateAsync(dto, userId);
        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] CreateInventoryItemDto dto)
    {
        var item = await _inventoryService.UpdateAsync(id, dto);
        if (item == null)
            return NotFound(new { detail = "Inventory item not found." });

        return Ok(item);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var deleted = await _inventoryService.DeleteAsync(id);
        if (!deleted)
            return NotFound(new { detail = "Inventory item not found." });

        return Ok(new { success = true });
    }

    [HttpPost("movements")]
    public async Task<IActionResult> RegisterMovement([FromBody] RegisterMovementDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { detail = "User not authenticated." });

        var movement = await _inventoryService.RegisterMovementAsync(dto, userId);
        return CreatedAtAction(nameof(GetMovements), new { id = dto.ProductId }, movement);
    }

    [HttpGet("{id}/movements")]
    public async Task<IActionResult> GetMovements(string id, [FromQuery] int limit = 50)
    {
        var movements = await _inventoryService.GetMovementsAsync(id, limit);
        return Ok(movements);
    }

    [HttpGet("low-stock")]
    public async Task<IActionResult> GetLowStock()
    {
        var items = await _inventoryService.GetLowStockItemsAsync();
        return Ok(items);
    }

    [HttpPost("{id}/adjust")]
    public async Task<IActionResult> AdjustStock(string id, [FromBody] StockAdjustDto data)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _stockService.AdjustStockAsync(id, data.Quantity, data.Reason, userId);
        return Ok(new { item = result.Item, movement = result.Movement });
    }

    [HttpGet("stats/summary")]
    public async Task<IActionResult> GetStatsSummary()
    {
        var items = await _db.InventoryItems.Where(i => i.Active).AsNoTracking().ToListAsync();
        return Ok(new
        {
            totalProducts = items.Count,
            totalStock = items.Sum(i => (int)i.Stock),
            totalValue = items.Sum(i => i.Stock * i.Cost),
            lowStock = items.Count(i => i.Stock > 0 && i.Stock <= i.MinStock),
            categories = items.Select(i => i.Category).Where(c => !string.IsNullOrEmpty(c)).Distinct().Count()
        });
    }
}

public class StockAdjustDto
{
    public int Quantity { get; set; }
    public string Reason { get; set; } = "";
}
