using System.ComponentModel.DataAnnotations.Schema;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

[Table("discount_config")]
public class DiscountConfig : BaseEntity
{
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("type")]
    public string Type { get; set; } = "percentage";

    [Column("value")]
    public double Value { get; set; }

    [Column("active")]
    public bool Active { get; set; } = true;
}
