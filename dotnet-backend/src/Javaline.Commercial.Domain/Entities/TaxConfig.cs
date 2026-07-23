using System.ComponentModel.DataAnnotations.Schema;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

[Table("tax_config")]
public class TaxConfig : BaseEntity
{
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("rate")]
    public double Rate { get; set; }

    [Column("type")]
    public string Type { get; set; } = "ITBIS";

    [Column("active")]
    public bool Active { get; set; } = true;
}
