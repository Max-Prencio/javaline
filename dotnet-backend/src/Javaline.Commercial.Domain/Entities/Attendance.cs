using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

[Table("attendances")]
public class Attendance : BaseEntity
{
    [Column("tenant_id")]
    public string TenantId { get; set; } = "default";

    [Column("employee_id")]
    public string EmployeeId { get; set; } = string.Empty;

    [Column("date")]
    public DateTime Date { get; set; }

    [Column("clock_in")]
    public DateTime? ClockIn { get; set; }

    [Column("clock_out")]
    public DateTime? ClockOut { get; set; }

    [Column("break_start")]
    public DateTime? BreakStart { get; set; }

    [Column("break_end")]
    public DateTime? BreakEnd { get; set; }

    [Column("total_hours")]
    public decimal TotalHours { get; set; }

    [Column("overtime_hours")]
    public decimal OvertimeHours { get; set; }

    [Column("missing_hours")]
    public decimal MissingHours { get; set; }

    [Column("status")]
    public string Status { get; set; } = "present";

    [Column("source")]
    public string? Source { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }

    [JsonIgnore]
    public Employee Employee { get; set; } = null!;
}
