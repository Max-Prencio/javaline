using Javaline.Commercial.Application.DTOs;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Application.Interfaces;

public interface IInventoryService
{
    Task<PagedResult<InventoryItemDto>> GetAllAsync(int page, int pageSize, string? search, string? category);
    Task<InventoryItemDto?> GetByIdAsync(string id);
    Task<InventoryItemDto> CreateAsync(CreateInventoryItemDto dto, string userId);
    Task<InventoryItemDto?> UpdateAsync(string id, CreateInventoryItemDto dto);
    Task<bool> DeleteAsync(string id);
    Task<StockMovementDto> RegisterMovementAsync(RegisterMovementDto dto, string userId);
    Task<List<StockMovementDto>> GetMovementsAsync(string productId, int limit);
    Task<List<LowStockItemDto>> GetLowStockItemsAsync();
}
