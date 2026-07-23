namespace Javaline.Commercial.Application.DTOs;

public record InventoryItemDto(
    string Id,
    string Name,
    string Sku,
    string? Shelf,
    string? Row,
    string? Box,
    string? Category,
    decimal Stock,
    decimal MinStock,
    decimal Price,
    decimal Cost,
    string? Location,
    string? Unit,
    string? Batch,
    DateTime? ExpiryDate,
    string? Description,
    bool Active,
    DateTime CreatedAt
);

public record CreateInventoryItemDto(
    string Name,
    string Sku,
    string? Shelf,
    string? Row,
    string? Box,
    string? Category,
    decimal Stock,
    decimal MinStock,
    decimal Price,
    decimal Cost,
    string? Location,
    string? Unit,
    string? Batch,
    DateTime? ExpiryDate,
    string? Description
);

public record StockMovementDto(
    string Id,
    string ProductId,
    string ProductName,
    decimal Quantity,
    string Type,
    string? Reason,
    decimal BeforeStock,
    decimal AfterStock,
    string? UserId,
    string? UserName,
    DateTime Date,
    DateTime CreatedAt
);

public record RegisterMovementDto(
    string ProductId,
    decimal Quantity,
    string Type,
    string? Reason
);

public record LowStockItemDto(
    string Id,
    string Name,
    string Sku,
    decimal Stock,
    decimal MinStock,
    string? Category
);
