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
    private readonly ICacheService _cache;

    private static readonly TimeSpan ListTtl  = TimeSpan.FromMinutes(2);
    private static readonly TimeSpan StatsTtl = TimeSpan.FromMinutes(5);
    private const string Prefix = "inv:";

    public InventoryController(
        IInventoryService inventoryService,
        IStockService stockService,
        JavalineDbContext db,
        ICacheService cache)
    {
        _inventoryService = inventoryService;
        _stockService = stockService;
        _db = db;
        _cache = cache;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? category = null)
    {
        var key = $"{Prefix}list:{page}:{pageSize}:{search}:{category}";
        var result = await _cache.GetOrCreateAsync(key,
            () => _inventoryService.GetAllAsync(page, pageSize, search, category),
            ListTtl);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var key = $"{Prefix}id:{id}";
        var item = await _cache.GetOrCreateAsync(key,
            () => _inventoryService.GetByIdAsync(id),
            ListTtl);

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
        _cache.RemoveByPrefix(Prefix);
        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] CreateInventoryItemDto dto)
    {
        var item = await _inventoryService.UpdateAsync(id, dto);
        if (item == null)
            return NotFound(new { detail = "Inventory item not found." });

        _cache.RemoveByPrefix(Prefix);
        return Ok(item);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var deleted = await _inventoryService.DeleteAsync(id);
        if (!deleted)
            return NotFound(new { detail = "Inventory item not found." });

        _cache.RemoveByPrefix(Prefix);
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
        _cache.RemoveByPrefix(Prefix);
        return CreatedAtAction(nameof(GetMovements), new { id = dto.ProductId }, movement);
    }

    [HttpGet("{id}/movements")]
    public async Task<IActionResult> GetMovements(string id, [FromQuery] int limit = 50)
    {
        var key = $"{Prefix}movements:{id}:{limit}";
        var movements = await _cache.GetOrCreateAsync(key,
            () => _inventoryService.GetMovementsAsync(id, limit),
            ListTtl);
        return Ok(movements);
    }

    [HttpGet("low-stock")]
    public async Task<IActionResult> GetLowStock()
    {
        var key = $"{Prefix}low-stock";
        var items = await _cache.GetOrCreateAsync(key,
            () => _inventoryService.GetLowStockItemsAsync(),
            StatsTtl);
        return Ok(items);
    }

    [HttpPost("{id}/adjust")]
    public async Task<IActionResult> AdjustStock(string id, [FromBody] StockAdjustDto data)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _stockService.AdjustStockAsync(id, data.Quantity, data.Reason, userId);
        _cache.RemoveByPrefix(Prefix);
        return Ok(new { item = result.Item, movement = result.Movement });
    }

    [HttpGet("stats/summary")]
    public async Task<IActionResult> GetStatsSummary()
    {
        var key = $"{Prefix}stats";
        var stats = await _cache.GetOrCreateAsync(key, async () =>
        {
            var items = await _db.InventoryItems.Where(i => i.Active).AsNoTracking().ToListAsync();
            return new
            {
                totalProducts = items.Count,
                totalStock    = items.Sum(i => (int)i.Stock),
                totalValue    = items.Sum(i => i.Stock * i.Cost),
                lowStock      = items.Count(i => i.Stock > 0 && i.Stock <= i.MinStock),
                categories    = items.Select(i => i.Category).Where(c => !string.IsNullOrEmpty(c)).Distinct().Count()
            };
        }, StatsTtl);

        return Ok(stats);
    }
}

public class StockAdjustDto
{
    public int Quantity { get; set; }
    public string Reason { get; set; } = "";
}
