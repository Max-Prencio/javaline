using System.ComponentModel.DataAnnotations.Schema;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

[Table("approval_hierarchies")]
public class ApprovalHierarchy : BaseEntity
{
    [Column("currency")]
    public string Currency { get; set; } = "DOP";

    [Column("role")]
    public string Role { get; set; } = string.Empty;

    [Column("min_amount")]
    public decimal MinAmount { get; set; }

    [Column("max_amount")]
    public decimal MaxAmount { get; set; }

    [Column("created_by")]
    public string? CreatedBy { get; set; }
}
