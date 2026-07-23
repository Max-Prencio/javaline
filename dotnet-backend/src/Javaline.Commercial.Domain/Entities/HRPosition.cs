using System.ComponentModel.DataAnnotations.Schema;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

[Table("hr_positions")]
public class HRPosition : BaseEntity
{
    [Column("tenant_id")]
    public string TenantId { get; set; } = "default";

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("description_file")]
    public string? DescriptionFile { get; set; }
}
