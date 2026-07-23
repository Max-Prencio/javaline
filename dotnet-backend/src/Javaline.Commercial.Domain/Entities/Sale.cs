using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

[Table("sales")]
public class Sale : BaseEntity
{
    [Column("product_id")]
    public string ProductId { get; set; } = string.Empty;

    [Column("quantity")]
    public decimal Quantity { get; set; }

    [Column("unit_price")]
    public decimal UnitPrice { get; set; }

    [Column("total")]
    public decimal Total { get; set; }

    [Column("customer")]
    public string? Customer { get; set; }

    [Column("user_id")]
    public string? UserId { get; set; }

    [JsonIgnore]
    public InventoryItem Product { get; set; } = null!;
}
