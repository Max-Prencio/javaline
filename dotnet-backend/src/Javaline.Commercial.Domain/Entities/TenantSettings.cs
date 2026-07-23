using System.ComponentModel.DataAnnotations.Schema;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

[Table("tenant_settings")]
public class TenantSettings : BaseEntity
{
    [Column("tenant_id")]
    public string TenantId { get; set; } = "default";

    [Column("key")]
    public string Key { get; set; } = string.Empty;

    [Column("value")]
    public string? Value { get; set; }
}
