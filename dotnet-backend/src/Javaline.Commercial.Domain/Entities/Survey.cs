using System.ComponentModel.DataAnnotations.Schema;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

[Table("surveys")]
public class Survey : BaseEntity
{
    [Column("tenant_id")]
    public string TenantId { get; set; } = "default";

    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Column("questions")]
    public string Questions { get; set; } = "[]";

    [Column("status")]
    public string Status { get; set; } = "active";

    [Column("created_by")]
    public string? CreatedBy { get; set; }
}
