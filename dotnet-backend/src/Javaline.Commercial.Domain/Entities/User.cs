using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

[Table("users")]
public class User : BaseEntity
{
    [Column("tenant_id")]
    public string TenantId { get; set; } = "default";

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("email")]
    public string Email { get; set; } = string.Empty;

    [Column("password_hash")]
    public string PasswordHash { get; set; } = string.Empty;

    [Column("role")]
    public string Role { get; set; } = "user";

    [Column("phone")]
    public string? Phone { get; set; }

    [Column("position")]
    public string? Position { get; set; }

    [Column("bio")]
    public string? Bio { get; set; }

    [Column("notification_email")]
    public string? NotificationEmail { get; set; }

    [Column("alt_email")]
    public string? AltEmail { get; set; }

    [Column("photo")]
    public string? Photo { get; set; }

    [Column("status")]
    public string Status { get; set; } = "active";

    [Column("two_factor_enabled")]
    public bool TwoFactorEnabled { get; set; }

    [Column("two_factor_secret")]
    public string? TwoFactorSecret { get; set; }

    [Column("invitation_token")]
    public string? InvitationToken { get; set; }

    [Column("failed_login_attempts")]
    public int FailedLoginAttempts { get; set; }

    [Column("locked_at")]
    public DateTime? LockedAt { get; set; }

    [Column("password_reset_token")]
    public string? PasswordResetToken { get; set; }

    [Column("password_reset_expires")]
    public DateTime? PasswordResetExpires { get; set; }
}
