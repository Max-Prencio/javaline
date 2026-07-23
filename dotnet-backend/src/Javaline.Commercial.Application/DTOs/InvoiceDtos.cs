using System.Text.Json;

namespace Javaline.Commercial.Application.DTOs;

public record InvoiceDto(
    string Id,
    string Type,
    string? ClientName,
    string? ClientId,
    string? Rnc,
    DateTime Date,
    DateTime? DueDate,
    string Currency,
    string? PaymentType,
    string? PaymentMethod,
    string Items,
    decimal Subtotal,
    decimal Discount,
    string? DiscountType,
    decimal DiscountAmount,
    decimal TaxableBase,
    string? TaxRateId,
    decimal Tax,
    decimal Total,
    string Status,
    string? Notes,
    string? InstallmentPlan,
    string? CashRegisterId,
    decimal? AmountReceived,
    decimal? ChangeReturned,
    string? RectifiesId,
    string? CreatedBy,
    DateTime? PaidAt,
    DateTime CreatedAt
);

public record CreateInvoiceDto(
    string Type,
    string? ClientName,
    string? ClientId,
    string? Rnc,
    DateTime? DueDate,
    string Currency,
    string? PaymentType,
    string? PaymentMethod,
    JsonElement Items,
    decimal Subtotal,
    decimal Discount,
    string? DiscountType,
    decimal DiscountAmount,
    decimal TaxableBase,
    string? TaxRateId,
    decimal Tax,
    decimal Total,
    string Status,
    string? Notes,
    string? InstallmentPlan,
    string? CashRegisterId,
    decimal? AmountReceived,
    decimal? ChangeReturned
);

public static class InvoiceItemsHelper
{
    public static string ToJsonString(JsonElement items)
    {
        if (items.ValueKind == JsonValueKind.String)
            return items.GetString() ?? "[]";
        return items.GetRawText();
    }
}

public record UpdateInvoiceStatusDto(string Status);

public record AccountsReceivableDto(
    string Id,
    string? ClientName,
    string? ClientId,
    string? Rnc,
    string Type,
    decimal Total,
    decimal PaidAmount,
    decimal Balance,
    DateTime Date,
    DateTime? DueDate,
    int DaysOverdue,
    string Status,
    string? PaymentType,
    string? Notes,
    DateTime CreatedAt
);

public record DashboardStatsDto(
    int TotalInvoices,
    decimal TotalRevenue,
    decimal PendingAmount,
    decimal PaidAmount,
    int OverdueInvoices,
    int TotalClients,
    int TotalProducts,
    decimal LowStockCount
);

public record CreateInvoiceItemDto(
    string Name,
    string? Sku,
    decimal Quantity,
    decimal UnitPrice,
    decimal TaxRate,
    decimal Discount,
    decimal Total
);
