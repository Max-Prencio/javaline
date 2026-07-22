using Javaline.Commercial.Domain.Entities;
using Javaline.Commercial.Domain.Interfaces;
using Javaline.Commercial.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Javaline.Commercial.Api.Controllers;

[ApiController]
[Route("sales")]
[Authorize]
public class SalesController : ControllerBase
{
    private readonly JavalineDbContext _db;
    private readonly IUnitOfWork _unitOfWork;

    public SalesController(JavalineDbContext db, IUnitOfWork unitOfWork)
    {
        _db = db;
        _unitOfWork = unitOfWork;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? productId = null,
        [FromQuery] string? customer = null,
        [FromQuery] string? from = null,
        [FromQuery] string? to = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        IQueryable<Sale> query = _db.Sales
            .Include(s => s.Product)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(productId))
            query = query.Where(s => s.ProductId == productId);

        if (!string.IsNullOrWhiteSpace(customer))
            query = query.Where(s => s.Customer != null && s.Customer.ToLower().Contains(customer.ToLower()));

        if (DateTime.TryParse(from, out var fromDate))
            query = query.Where(s => s.CreatedAt >= fromDate);

        if (DateTime.TryParse(to, out var toDate))
            query = query.Where(s => s.CreatedAt <= toDate);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync();

        return Ok(new { items, total, page, pageSize });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var sale = await _db.Sales
            .Include(s => s.Product)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (sale == null)
            return NotFound(new { detail = "Venta no encontrada." });

        return Ok(sale);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Sale sale)
    {
        var product = await _db.InventoryItems.FindAsync(new object[] { sale.ProductId });
        if (product == null)
            return BadRequest(new { detail = "Producto no encontrado." });

        sale.Id = Guid.NewGuid().ToString();
        sale.CreatedAt = DateTime.UtcNow;
        sale.Total = sale.Quantity * sale.UnitPrice;

        // Decrease inventory stock
        if (product.Stock < sale.Quantity)
            return BadRequest(new { detail = "Stock insuficiente." });

        product.Stock -= sale.Quantity;
        _db.InventoryItems.Update(product);

        await _db.Sales.AddAsync(sale);
        await _unitOfWork.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = sale.Id }, sale);
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(
        [FromQuery] string? from = null,
        [FromQuery] string? to = null)
    {
        IQueryable<Sale> query = _db.Sales.AsQueryable();

        if (DateTime.TryParse(from, out var fromDate))
            query = query.Where(s => s.CreatedAt >= fromDate);

        if (DateTime.TryParse(to, out var toDate))
            query = query.Where(s => s.CreatedAt <= toDate);

        var sales = await query.AsNoTracking().ToListAsync();

        return Ok(new
        {
            totalSales = sales.Count,
            totalRevenue = sales.Sum(s => s.Total),
            totalUnits = sales.Sum(s => s.Quantity),
        });
    }
}
