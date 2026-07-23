using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

[Table("inventory")]
public class InventoryItem : BaseEntity
{
    [Column("tenant_id")]
    public string TenantId { get; set; } = "default";

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("sku")]
    public string Sku { get; set; } = string.Empty;

    [Column("shelf")]
    public string? Shelf { get; set; }

    [Column("row")]
    public string? Row { get; set; }

    [Column("box")]
    public string? Box { get; set; }

    [Column("category")]
    public string? Category { get; set; }

    [Column("stock")]
    public decimal Stock { get; set; }

    [Column("min_stock")]
    public decimal MinStock { get; set; }

    [Column("price")]
    public decimal Price { get; set; }

    [Column("cost")]
    public decimal Cost { get; set; }

    [Column("location")]
    public string? Location { get; set; }

    [Column("unit")]
    public string? Unit { get; set; }

    [Column("batch")]
    public string? Batch { get; set; }

    [Column("expiry_date")]
    public DateTime? ExpiryDate { get; set; }

    [Column("description")]
    public string? Description { get; set; }

    [Column("active")]
    public bool Active { get; set; } = true;

    [JsonIgnore] public ICollection<StockMovement> StockMovements { get; set; } = new List<StockMovement>();
    [JsonIgnore] public ICollection<Sale> Sales { get; set; } = new List<Sale>();
}
