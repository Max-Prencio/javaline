using System.ComponentModel.DataAnnotations.Schema;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

[Table("tasks")]
public class TaskItem : BaseEntity
{
    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Column("status")]
    public string Status { get; set; } = "todo"; // todo | doing | done

    [Column("priority")]
    public string Priority { get; set; } = "normal"; // low | normal | high

    [Column("assigned_to")]
    public string? AssignedTo { get; set; }

    [Column("due_date")]
    public DateTime? DueDate { get; set; }

    [Column("user_id")]
    public string? UserId { get; set; }

    public User? User { get; set; }
}
