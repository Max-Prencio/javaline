using System.Linq;
using System.Threading.Tasks;
using Javaline.Commercial.Application.DTOs;
using Javaline.Commercial.Application.Interfaces;
using Javaline.Commercial.Domain.Common;
using Javaline.Commercial.Domain.Entities;
using Javaline.Commercial.Domain.Interfaces;
using Javaline.Commercial.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Javaline.Commercial.Infrastructure.Services;

public class InventoryService : IInventoryService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly JavalineDbContext _db;

    public InventoryService(IUnitOfWork unitOfWork, JavalineDbContext db)
    {
        _unitOfWork = unitOfWork;
        _db = db;
    }

    public async Task<PagedResult<InventoryItemDto>> GetAllAsync(int page, int pageSize, string? search, string? category)
    {
        IQueryable<InventoryItem> query = _db.InventoryItems;

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(i => i.Name.ToLower().Contains(term) || i.Sku.ToLower().Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(i => i.Category == category);

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(i => i.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync();

        return new PagedResult<InventoryItemDto>(
            items.Select(MapToDto).ToList(),
            totalCount,
            page,
            pageSize
        );
    }

    public async Task<InventoryItemDto?> GetByIdAsync(string id)
    {
        var item = await _db.InventoryItems.FindAsync(new object[] { id });
        return item == null ? null : MapToDto(item);
    }

    public async Task<InventoryItemDto> CreateAsync(CreateInventoryItemDto dto, string userId)
    {
        var item = new InventoryItem
        {
            Name = dto.Name,
            Sku = dto.Sku,
            Shelf = dto.Shelf,
            Row = dto.Row,
            Box = dto.Box,
            Category = dto.Category,
            Stock = dto.Stock,
            MinStock = dto.MinStock,
            Price = dto.Price,
            Cost = dto.Cost,
            Location = dto.Location,
            Unit = dto.Unit,
            Batch = dto.Batch,
            ExpiryDate = dto.ExpiryDate,
            Description = dto.Description,
            Active = true
        };

        await _db.InventoryItems.AddAsync(item);
        await _unitOfWork.SaveChangesAsync();

        return MapToDto(item);
    }

    public async Task<InventoryItemDto?> UpdateAsync(string id, CreateInventoryItemDto dto)
    {
        var item = await _db.InventoryItems.FindAsync(new object[] { id });
        if (item == null) return null;

        item.Name = dto.Name;
        item.Sku = dto.Sku;
        item.Shelf = dto.Shelf;
        item.Row = dto.Row;
        item.Box = dto.Box;
        item.Category = dto.Category;
        item.Stock = dto.Stock;
        item.MinStock = dto.MinStock;
        item.Price = dto.Price;
        item.Cost = dto.Cost;
        item.Location = dto.Location;
        item.Unit = dto.Unit;
        item.Batch = dto.Batch;
        item.ExpiryDate = dto.ExpiryDate;
        item.Description = dto.Description;

        _db.InventoryItems.Update(item);
        await _unitOfWork.SaveChangesAsync();

        return MapToDto(item);
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var item = await _db.InventoryItems.FindAsync(new object[] { id });
        if (item == null) return false;

        _db.InventoryItems.Remove(item);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<StockMovementDto> RegisterMovementAsync(RegisterMovementDto dto, string userId)
    {
        var product = await _db.InventoryItems.FindAsync(new object[] { dto.ProductId })
            ?? throw new ApplicationException("Product not found.");

        var beforeStock = product.Stock;

        product.Stock = dto.Type.ToLower() switch
        {
            "entry" => product.Stock + dto.Quantity,
            "exit" => product.Stock - dto.Quantity,
            "adjustment" => dto.Quantity,
            _ => throw new ApplicationException($"Invalid movement type: {dto.Type}")
        };

        if (product.Stock < 0)
            throw new ApplicationException("Stock cannot be negative.");

        var movement = new StockMovement
        {
            ProductId = dto.ProductId,
            Quantity = dto.Quantity,
            Type = dto.Type,
            Reason = dto.Reason,
            BeforeStock = beforeStock,
            AfterStock = product.Stock,
            UserId = userId,
            Date = DateTime.UtcNow
        };

        await _db.StockMovements.AddAsync(movement);
        await _unitOfWork.SaveChangesAsync();

        var user = await _db.Users.FindAsync(new object[] { userId });

        return new StockMovementDto(
            movement.Id,
            movement.ProductId,
            product.Name,
            movement.Quantity,
            movement.Type,
            movement.Reason,
            movement.BeforeStock,
            movement.AfterStock,
            movement.UserId,
            user?.Name,
            movement.Date,
            movement.CreatedAt
        );
    }

    public async Task<List<StockMovementDto>> GetMovementsAsync(string productId, int limit)
    {
        var movements = await _db.StockMovements
            .Where(s => s.ProductId == productId)
            .OrderByDescending(s => s.Date)
            .Take(limit)
            .AsNoTracking()
            .ToListAsync();

        var userIds = movements.Where(m => m.UserId != null).Select(m => m.UserId!).Distinct().ToList();
        var users = await _db.Users.Where(u => userIds.Contains(u.Id)).ToListAsync();
        var userMap = users.ToDictionary(u => u.Id, u => u.Name);

        var productName = await _db.InventoryItems
            .Where(i => i.Id == productId)
            .Select(i => i.Name)
            .FirstOrDefaultAsync() ?? string.Empty;

        return movements.Select(m => new StockMovementDto(
            m.Id,
            m.ProductId,
            productName,
            m.Quantity,
            m.Type,
            m.Reason,
            m.BeforeStock,
            m.AfterStock,
            m.UserId,
            m.UserId != null && userMap.TryGetValue(m.UserId, out var name) ? name : null,
            m.Date,
            m.CreatedAt
        )).ToList();
    }

    public async Task<List<LowStockItemDto>> GetLowStockItemsAsync()
    {
        var items = await _db.InventoryItems
            .Where(i => i.Active && i.Stock <= i.MinStock)
            .OrderBy(i => i.Stock)
            .AsNoTracking()
            .ToListAsync();

        return items.Select(i => new LowStockItemDto(
            i.Id,
            i.Name,
            i.Sku,
            i.Stock,
            i.MinStock,
            i.Category
        )).ToList();
    }

    private static InventoryItemDto MapToDto(InventoryItem item) => new(
        item.Id,
        item.Name,
        item.Sku,
        item.Shelf,
        item.Row,
        item.Box,
        item.Category,
        item.Stock,
        item.MinStock,
        item.Price,
        item.Cost,
        item.Location,
        item.Unit,
        item.Batch,
        item.ExpiryDate,
        item.Description,
        item.Active,
        item.CreatedAt
    );
}
