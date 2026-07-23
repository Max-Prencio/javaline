using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

[Table("employees")]
public class Employee : BaseEntity
{
    [Column("tenant_id")]
    public string TenantId { get; set; } = "default";

    [Column("user_id")]
    public string? UserId { get; set; }

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("email")]
    public string? Email { get; set; }

    [Column("phone")]
    public string? Phone { get; set; }

    [Column("department")]
    public string? Department { get; set; }

    [Column("position")]
    public string? Position { get; set; }

    [Column("salary")]
    public decimal? Salary { get; set; }

    [Column("salary_type")]
    public string? SalaryType { get; set; }

    [Column("hire_date")]
    public DateTime? HireDate { get; set; }

    [Column("contract_end_date")]
    public DateTime? ContractEndDate { get; set; }

    [Column("contract_type")]
    public string? ContractType { get; set; }

    [Column("status")]
    public string Status { get; set; } = "active";

    [Column("photo")]
    public string? Photo { get; set; }

    [Column("supervisor_id")]
    public string? SupervisorId { get; set; }

    [Column("rnc")]
    public string? Rnc { get; set; }

    [Column("tss_number")]
    public string? TssNumber { get; set; }

    [Column("ars")]
    public string? Ars { get; set; }

    [Column("afp")]
    public string? AFP { get; set; }

    [Column("bank_account")]
    public string? BankAccount { get; set; }

    [Column("emergency_contact")]
    public string? EmergencyContact { get; set; }

    [Column("emergency_phone")]
    public string? EmergencyPhone { get; set; }

    [Column("punch_enabled")]
    public bool PunchEnabled { get; set; }

    public User? User { get; set; }
    public Employee? Supervisor { get; set; }
    [JsonIgnore] public ICollection<Employee> Subordinates { get; set; } = new List<Employee>();
    [JsonIgnore] public ICollection<Vacation> Vacations { get; set; } = new List<Vacation>();
    [JsonIgnore] public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
    [JsonIgnore] public ICollection<Payroll> Payrolls { get; set; } = new List<Payroll>();
    [JsonIgnore] public ICollection<Deduction> Deductions { get; set; } = new List<Deduction>();
    [JsonIgnore] public ICollection<PerformanceEvaluation> Evaluations { get; set; } = new List<PerformanceEvaluation>();
}
