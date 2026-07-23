using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

[Table("deductions")]
public class Deduction : BaseEntity
{
    [Column("tenant_id")]
    public string TenantId { get; set; } = "default";

    [Column("employee_id")]
    public string EmployeeId { get; set; } = string.Empty;

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("deduction_type")]
    public string DeductionType { get; set; } = string.Empty;

    [Column("amount")]
    public decimal Amount { get; set; }

    [Column("percentage")]
    public decimal? Percentage { get; set; }

    [Column("is_mandatory")]
    public bool IsMandatory { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("description")]
    public string? Description { get; set; }

    [JsonIgnore]
    public Employee Employee { get; set; } = null!;
}
