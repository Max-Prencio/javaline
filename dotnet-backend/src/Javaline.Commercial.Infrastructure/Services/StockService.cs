using Javaline.Commercial.Infrastructure.Data;
using Javaline.Commercial.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Javaline.Commercial.Infrastructure.Services;

public interface IStockService
{
    Task<StockAdjustResult> AdjustStockAsync(string productId, int quantity, string reason, string userId);
    Task<List<StockAdjustResult>> ReceiveFromPurchaseAsync(string orderId, string userId);
    Task<bool> CheckStockAvailableAsync(string productId, int quantity);
    Task<StockAdjustResult> DeductSaleStockAsync(string productId, int quantity, string reason, string userId);
}

public class StockAdjustResult
{
    public InventoryItem Item { get; set; } = null!;
    public StockMovement Movement { get; set; } = null!;
}

public class StockService : IStockService
{
    private readonly JavalineDbContext _db;

    public StockService(JavalineDbContext db) => _db = db;

    public async Task<StockAdjustResult> AdjustStockAsync(string productId, int quantity, string reason, string userId)
    {
        var item = await _db.InventoryItems.FindAsync(productId)
            ?? throw new KeyNotFoundException("Producto no encontrado");

        var before = item.Stock;
        var newStock = Math.Max(0, before + quantity);
        item.Stock = newStock;

        var movement = new StockMovement
        {
            Id = Guid.NewGuid().ToString(),
            ProductId = productId,
            Quantity = quantity,
            Type = quantity > 0 ? "in" : "out",
            Reason = reason,
            BeforeStock = before,
            AfterStock = newStock,
            UserId = userId,
            Date = DateTime.UtcNow
        };
        _db.StockMovements.Add(movement);
        await _db.SaveChangesAsync();

        return new StockAdjustResult { Item = item, Movement = movement };
    }

    public async Task<List<StockAdjustResult>> ReceiveFromPurchaseAsync(string orderId, string userId)
    {
        var order = await _db.PurchaseOrders.FindAsync(orderId)
            ?? throw new KeyNotFoundException("Orden no encontrada");

        var results = new List<StockAdjustResult>();

        // Try to find by name, create if not exists
        var existing = await _db.InventoryItems.FirstOrDefaultAsync(i =>
            i.Name.ToLower() == order.Item.ToLower());

        if (existing != null)
        {
            var result = await AdjustStockAsync(existing.Id, (int)order.Qty,
                $"Recepción OC {orderId} — {order.Supplier}", userId);
            results.Add(result);
        }
        else
        {
            var unitPrice = order.Qty > 0 ? Math.Round(order.Total / order.Qty, 2) : 0;
            var item = new InventoryItem
            {
                Id = Guid.NewGuid().ToString(),
                Name = order.Item,
                Sku = $"SKU-{orderId[..Math.Min(8, orderId.Length)]}",
                Category = "General",
                Stock = (int)order.Qty,
                Price = unitPrice,
                Cost = unitPrice,
                Description = $"Recibido de {order.Supplier} vía {orderId}",
                Active = true,
                CreatedAt = DateTime.UtcNow
            };
            _db.InventoryItems.Add(item);

            var movement = new StockMovement
            {
                Id = Guid.NewGuid().ToString(),
                Quantity = (int)order.Qty,
                Type = "in",
                Reason = $"Recepción OC {orderId} — {order.Supplier}",
                BeforeStock = 0,
                AfterStock = (int)order.Qty,
                UserId = userId,
                Date = DateTime.UtcNow
            };
            _db.StockMovements.Add(movement);
            await _db.SaveChangesAsync();
            results.Add(new StockAdjustResult { Item = item, Movement = movement });
        }

        order.Status = "recibido";
        order.ReceivedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return results;
    }

    public async Task<bool> CheckStockAvailableAsync(string productId, int quantity)
    {
        var item = await _db.InventoryItems.FindAsync(productId);
        return item != null && item.Stock >= quantity;
    }

    public async Task<StockAdjustResult> DeductSaleStockAsync(string productId, int quantity, string reason, string userId)
    {
        if (!await CheckStockAvailableAsync(productId, quantity))
            throw new ApplicationException("Stock insuficiente para realizar la venta");

        return await AdjustStockAsync(productId, -quantity, reason, userId);
    }
}
