using System.ComponentModel.DataAnnotations.Schema;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

[Table("pocket_notifications")]
public class PocketNotification : BaseEntity
{
    [Column("tenant_id")]
    public string TenantId { get; set; } = "default";

    [Column("user_id")]
    public string UserId { get; set; } = string.Empty;

    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [Column("message")]
    public string Message { get; set; } = string.Empty;

    [Column("type")]
    public string Type { get; set; } = "info";

    [Column("read")]
    public bool Read { get; set; }
}
