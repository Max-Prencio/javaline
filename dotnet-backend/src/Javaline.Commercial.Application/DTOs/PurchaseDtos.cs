namespace Javaline.Commercial.Application.DTOs;

public record PurchaseOrderDto(
    string Id,
    string Supplier,
    string Item,
    decimal Qty,
    string Currency,
    decimal Total,
    string Status,
    string? Notes,
    string? CreatedBy,
    DateTime? ReceivedAt,
    DateTime CreatedAt
);

public record CreatePurchaseOrderDto(
    string Supplier,
    string Item,
    decimal Qty,
    string Currency,
    decimal Total,
    string Status,
    string? Notes,
    string? CreatedBy,
    DateTime? ReceivedAt
);

public record PurchaseOrderItemDto(
    string Id,
    string OrderId,
    string ProductName,
    string? Sku,
    decimal Quantity,
    decimal UnitPrice,
    decimal Total,
    DateTime CreatedAt
);

public record CreatePurchaseOrderItemDto(
    string OrderId,
    string ProductName,
    string? Sku,
    decimal Quantity,
    decimal UnitPrice,
    decimal Total
);
