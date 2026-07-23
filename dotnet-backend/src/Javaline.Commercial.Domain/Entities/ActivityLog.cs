using System.ComponentModel.DataAnnotations.Schema;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

[Table("activity_log")]
public class ActivityLog : BaseEntity
{
    [Column("tenant_id")]
    public string TenantId { get; set; } = "default";

    [Column("user_id")]
    public string? UserId { get; set; }

    [Column("user_name")]
    public string? UserName { get; set; }

    [Column("action")]
    public string Action { get; set; } = string.Empty;

    [Column("detail")]
    public string? Detail { get; set; }

    [Column("store")]
    public string? Store { get; set; }
}
