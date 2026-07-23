using System.ComponentModel.DataAnnotations.Schema;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

[Table("contacts")]
public class Contact : BaseEntity
{
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("company")]
    public string? Company { get; set; }

    [Column("rnc")]
    public string? Rnc { get; set; }

    [Column("email")]
    public string? Email { get; set; }

    [Column("phone")]
    public string? Phone { get; set; }

    [Column("type")]
    public string? Type { get; set; }

    [Column("address")]
    public string? Address { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }

    [Column("active")]
    public bool Active { get; set; } = true;
}
