using System.ComponentModel.DataAnnotations.Schema;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

[Table("notifications")]
public class Notification : BaseEntity
{
    [Column("user_id")]
    public string UserId { get; set; } = string.Empty;

    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [Column("message")]
    public string Message { get; set; } = string.Empty;

    [Column("read")]
    public bool Read { get; set; }

    public User? User { get; set; }
}
