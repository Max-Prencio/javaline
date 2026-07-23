namespace Javaline.Commercial.Application.DTOs;

public record SurveyDto(
    string Id,
    string TenantId,
    string Title,
    string? Description,
    string Questions,
    string Status,
    string? CreatedBy,
    DateTime CreatedAt
);

public record CreateSurveyDto(
    string Title,
    string? Description,
    string Questions,
    string Status,
    string? CreatedBy
);

public record SurveyResponseDto(
    string Id,
    string TenantId,
    string SurveyId,
    string? EmployeeId,
    string Answers,
    DateTime SubmittedAt,
    DateTime CreatedAt
);

public record CreateSurveyResponseDto(
    string SurveyId,
    string? EmployeeId,
    string Answers
);
