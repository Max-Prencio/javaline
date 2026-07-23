using System.ComponentModel.DataAnnotations.Schema;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

[Table("exemption_config")]
public class ExemptionConfig : BaseEntity
{
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Column("applies_to")]
    public string? AppliesTo { get; set; }

    [Column("active")]
    public bool Active { get; set; } = true;
}
