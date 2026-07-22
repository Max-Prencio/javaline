using System.ComponentModel.DataAnnotations.Schema;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

[Table("meetings")]
public class Meeting : BaseEntity
{
    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Column("start_date")]
    public DateTime StartDate { get; set; }

    [Column("end_date")]
    public DateTime? EndDate { get; set; }

    [Column("location")]
    public string? Location { get; set; }

    [Column("attendees")]
    public string? Attendees { get; set; } // JSON array of names

    [Column("type")]
    public string Type { get; set; } = "meeting"; // meeting | event | schedule

    [Column("user_id")]
    public string? UserId { get; set; }

    public User? User { get; set; }
}
