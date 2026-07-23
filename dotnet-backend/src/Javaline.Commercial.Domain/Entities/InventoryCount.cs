using System.ComponentModel.DataAnnotations.Schema;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

[Table("inventory_counts")]
public class InventoryCount : BaseEntity
{
    [Column("tenant_id")]
    public string TenantId { get; set; } = "default";

    [Column("user_id")]
    public string UserId { get; set; } = string.Empty;

    [Column("user_name")]
    public string UserName { get; set; } = string.Empty;

    [Column("product_id")]
    public string ProductId { get; set; } = string.Empty;

    [Column("product_name")]
    public string ProductName { get; set; } = string.Empty;

    [Column("sku")]
    public string Sku { get; set; } = string.Empty;

    [Column("warehouse")]
    public string? Warehouse { get; set; }

    [Column("shelf")]
    public string? Shelf { get; set; }

    [Column("row")]
    public string? Row { get; set; }

    [Column("box")]
    public string? Box { get; set; }

    [Column("scanned_count")]
    public decimal ScannedCount { get; set; }

    [Column("status")]
    public string Status { get; set; } = "pending";

    [Column("session_id")]
    public string? SessionId { get; set; }

    [Column("completed_at")]
    public DateTime? CompletedAt { get; set; }
}
