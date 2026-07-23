using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

[Table("stock_movements")]
public class StockMovement : BaseEntity
{
    [Column("product_id")]
    public string ProductId { get; set; } = string.Empty;

    [Column("quantity")]
    public decimal Quantity { get; set; }

    [Column("type")]
    public string Type { get; set; } = string.Empty;

    [Column("reason")]
    public string? Reason { get; set; }

    [Column("before_stock")]
    public decimal BeforeStock { get; set; }

    [Column("after_stock")]
    public decimal AfterStock { get; set; }

    [Column("user_id")]
    public string? UserId { get; set; }

    [Column("date")]
    public DateTime Date { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public InventoryItem Product { get; set; } = null!;

    [JsonIgnore]
    public User? User { get; set; }
}
