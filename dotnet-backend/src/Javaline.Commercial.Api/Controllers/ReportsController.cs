using Javaline.Commercial.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Javaline.Commercial.Api.Controllers;

[ApiController]
[Route("reports")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly JavalineDbContext _db;

    public ReportsController(JavalineDbContext db)
    {
        _db = db;
    }

    [HttpGet("sales-summary")]
    public async Task<IActionResult> GetSalesSummary(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        var startDate = from ?? DateTime.UtcNow.AddDays(-30);
        var endDate = to ?? DateTime.UtcNow;

        var summary = await _db.Invoices
            .Where(i => i.Date >= startDate && i.Date <= endDate && i.Status == "Paid")
            .GroupBy(i => i.Date.Date)
            .Select(g => new SalesSummaryDayDto(
                g.Key,
                g.Count(),
                g.Sum(i => i.Subtotal),
                g.Sum(i => i.Tax),
                g.Sum(i => i.DiscountAmount),
                g.Sum(i => i.Total)))
            .OrderBy(s => s.Date)
            .AsNoTracking()
            .ToListAsync();

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

    [HttpGet("top-products")]
    public async Task<IActionResult> GetTopProducts([FromQuery] int limit = 10)
    {
        var invoices = await _db.Invoices
            .Where(i => i.Status == "Paid" && i.Items != null)
            .Select(i => i.Items!)
            .AsNoTracking()
            .ToListAsync();

        var productSales = new Dictionary<string, (string? Sku, decimal Qty, decimal Revenue, int Sold)>();

        foreach (var itemsJson in invoices)
        {
            try
            {
                var items = System.Text.Json.JsonSerializer.Deserialize<List<CreateInvoiceItemDto>>(itemsJson,
                    new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (items == null) continue;

                foreach (var item in items)
                {
                    var key = item.Name;
                    if (!productSales.TryGetValue(key, out var acc))
                        acc = (item.Sku, 0, 0, 0);

                    productSales[key] = (
                        acc.Sku,
                        acc.Qty + item.Quantity,
                        acc.Revenue + item.Total,
                        acc.Sold + 1
                    );
                }
            }
            catch (System.Text.Json.JsonException)
            {
                continue;
            }
        }

        var topProducts = productSales.Values
            .OrderByDescending(p => p.Qty)
            .Take(limit)
            .Select(p => new TopProductDto(p.Sku, p.Qty, p.Revenue, p.Sold))
            .ToList();

        return Ok(topProducts);
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
