using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

[Table("vacations")]
public class Vacation : BaseEntity
{
    [Column("tenant_id")]
    public string TenantId { get; set; } = "default";

    [Column("employee_id")]
    public string EmployeeId { get; set; } = string.Empty;

    [Column("vacation_type")]
    public string VacationType { get; set; } = string.Empty;

    [Column("start_date")]
    public DateTime StartDate { get; set; }

    [Column("end_date")]
    public DateTime EndDate { get; set; }

    [Column("total_days")]
    public int TotalDays { get; set; }

    [Column("status")]
    public string Status { get; set; } = "pending";

    [Column("approved_by")]
    public string? ApprovedBy { get; set; }

    [Column("year")]
    public int? Year { get; set; }

    [Column("is_recurring")]
    public bool IsRecurring { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }

    [JsonIgnore]
    public Employee Employee { get; set; } = null!;
}
