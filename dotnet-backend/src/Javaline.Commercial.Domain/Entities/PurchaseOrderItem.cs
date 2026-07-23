using System.ComponentModel.DataAnnotations.Schema;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

[Table("purchase_order_items")]
public class PurchaseOrderItem : BaseEntity
{
    [Column("order_id")]
    public string OrderId { get; set; } = string.Empty;

    [Column("product_name")]
    public string ProductName { get; set; } = string.Empty;

    [Column("sku")]
    public string? Sku { get; set; }

    [Column("quantity")]
    public decimal Quantity { get; set; }

    [Column("unit_price")]
    public decimal UnitPrice { get; set; }

    [Column("total")]
    public decimal Total { get; set; }

    public PurchaseOrder PurchaseOrder { get; set; } = null!;
}
