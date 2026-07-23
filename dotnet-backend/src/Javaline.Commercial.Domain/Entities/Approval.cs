using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

[Table("approvals")]
public class Approval : BaseEntity
{
    [Column("purchase_order_id")]
    public string PurchaseOrderId { get; set; } = string.Empty;

    [Column("approved_by")]
    public string ApprovedBy { get; set; } = string.Empty;

    [Column("status")]
    public string Status { get; set; } = string.Empty;

    [Column("amount_approved")]
    public decimal? AmountApproved { get; set; }

    [Column("comment")]
    public string? Comment { get; set; }

    [Column("approved_at")]
    public DateTime ApprovedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public PurchaseOrder PurchaseOrder { get; set; } = null!;
    [JsonIgnore]
    public User Approver { get; set; } = null!;
}
