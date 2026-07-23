using Javaline.Commercial.Application.DTOs;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Application.Interfaces;

public interface IPurchaseService
{
    Task<PagedResult<PurchaseOrderDto>> GetAllAsync(int page, int pageSize, string? search, string? status);
    Task<PurchaseOrderDto?> GetByIdAsync(string id);
    Task<PurchaseOrderDto> CreateAsync(CreatePurchaseOrderDto dto, string userId);
    Task<PurchaseOrderDto?> UpdateAsync(string id, CreatePurchaseOrderDto dto);
    Task<bool> DeleteAsync(string id);

    Task<List<PurchaseOrderItemDto>> GetItemsByOrderIdAsync(string orderId);
    Task<PurchaseOrderItemDto> CreateItemAsync(CreatePurchaseOrderItemDto dto);
    Task<PurchaseOrderItemDto?> UpdateItemAsync(string id, CreatePurchaseOrderItemDto dto);
    Task<bool> DeleteItemAsync(string id);
}
