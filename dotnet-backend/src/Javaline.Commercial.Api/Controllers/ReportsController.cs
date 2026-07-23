using Javaline.Commercial.Application.Interfaces;
using Javaline.Commercial.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Javaline.Commercial.Api.Controllers;

[ApiController]
[Route("reports")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly JavalineDbContext _db;
    private readonly ICacheService _cache;
    private readonly IBackgroundTaskQueue _queue;

    public ReportsController(JavalineDbContext db, ICacheService cache, IBackgroundTaskQueue queue)
    {
        _db = db;
        _cache = cache;
        _queue = queue;
    }

    [HttpGet("sales-summary")]
    public async Task<IActionResult> GetSalesSummary(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        var startDate = from ?? DateTime.UtcNow.AddDays(-30);
        var endDate   = to   ?? DateTime.UtcNow;
        var cacheKey  = $"rpt:sales:{startDate:yyyyMMdd}:{endDate:yyyyMMdd}";

        var summary = await _cache.GetOrCreateAsync(cacheKey, () =>
            _db.Invoices
                .Where(i => i.Date >= startDate && i.Date <= endDate && i.Status == "Paid")
                .GroupBy(i => i.Date.Date)
                .Select(g => new SalesSummaryDayDto(
                    g.Key, g.Count(),
                    g.Sum(i => i.Subtotal), g.Sum(i => i.Tax),
                    g.Sum(i => i.DiscountAmount), g.Sum(i => i.Total)))
                .OrderBy(s => s.Date)
                .AsNoTracking()
                .ToListAsync(),
            TimeSpan.FromMinutes(5));

        return Ok(summary);
    }

    [HttpGet("inventory-valuation")]
    public async Task<IActionResult> GetInventoryValuation()
    {
        var result = await _db.InventoryItems
            .Where(i => i.Active)
            .GroupBy(i => 1)
            .Select(g => new InventoryValuationDto(
                g.Sum(i => i.Stock * i.Cost),
                g.Sum(i => i.Stock * i.Price),
                g.Count(),
                g.Sum(i => i.Stock)))
            .AsNoTracking()
            .FirstOrDefaultAsync();

        return Ok(result ?? new InventoryValuationDto(0, 0, 0, 0));
    }

    // Top-products deserializes JSON per invoice — CPU-intensive with large datasets.
    // Pattern: cache hit → 200, cache miss → enqueue + 202, retry → 200 once ready.
    [HttpGet("top-products")]
    public async Task<IActionResult> GetTopProducts([FromQuery] int limit = 10)
    {
        var cacheKey = $"rpt:top-products:{limit}";

        if (_cache.TryGet<List<TopProductDto>>(cacheKey, out var cached))
            return Ok(cached);

        await _queue.QueueAsync(async (sp, ct) =>
        {
            var db    = sp.GetRequiredService<JavalineDbContext>();
            var cache = sp.GetRequiredService<ICacheService>();

            var invoices = await db.Invoices
                .Where(i => i.Status == "Paid" && i.Items != null)
                .Select(i => i.Items!)
                .AsNoTracking()
                .ToListAsync(ct);

            var productSales = new Dictionary<string, (string? Sku, decimal Qty, decimal Revenue, int Sold)>();
            var jsonOpts = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            foreach (var itemsJson in invoices)
            {
                try
                {
                    var items = System.Text.Json.JsonSerializer.Deserialize<List<CreateInvoiceItemDto>>(itemsJson, jsonOpts);
                    if (items == null) continue;
                    foreach (var item in items)
                    {
                        var k = item.Name;
                        if (!productSales.TryGetValue(k, out var acc)) acc = (item.Sku, 0, 0, 0);
                        productSales[k] = (acc.Sku, acc.Qty + item.Quantity, acc.Revenue + item.Total, acc.Sold + 1);
                    }
                }
                catch (System.Text.Json.JsonException) { continue; }
            }

            var result = productSales.Values
                .OrderByDescending(p => p.Qty)
                .Take(limit)
                .Select(p => new TopProductDto(p.Sku, p.Qty, p.Revenue, p.Sold))
                .ToList();

            cache.Set(cacheKey, result, TimeSpan.FromMinutes(10));
        });

        return Accepted(new { message = "Reporte en proceso. Intenta de nuevo en unos segundos.", retryAfter = 3 });
    }

    [HttpGet("tax-summary")]
    public async Task<IActionResult> GetTaxSummary(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        var startDate = from ?? DateTime.UtcNow.AddDays(-30);
        var endDate = to ?? DateTime.UtcNow;

        var result = await _db.Invoices
            .Where(i => i.Date >= startDate && i.Date <= endDate && i.Status == "Paid")
            .GroupBy(i => 1)
            .Select(g => new TaxSummaryDto(
                g.Sum(i => i.Tax),
                g.Sum(i => i.TaxableBase),
                g.Count(),
                g.Sum(i => i.TaxableBase) > 0
                    ? g.Sum(i => i.Tax) / g.Sum(i => i.TaxableBase) * 100
                    : 0))
            .AsNoTracking()
            .FirstOrDefaultAsync();

        return Ok(result ?? new TaxSummaryDto(0, 0, 0, 0));
    }
}

public record SalesSummaryDayDto(
    DateTime Date,
    int InvoiceCount,
    decimal Subtotal,
    decimal Tax,
    decimal Discount,
    decimal Total);

public record InventoryValuationDto(
    decimal TotalCostValue,
    decimal TotalRetailValue,
    int TotalProducts,
    decimal TotalUnits);

public record TopProductDto(
    string? Sku,
    decimal TotalQuantity,
    decimal TotalRevenue,
    int TimesSold);

public record TaxSummaryDto(
    decimal TotalTax,
    decimal TotalTaxableBase,
    int InvoiceCount,
    decimal AverageTaxRate);

public class CreateInvoiceItemDto
{
    public string Name { get; set; } = "";
    public string? Sku { get; set; }
    public decimal Quantity { get; set; }
    public decimal Total { get; set; }
}
