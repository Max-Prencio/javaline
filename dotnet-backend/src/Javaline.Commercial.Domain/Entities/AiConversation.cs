using System.ComponentModel.DataAnnotations.Schema;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

[Table("ai_conversations")]
public class AiConversation : BaseEntity
{
    [Column("user_id")]
    public string UserId { get; set; } = string.Empty;

    [Column("tenant_id")]
    public string TenantId { get; set; } = "default";

    [Column("title")]
    public string? Title { get; set; }

    [Column("messages")]
    public string Messages { get; set; } = "[]";

    [Column("active")]
    public bool Active { get; set; } = true;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
