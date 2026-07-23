using System.Linq;
using System.Threading.Tasks;
using Javaline.Commercial.Application.DTOs;
using Javaline.Commercial.Application.Interfaces;
using Javaline.Commercial.Domain.Common;
using Javaline.Commercial.Domain.Entities;
using Javaline.Commercial.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Javaline.Commercial.Infrastructure.Services;

public class PurchaseService : IPurchaseService
{
    private readonly JavalineDbContext _db;

    public PurchaseService(JavalineDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<PurchaseOrderDto>> GetAllAsync(int page, int pageSize, string? search, string? status)
    {
        IQueryable<PurchaseOrder> query = _db.PurchaseOrders;

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(p => p.Status == status);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(p => p.Supplier.ToLower().Contains(term) || p.Item.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync();

        return new PagedResult<PurchaseOrderDto>
        {
            Items = items.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<PurchaseOrderDto?> GetByIdAsync(string id)
    {
        var entity = await _db.PurchaseOrders.FindAsync(new object[] { id });
        return entity == null ? null : MapToDto(entity);
    }

    public async Task<PurchaseOrderDto> CreateAsync(CreatePurchaseOrderDto dto, string userId)
    {
        var entity = new PurchaseOrder
        {
            Supplier = dto.Supplier,
            Item = dto.Item,
            Qty = dto.Qty,
            Currency = dto.Currency,
            Total = dto.Total,
            Status = dto.Status,
            Notes = dto.Notes,
            CreatedBy = userId,
            ReceivedAt = dto.ReceivedAt
        };

        await _db.PurchaseOrders.AddAsync(entity);
        await _db.SaveChangesAsync();

        return MapToDto(entity);
    }

    public async Task<PurchaseOrderDto?> UpdateAsync(string id, CreatePurchaseOrderDto dto)
    {
        var entity = await _db.PurchaseOrders.FindAsync(new object[] { id });
        if (entity == null) return null;

        entity.Supplier = dto.Supplier;
        entity.Item = dto.Item;
        entity.Qty = dto.Qty;
        entity.Currency = dto.Currency;
        entity.Total = dto.Total;
        entity.Status = dto.Status;
        entity.Notes = dto.Notes;
        entity.CreatedBy = dto.CreatedBy;
        entity.ReceivedAt = dto.ReceivedAt;

        _db.PurchaseOrders.Update(entity);
        await _db.SaveChangesAsync();

        return MapToDto(entity);
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var entity = await _db.PurchaseOrders.FindAsync(new object[] { id });
        if (entity == null) return false;

        _db.PurchaseOrders.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }

    // ─── Order Items ───

    public async Task<List<PurchaseOrderItemDto>> GetItemsByOrderIdAsync(string orderId)
    {
        return await _db.PurchaseOrderItems
            .Where(i => i.OrderId == orderId)
            .OrderBy(i => i.CreatedAt)
            .AsNoTracking()
            .Select(i => new PurchaseOrderItemDto(
                i.Id, i.OrderId, i.ProductName, i.Sku, i.Quantity, i.UnitPrice, i.Total, i.CreatedAt
            ))
            .ToListAsync();
    }

    public async Task<PurchaseOrderItemDto> CreateItemAsync(CreatePurchaseOrderItemDto dto)
    {
        var entity = new PurchaseOrderItem
        {
            OrderId = dto.OrderId,
            ProductName = dto.ProductName,
            Sku = dto.Sku,
            Quantity = dto.Quantity,
            UnitPrice = dto.UnitPrice,
            Total = dto.Total
        };

        await _db.PurchaseOrderItems.AddAsync(entity);
        await _db.SaveChangesAsync();

        return new PurchaseOrderItemDto(
            entity.Id, entity.OrderId, entity.ProductName, entity.Sku,
            entity.Quantity, entity.UnitPrice, entity.Total, entity.CreatedAt
        );
    }

    public async Task<PurchaseOrderItemDto?> UpdateItemAsync(string id, CreatePurchaseOrderItemDto dto)
    {
        var entity = await _db.PurchaseOrderItems.FindAsync(new object[] { id });
        if (entity == null) return null;

        entity.OrderId = dto.OrderId;
        entity.ProductName = dto.ProductName;
        entity.Sku = dto.Sku;
        entity.Quantity = dto.Quantity;
        entity.UnitPrice = dto.UnitPrice;
        entity.Total = dto.Total;

        _db.PurchaseOrderItems.Update(entity);
        await _db.SaveChangesAsync();

        return new PurchaseOrderItemDto(
            entity.Id, entity.OrderId, entity.ProductName, entity.Sku,
            entity.Quantity, entity.UnitPrice, entity.Total, entity.CreatedAt
        );
    }

    public async Task<bool> DeleteItemAsync(string id)
    {
        var entity = await _db.PurchaseOrderItems.FindAsync(new object[] { id });
        if (entity == null) return false;

        _db.PurchaseOrderItems.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }

    private static PurchaseOrderDto MapToDto(PurchaseOrder p) => new(
        p.Id, p.Supplier, p.Item, p.Qty, p.Currency, p.Total, p.Status,
        p.Notes, p.CreatedBy, p.ReceivedAt, p.CreatedAt
    );
}
