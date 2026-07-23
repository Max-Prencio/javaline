using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

[Table("payrolls")]
public class Payroll : BaseEntity
{
    [Column("tenant_id")]
    public string TenantId { get; set; } = "default";

    [Column("employee_id")]
    public string EmployeeId { get; set; } = string.Empty;

    [Column("period_start")]
    public DateTime PeriodStart { get; set; }

    [Column("period_end")]
    public DateTime PeriodEnd { get; set; }

    [Column("gross_salary")]
    public decimal GrossSalary { get; set; }

    [Column("total_deductions")]
    public decimal TotalDeductions { get; set; }

    [Column("net_salary")]
    public decimal NetSalary { get; set; }

    [Column("bonuses")]
    public decimal Bonuses { get; set; }

    [Column("overtime_pay")]
    public decimal OvertimePay { get; set; }

    [Column("status")]
    public string Status { get; set; } = "pending";

    [Column("paid_at")]
    public DateTime? PaidAt { get; set; }

    [Column("payment_method")]
    public string? PaymentMethod { get; set; }

    [Column("receipt_sent")]
    public bool ReceiptSent { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }

    [JsonIgnore]
    public Employee Employee { get; set; } = null!;
}
