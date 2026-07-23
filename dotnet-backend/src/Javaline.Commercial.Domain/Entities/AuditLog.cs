using System.ComponentModel.DataAnnotations.Schema;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

[Table("audit_logs")]
public class AuditLog : BaseEntity
{
    [Column("user_id")]
    public string? UserId { get; set; }

    [Column("action")]
    public string Action { get; set; } = string.Empty;

    [Column("entity_type")]
    public string? EntityType { get; set; }

    [Column("entity_id")]
    public string? EntityId { get; set; }

    [Column("details")]
    public string? Details { get; set; }

    [Column("ip_address")]
    public string? IpAddress { get; set; }
}
