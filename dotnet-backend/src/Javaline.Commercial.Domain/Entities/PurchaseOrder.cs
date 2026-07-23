using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

[Table("purchase_orders")]
public class PurchaseOrder : BaseEntity
{
    [Key]
    [Column("id")]
    public new string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("supplier")]
    public string Supplier { get; set; } = string.Empty;

    [Column("item")]
    public string Item { get; set; } = string.Empty;

    [Column("qty")]
    public decimal Qty { get; set; }

    [Column("currency")]
    public string Currency { get; set; } = "DOP";

    [Column("total")]
    public decimal Total { get; set; }

    [Column("status")]
    public string Status { get; set; } = "pending";

    [Column("notes")]
    public string? Notes { get; set; }

    [Column("created_by")]
    public string? CreatedBy { get; set; }

    [Column("received_at")]
    public DateTime? ReceivedAt { get; set; }

    public User? Creator { get; set; }
    [JsonIgnore] public ICollection<Approval> Approvals { get; set; } = new List<Approval>();
}
