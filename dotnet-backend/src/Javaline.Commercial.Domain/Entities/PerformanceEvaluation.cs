using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

[Table("performance_evaluations")]
public class PerformanceEvaluation : BaseEntity
{
    [Column("tenant_id")]
    public string TenantId { get; set; } = "default";

    [Column("employee_id")]
    public string EmployeeId { get; set; } = string.Empty;

    [Column("evaluator_id")]
    public string? EvaluatorId { get; set; }

    [Column("evaluation_date")]
    public DateTime EvaluationDate { get; set; }

    [Column("score")]
    public decimal Score { get; set; }

    [Column("max_score")]
    public decimal MaxScore { get; set; }

    [Column("category")]
    public string? Category { get; set; }

    [Column("strengths")]
    public string? Strengths { get; set; }

    [Column("weaknesses")]
    public string? Weaknesses { get; set; }

    [Column("recommendations")]
    public string? Recommendations { get; set; }

    [Column("criteria_scores")]
    public string CriteriaScores { get; set; } = "[]";

    [Column("status")]
    public string Status { get; set; } = "draft";

    [JsonIgnore]
    public Employee Employee { get; set; } = null!;
}
