namespace Javaline.Commercial.Application.DTOs;

public record EmployeeDto(
    string Id,
    string TenantId,
    string? UserId,
    string Name,
    string? Email,
    string? Phone,
    string? Department,
    string? Position,
    decimal? Salary,
    string? SalaryType,
    DateTime? HireDate,
    DateTime? ContractEndDate,
    string? ContractType,
    string Status,
    string? Photo,
    string? SupervisorId,
    string? Rnc,
    string? TssNumber,
    string? Ars,
    string? AFP,
    string? BankAccount,
    string? EmergencyContact,
    string? EmergencyPhone,
    bool PunchEnabled,
    DateTime CreatedAt
);

public record CreateEmployeeDto(
    string Name,
    string? Email,
    string? Phone,
    string? Department,
    string? Position,
    decimal? Salary,
    string? SalaryType,
    DateTime? HireDate,
    DateTime? ContractEndDate,
    string? ContractType,
    string Status,
    string? Photo,
    string? SupervisorId,
    string? Rnc,
    string? TssNumber,
    string? Ars,
    string? AFP,
    string? BankAccount,
    string? EmergencyContact,
    string? EmergencyPhone,
    bool PunchEnabled,
    string? UserId
);

public record PositionDto(
    string Id,
    string TenantId,
    string Name,
    string? DescriptionFile,
    DateTime CreatedAt
);

public record CreatePositionDto(
    string Name,
    string? DescriptionFile
);

public record DeductionDto(
    string Id,
    string TenantId,
    string EmployeeId,
    string Name,
    string DeductionType,
    decimal Amount,
    decimal? Percentage,
    bool IsMandatory,
    bool IsActive,
    string? Description,
    DateTime CreatedAt
);

public record CreateDeductionDto(
    string EmployeeId,
    string Name,
    string DeductionType,
    decimal Amount,
    decimal? Percentage,
    bool IsMandatory,
    bool IsActive,
    string? Description
);

public record PayrollDto(
    string Id,
    string TenantId,
    string EmployeeId,
    DateTime PeriodStart,
    DateTime PeriodEnd,
    decimal GrossSalary,
    decimal TotalDeductions,
    decimal NetSalary,
    decimal Bonuses,
    decimal OvertimePay,
    string Status,
    DateTime? PaidAt,
    string? PaymentMethod,
    bool ReceiptSent,
    string? Notes,
    DateTime CreatedAt
);

public record CreatePayrollDto(
    string EmployeeId,
    DateTime PeriodStart,
    DateTime PeriodEnd,
    decimal GrossSalary,
    decimal TotalDeductions,
    decimal NetSalary,
    decimal Bonuses,
    decimal OvertimePay,
    string Status,
    DateTime? PaidAt,
    string? PaymentMethod,
    bool ReceiptSent,
    string? Notes
);

public record VacationDto(
    string Id,
    string TenantId,
    string EmployeeId,
    string VacationType,
    DateTime StartDate,
    DateTime EndDate,
    int TotalDays,
    string Status,
    string? ApprovedBy,
    int? Year,
    bool IsRecurring,
    string? Notes,
    DateTime CreatedAt
);

public record CreateVacationDto(
    string EmployeeId,
    string VacationType,
    DateTime StartDate,
    DateTime EndDate,
    int TotalDays,
    string Status,
    string? ApprovedBy,
    int? Year,
    bool IsRecurring,
    string? Notes
);

public record AttendanceDto(
    string Id,
    string TenantId,
    string EmployeeId,
    DateTime Date,
    DateTime? ClockIn,
    DateTime? ClockOut,
    DateTime? BreakStart,
    DateTime? BreakEnd,
    decimal TotalHours,
    decimal OvertimeHours,
    decimal MissingHours,
    string Status,
    string? Source,
    string? Notes,
    DateTime CreatedAt
);

public record CreateAttendanceDto(
    string EmployeeId,
    DateTime Date,
    DateTime? ClockIn,
    DateTime? ClockOut,
    DateTime? BreakStart,
    DateTime? BreakEnd,
    decimal TotalHours,
    decimal OvertimeHours,
    decimal MissingHours,
    string Status,
    string? Source,
    string? Notes
);

public record PerformanceEvaluationDto(
    string Id,
    string TenantId,
    string EmployeeId,
    string? EvaluatorId,
    DateTime EvaluationDate,
    decimal Score,
    decimal MaxScore,
    string? Category,
    string? Strengths,
    string? Weaknesses,
    string? Recommendations,
    string CriteriaScores,
    string Status,
    DateTime CreatedAt
);

public record CreatePerformanceEvaluationDto(
    string EmployeeId,
    string? EvaluatorId,
    DateTime EvaluationDate,
    decimal Score,
    decimal MaxScore,
    string? Category,
    string? Strengths,
    string? Weaknesses,
    string? Recommendations,
    string CriteriaScores,
    string Status
);

public record ATSCandidateDto(
    string Id,
    string TenantId,
    string Name,
    string? Email,
    string? Phone,
    string? PositionApplied,
    string? ResumeFile,
    string? ResumeText,
    string? PositionDescrFile,
    string? AiAnalysis,
    string? Classification,
    decimal? Score,
    string? Strengths,
    string? Weaknesses,
    string? Recommendations,
    string Status,
    string? EvaluatedBy,
    string? Notes,
    DateTime CreatedAt
);

public record CreateATSCandidateDto(
    string Name,
    string? Email,
    string? Phone,
    string? PositionApplied,
    string? ResumeFile,
    string? ResumeText,
    string? PositionDescrFile,
    string? AiAnalysis,
    string? Classification,
    decimal? Score,
    string? Strengths,
    string? Weaknesses,
    string? Recommendations,
    string Status,
    string? EvaluatedBy,
    string? Notes
);
