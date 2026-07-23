using System.ComponentModel.DataAnnotations.Schema;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

[Table("business_context")]
public class BusinessContext : BaseEntity
{
    [Column("tenant_id")]
    public string TenantId { get; set; } = "default";

    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [Column("content")]
    public string Content { get; set; } = string.Empty;

    [Column("category")]
    public string? Category { get; set; }

    [Column("active")]
    public bool Active { get; set; } = true;
}
