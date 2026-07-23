using System.ComponentModel.DataAnnotations.Schema;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

[Table("ats_candidates")]
public class ATSCandidate : BaseEntity
{
    [Column("tenant_id")]
    public string TenantId { get; set; } = "default";

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("email")]
    public string? Email { get; set; }

    [Column("phone")]
    public string? Phone { get; set; }

    [Column("position_applied")]
    public string? PositionApplied { get; set; }

    [Column("resume_file")]
    public string? ResumeFile { get; set; }

    [Column("resume_text")]
    public string? ResumeText { get; set; }

    [Column("position_descr_file")]
    public string? PositionDescrFile { get; set; }

    [Column("ai_analysis")]
    public string? AiAnalysis { get; set; }

    [Column("classification")]
    public string? Classification { get; set; }

    [Column("score")]
    public decimal? Score { get; set; }

    [Column("strengths")]
    public string? Strengths { get; set; }

    [Column("weaknesses")]
    public string? Weaknesses { get; set; }

    [Column("recommendations")]
    public string? Recommendations { get; set; }

    [Column("status")]
    public string Status { get; set; } = "new";

    [Column("evaluated_by")]
    public string? EvaluatedBy { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }
}
