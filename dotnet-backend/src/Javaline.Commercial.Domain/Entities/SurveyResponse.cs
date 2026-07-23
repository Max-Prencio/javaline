using System.ComponentModel.DataAnnotations.Schema;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Entities;

[Table("survey_responses")]
public class SurveyResponse : BaseEntity
{
    [Column("tenant_id")]
    public string TenantId { get; set; } = "default";

    [Column("survey_id")]
    public string SurveyId { get; set; } = string.Empty;

    [Column("employee_id")]
    public string? EmployeeId { get; set; }

    [Column("answers")]
    public string Answers { get; set; } = "[]";

    [Column("submitted_at")]
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    public Survey Survey { get; set; } = null!;
}
