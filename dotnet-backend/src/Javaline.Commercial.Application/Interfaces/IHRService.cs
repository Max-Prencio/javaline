using Javaline.Commercial.Application.DTOs;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Application.Interfaces;

public interface IHRService
{
    Task<PagedResult<EmployeeDto>> GetAllEmployeesAsync(int page, int pageSize, string? search, string? status);
    Task<EmployeeDto?> GetEmployeeByIdAsync(string id);
    Task<EmployeeDto> CreateEmployeeAsync(CreateEmployeeDto dto);
    Task<EmployeeDto?> UpdateEmployeeAsync(string id, CreateEmployeeDto dto);
    Task<bool> DeleteEmployeeAsync(string id);

    Task<PagedResult<PositionDto>> GetAllPositionsAsync(int page, int pageSize, string? search);
    Task<PositionDto?> GetPositionByIdAsync(string id);
    Task<PositionDto> CreatePositionAsync(CreatePositionDto dto);
    Task<PositionDto?> UpdatePositionAsync(string id, CreatePositionDto dto);
    Task<bool> DeletePositionAsync(string id);

    Task<PagedResult<DeductionDto>> GetAllDeductionsAsync(int page, int pageSize, string? search, string? employeeId);
    Task<DeductionDto?> GetDeductionByIdAsync(string id);
    Task<DeductionDto> CreateDeductionAsync(CreateDeductionDto dto);
    Task<DeductionDto?> UpdateDeductionAsync(string id, CreateDeductionDto dto);
    Task<bool> DeleteDeductionAsync(string id);

    Task<PagedResult<PayrollDto>> GetAllPayrollsAsync(int page, int pageSize, string? search, string? status);
    Task<PayrollDto?> GetPayrollByIdAsync(string id);
    Task<PayrollDto> CreatePayrollAsync(CreatePayrollDto dto);
    Task<PayrollDto?> UpdatePayrollAsync(string id, CreatePayrollDto dto);
    Task<bool> DeletePayrollAsync(string id);

    Task<PagedResult<VacationDto>> GetAllVacationsAsync(int page, int pageSize, string? search, string? status);
    Task<VacationDto?> GetVacationByIdAsync(string id);
    Task<VacationDto> CreateVacationAsync(CreateVacationDto dto);
    Task<VacationDto?> UpdateVacationAsync(string id, CreateVacationDto dto);
    Task<bool> DeleteVacationAsync(string id);

    Task<PagedResult<AttendanceDto>> GetAllAttendancesAsync(int page, int pageSize, string? search, string? status);
    Task<AttendanceDto?> GetAttendanceByIdAsync(string id);
    Task<AttendanceDto> CreateAttendanceAsync(CreateAttendanceDto dto);
    Task<AttendanceDto?> UpdateAttendanceAsync(string id, CreateAttendanceDto dto);
    Task<bool> DeleteAttendanceAsync(string id);

    Task<PagedResult<PerformanceEvaluationDto>> GetAllEvaluationsAsync(int page, int pageSize, string? search, string? status);
    Task<PerformanceEvaluationDto?> GetEvaluationByIdAsync(string id);
    Task<PerformanceEvaluationDto> CreateEvaluationAsync(CreatePerformanceEvaluationDto dto);
    Task<PerformanceEvaluationDto?> UpdateEvaluationAsync(string id, CreatePerformanceEvaluationDto dto);
    Task<bool> DeleteEvaluationAsync(string id);

    Task<PagedResult<ATSCandidateDto>> GetAllCandidatesAsync(int page, int pageSize, string? search, string? status);
    Task<ATSCandidateDto?> GetCandidateByIdAsync(string id);
    Task<ATSCandidateDto> CreateCandidateAsync(CreateATSCandidateDto dto);
    Task<ATSCandidateDto?> UpdateCandidateAsync(string id, CreateATSCandidateDto dto);
    Task<bool> DeleteCandidateAsync(string id);

    Task<List<string>> GetDepartmentsAsync();
    Task<object> GetEmployeeStatsAsync();
    Task<object> GetVacationAvailableAsync(string employeeId);
    Task<object> PunchClockAsync(string employeeId, string action);
    Task<object> GetAttendanceSummaryAsync(string employeeId, int? year, int? month);
    Task<object?> PayPayrollAsync(string payrollId);
    Task<object> GetPayrollSummaryAsync();
    Task<object> RespondSurveyAsync(string surveyId, string employeeId, string answers);
    Task<List<string>> GetATSPositionsAsync();
    Task<object?> AnalyzeCandidateAsync(string candidateId);
    Task<object?> UpdatePositionDescriptionAsync(string positionId, string fileName);
    Task<object> GetHRDashboardAsync();
}
