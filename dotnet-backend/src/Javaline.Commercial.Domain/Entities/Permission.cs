using System.ComponentModel.DataAnnotations.Schema;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

[Table("permissions")]
public class Permission : BaseEntity
{
    [Column("user_id")]
    public string UserId { get; set; } = string.Empty;

    [Column("module")]
    public string Module { get; set; } = string.Empty;

    [Column("can_view")]
    public bool CanView { get; set; }

    [Column("can_create")]
    public bool CanCreate { get; set; }

    [Column("can_edit")]
    public bool CanEdit { get; set; }

    [Column("can_delete")]
    public bool CanDelete { get; set; }

    public User? User { get; set; }
}
