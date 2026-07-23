using Javaline.Commercial.Application.DTOs;
using Javaline.Commercial.Application.Interfaces;
using Javaline.Commercial.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Javaline.Commercial.Api.Controllers;

[ApiController]
[Route("hr")]
[Authorize]
public class HRController : ControllerBase
{
    private readonly IHRService _hrService;

    public HRController(IHRService hrService) => _hrService = hrService;

    // ─── Employees ───

    [HttpGet("employees")]
    public async Task<IActionResult> GetAllEmployees(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null)
    {
        var result = await _hrService.GetAllEmployeesAsync(page, pageSize, search, status);
        return Ok(result);
    }

    [HttpGet("employees/{id}")]
    public async Task<IActionResult> GetEmployeeById(string id)
    {
        var item = await _hrService.GetEmployeeByIdAsync(id);
        if (item == null) return NotFound(new { detail = "Employee not found." });
        return Ok(item);
    }

    [HttpPost("employees")]
    public async Task<IActionResult> CreateEmployee([FromBody] CreateEmployeeDto dto)
    {
        var item = await _hrService.CreateEmployeeAsync(dto);
        return CreatedAtAction(nameof(GetEmployeeById), new { id = item.Id }, item);
    }

    [HttpPut("employees/{id}")]
    public async Task<IActionResult> UpdateEmployee(string id, [FromBody] CreateEmployeeDto dto)
    {
        var item = await _hrService.UpdateEmployeeAsync(id, dto);
        if (item == null) return NotFound(new { detail = "Employee not found." });
        return Ok(item);
    }

    [HttpDelete("employees/{id}")]
    public async Task<IActionResult> DeleteEmployee(string id)
    {
        var deleted = await _hrService.DeleteEmployeeAsync(id);
        if (!deleted) return NotFound(new { detail = "Employee not found." });
        return Ok(new { success = true });
    }

    // ─── Positions ───

    [HttpGet("positions")]
    public async Task<IActionResult> GetAllPositions(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
    {
        var result = await _hrService.GetAllPositionsAsync(page, pageSize, search);
        return Ok(result);
    }

    [HttpGet("positions/{id}")]
    public async Task<IActionResult> GetPositionById(string id)
    {
        var item = await _hrService.GetPositionByIdAsync(id);
        if (item == null) return NotFound(new { detail = "Position not found." });
        return Ok(item);
    }

    [HttpPost("positions")]
    public async Task<IActionResult> CreatePosition([FromBody] CreatePositionDto dto)
    {
        var item = await _hrService.CreatePositionAsync(dto);
        return CreatedAtAction(nameof(GetPositionById), new { id = item.Id }, item);
    }

    [HttpPut("positions/{id}")]
    public async Task<IActionResult> UpdatePosition(string id, [FromBody] CreatePositionDto dto)
    {
        var item = await _hrService.UpdatePositionAsync(id, dto);
        if (item == null) return NotFound(new { detail = "Position not found." });
        return Ok(item);
    }

    [HttpDelete("positions/{id}")]
    public async Task<IActionResult> DeletePosition(string id)
    {
        var deleted = await _hrService.DeletePositionAsync(id);
        if (!deleted) return NotFound(new { detail = "Position not found." });
        return Ok(new { success = true });
    }

    // ─── Deductions ───

    [HttpGet("deductions")]
    public async Task<IActionResult> GetAllDeductions(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? employeeId = null)
    {
        var result = await _hrService.GetAllDeductionsAsync(page, pageSize, search, employeeId);
        return Ok(result);
    }

    [HttpGet("deductions/{id}")]
    public async Task<IActionResult> GetDeductionById(string id)
    {
        var item = await _hrService.GetDeductionByIdAsync(id);
        if (item == null) return NotFound(new { detail = "Deduction not found." });
        return Ok(item);
    }

    [HttpPost("deductions")]
    public async Task<IActionResult> CreateDeduction([FromBody] CreateDeductionDto dto)
    {
        var item = await _hrService.CreateDeductionAsync(dto);
        return CreatedAtAction(nameof(GetDeductionById), new { id = item.Id }, item);
    }

    [HttpPut("deductions/{id}")]
    public async Task<IActionResult> UpdateDeduction(string id, [FromBody] CreateDeductionDto dto)
    {
        var item = await _hrService.UpdateDeductionAsync(id, dto);
        if (item == null) return NotFound(new { detail = "Deduction not found." });
        return Ok(item);
    }

    [HttpDelete("deductions/{id}")]
    public async Task<IActionResult> DeleteDeduction(string id)
    {
        var deleted = await _hrService.DeleteDeductionAsync(id);
        if (!deleted) return NotFound(new { detail = "Deduction not found." });
        return Ok(new { success = true });
    }

    // ─── Payrolls ───

    [HttpGet("payrolls")]
    public async Task<IActionResult> GetAllPayrolls(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null)
    {
        var result = await _hrService.GetAllPayrollsAsync(page, pageSize, search, status);
        return Ok(result);
    }

    [HttpGet("payrolls/{id}")]
    public async Task<IActionResult> GetPayrollById(string id)
    {
        var item = await _hrService.GetPayrollByIdAsync(id);
        if (item == null) return NotFound(new { detail = "Payroll not found." });
        return Ok(item);
    }

    [HttpPost("payrolls")]
    public async Task<IActionResult> CreatePayroll([FromBody] CreatePayrollDto dto)
    {
        var item = await _hrService.CreatePayrollAsync(dto);
        return CreatedAtAction(nameof(GetPayrollById), new { id = item.Id }, item);
    }

    [HttpPut("payrolls/{id}")]
    public async Task<IActionResult> UpdatePayroll(string id, [FromBody] CreatePayrollDto dto)
    {
        var item = await _hrService.UpdatePayrollAsync(id, dto);
        if (item == null) return NotFound(new { detail = "Payroll not found." });
        return Ok(item);
    }

    [HttpDelete("payrolls/{id}")]
    public async Task<IActionResult> DeletePayroll(string id)
    {
        var deleted = await _hrService.DeletePayrollAsync(id);
        if (!deleted) return NotFound(new { detail = "Payroll not found." });
        return Ok(new { success = true });
    }

    // ─── Vacations ───

    [HttpGet("vacations")]
    public async Task<IActionResult> GetAllVacations(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null)
    {
        var result = await _hrService.GetAllVacationsAsync(page, pageSize, search, status);
        return Ok(result);
    }

    [HttpGet("vacations/{id}")]
    public async Task<IActionResult> GetVacationById(string id)
    {
        var item = await _hrService.GetVacationByIdAsync(id);
        if (item == null) return NotFound(new { detail = "Vacation not found." });
        return Ok(item);
    }

    [HttpPost("vacations")]
    public async Task<IActionResult> CreateVacation([FromBody] CreateVacationDto dto)
    {
        var item = await _hrService.CreateVacationAsync(dto);
        return CreatedAtAction(nameof(GetVacationById), new { id = item.Id }, item);
    }

    [HttpPut("vacations/{id}")]
    public async Task<IActionResult> UpdateVacation(string id, [FromBody] CreateVacationDto dto)
    {
        var item = await _hrService.UpdateVacationAsync(id, dto);
        if (item == null) return NotFound(new { detail = "Vacation not found." });
        return Ok(item);
    }

    [HttpDelete("vacations/{id}")]
    public async Task<IActionResult> DeleteVacation(string id)
    {
        var deleted = await _hrService.DeleteVacationAsync(id);
        if (!deleted) return NotFound(new { detail = "Vacation not found." });
        return Ok(new { success = true });
    }

    // ─── Attendances ───

    [HttpGet("attendances")]
    public async Task<IActionResult> GetAllAttendances(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null)
    {
        var result = await _hrService.GetAllAttendancesAsync(page, pageSize, search, status);
        return Ok(result);
    }

    [HttpGet("attendances/{id}")]
    public async Task<IActionResult> GetAttendanceById(string id)
    {
        var item = await _hrService.GetAttendanceByIdAsync(id);
        if (item == null) return NotFound(new { detail = "Attendance not found." });
        return Ok(item);
    }

    [HttpPost("attendances")]
    public async Task<IActionResult> CreateAttendance([FromBody] CreateAttendanceDto dto)
    {
        var item = await _hrService.CreateAttendanceAsync(dto);
        return CreatedAtAction(nameof(GetAttendanceById), new { id = item.Id }, item);
    }

    [HttpPut("attendances/{id}")]
    public async Task<IActionResult> UpdateAttendance(string id, [FromBody] CreateAttendanceDto dto)
    {
        var item = await _hrService.UpdateAttendanceAsync(id, dto);
        if (item == null) return NotFound(new { detail = "Attendance not found." });
        return Ok(item);
    }

    [HttpDelete("attendances/{id}")]
    public async Task<IActionResult> DeleteAttendance(string id)
    {
        var deleted = await _hrService.DeleteAttendanceAsync(id);
        if (!deleted) return NotFound(new { detail = "Attendance not found." });
        return Ok(new { success = true });
    }

    // ─── Evaluations ───

    [HttpGet("evaluations")]
    public async Task<IActionResult> GetAllEvaluations(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null)
    {
        var result = await _hrService.GetAllEvaluationsAsync(page, pageSize, search, status);
        return Ok(result);
    }

    [HttpGet("evaluations/{id}")]
    public async Task<IActionResult> GetEvaluationById(string id)
    {
        var item = await _hrService.GetEvaluationByIdAsync(id);
        if (item == null) return NotFound(new { detail = "Evaluation not found." });
        return Ok(item);
    }

    [HttpPost("evaluations")]
    public async Task<IActionResult> CreateEvaluation([FromBody] CreatePerformanceEvaluationDto dto)
    {
        var item = await _hrService.CreateEvaluationAsync(dto);
        return CreatedAtAction(nameof(GetEvaluationById), new { id = item.Id }, item);
    }

    [HttpPut("evaluations/{id}")]
    public async Task<IActionResult> UpdateEvaluation(string id, [FromBody] CreatePerformanceEvaluationDto dto)
    {
        var item = await _hrService.UpdateEvaluationAsync(id, dto);
        if (item == null) return NotFound(new { detail = "Evaluation not found." });
        return Ok(item);
    }

    [HttpDelete("evaluations/{id}")]
    public async Task<IActionResult> DeleteEvaluation(string id)
    {
        var deleted = await _hrService.DeleteEvaluationAsync(id);
        if (!deleted) return NotFound(new { detail = "Evaluation not found." });
        return Ok(new { success = true });
    }

    // ─── Candidates ───

    [HttpGet("candidates")]
    public async Task<IActionResult> GetAllCandidates(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null)
    {
        var result = await _hrService.GetAllCandidatesAsync(page, pageSize, search, status);
        return Ok(result);
    }

    [HttpGet("candidates/{id}")]
    public async Task<IActionResult> GetCandidateById(string id)
    {
        var item = await _hrService.GetCandidateByIdAsync(id);
        if (item == null) return NotFound(new { detail = "Candidate not found." });
        return Ok(item);
    }

    [HttpPost("candidates")]
    public async Task<IActionResult> CreateCandidate([FromBody] CreateATSCandidateDto dto)
    {
        var item = await _hrService.CreateCandidateAsync(dto);
        return CreatedAtAction(nameof(GetCandidateById), new { id = item.Id }, item);
    }

    [HttpPut("candidates/{id}")]
    public async Task<IActionResult> UpdateCandidate(string id, [FromBody] CreateATSCandidateDto dto)
    {
        var item = await _hrService.UpdateCandidateAsync(id, dto);
        if (item == null) return NotFound(new { detail = "Candidate not found." });
        return Ok(item);
    }

    [HttpDelete("candidates/{id}")]
    public async Task<IActionResult> DeleteCandidate(string id)
    {
        var deleted = await _hrService.DeleteCandidateAsync(id);
        if (!deleted) return NotFound(new { detail = "Candidate not found." });
        return Ok(new { success = true });
    }

    // ─── Employee Departments ───

    [HttpGet("employees/departments")]
    public async Task<IActionResult> GetDepartments()
    {
        var departments = await _hrService.GetDepartmentsAsync();
        return Ok(departments);
    }

    // ─── Employee Stats ───

    [HttpGet("employees/stats")]
    public async Task<IActionResult> GetEmployeeStats()
    {
        var stats = await _hrService.GetEmployeeStatsAsync();
        return Ok(stats);
    }

    // ─── Vacation Available ───

    [HttpGet("vacations/available/{employeeId}")]
    public async Task<IActionResult> GetVacationAvailable(string employeeId)
    {
        var result = await _hrService.GetVacationAvailableAsync(employeeId);
        return Ok(result);
    }

    // ─── Attendance Punch ───

    [HttpPost("attendance/punch")]
    public async Task<IActionResult> PunchClock([FromQuery] string employeeId, [FromQuery] string action)
    {
        var result = await _hrService.PunchClockAsync(employeeId, action);
        return Ok(result);
    }

    // ─── Attendance Summary ───

    [HttpGet("attendance/summary/{employeeId}")]
    public async Task<IActionResult> GetAttendanceSummary(string employeeId, [FromQuery] int? year = null, [FromQuery] int? month = null)
    {
        var result = await _hrService.GetAttendanceSummaryAsync(employeeId, year, month);
        return Ok(result);
    }

    // ─── Payroll Pay ───

    [HttpPost("payroll/{id}/pay")]
    public async Task<IActionResult> PayPayroll(string id)
    {
        var result = await _hrService.PayPayrollAsync(id);
        if (result == null) return NotFound(new { detail = "Nómina no encontrada" });
        return Ok(result);
    }

    // ─── Payroll Summary ───

    [HttpGet("payroll/summary")]
    public async Task<IActionResult> GetPayrollSummary()
    {
        var result = await _hrService.GetPayrollSummaryAsync();
        return Ok(result);
    }

    // ─── Survey Respond ───

    [HttpPost("surveys/{id}/respond")]
    public async Task<IActionResult> RespondSurvey(string id, [FromBody] SurveyAnswerDto data)
    {
        var result = await _hrService.RespondSurveyAsync(id, data.EmployeeId, data.Answers);
        return Ok(result);
    }

    // ─── ATS Positions ───

    [HttpGet("ats/positions")]
    public async Task<IActionResult> GetATSPositions()
    {
        var result = await _hrService.GetATSPositionsAsync();
        return Ok(result);
    }

    // ─── ATS Upload ───

    private const long MaxUploadBytes = 10 * 1024 * 1024; // 10 MB
    private static readonly string[] AllowedUploadExtensions =
        [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg", ".gif", ".webp"];

    // Returns (safeFilename, error) — strips path components and control chars.
    private static (string? safe, string? error) SanitizeUploadFilename(IFormFile file)
    {
        if (file.Length > MaxUploadBytes)
            return (null, $"El archivo excede el límite de {MaxUploadBytes / 1024 / 1024} MB");

        // Strip any directory component the client may have embedded
        var basename = Path.GetFileName(file.FileName);
        if (string.IsNullOrWhiteSpace(basename))
            return (null, "Nombre de archivo inválido");

        var ext = Path.GetExtension(basename).ToLowerInvariant();
        if (!AllowedUploadExtensions.Contains(ext))
            return (null, $"Tipo de archivo no permitido: {ext}");

        // Replace anything that is not alphanumeric, dash, underscore, or dot
        var stem = Path.GetFileNameWithoutExtension(basename);
        var safe = System.Text.RegularExpressions.Regex.Replace(stem, @"[^a-zA-Z0-9\-_]", "_");
        if (safe.Length > 80) safe = safe[..80];

        var uid = Guid.NewGuid().ToString("N")[..12];
        return ($"{uid}_{safe}{ext}", null);
    }

    [HttpPost("ats/upload")]
    [RequestSizeLimit(MaxUploadBytes + 4096)]
    public async Task<IActionResult> UploadATSFile(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { detail = "Archivo requerido" });

        var (fname, err) = SanitizeUploadFilename(file);
        if (err != null) return BadRequest(new { detail = err });

        var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "ats");
        Directory.CreateDirectory(uploadDir);

        var fpath = Path.Combine(uploadDir, fname!);

        // Verify final path is still inside uploadDir (double-check against traversal)
        if (!Path.GetFullPath(fpath).StartsWith(Path.GetFullPath(uploadDir) + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { detail = "Ruta de archivo inválida" });

        await using var stream = new FileStream(fpath, FileMode.CreateNew);
        await file.CopyToAsync(stream);

        return Ok(new { filename = fname, path = $"/uploads/ats/{fname}" });
    }

    // ─── Candidate Analyze AI ───

    [HttpPost("ats/{id}/analyze")]
    public async Task<IActionResult> AnalyzeCandidate(string id)
    {
        var result = await _hrService.AnalyzeCandidateAsync(id);
        if (result == null) return NotFound(new { detail = "Candidato no encontrado" });
        return Ok(result);
    }

    // ─── Position Upload Description ───

    [HttpPost("positions/{id}/upload-descr")]
    [RequestSizeLimit(MaxUploadBytes + 4096)]
    public async Task<IActionResult> UploadPositionDescription(string id, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { detail = "Archivo requerido" });

        var (fname, err) = SanitizeUploadFilename(file);
        if (err != null) return BadRequest(new { detail = err });

        var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "ats");
        Directory.CreateDirectory(uploadDir);

        var fpath = Path.Combine(uploadDir, fname!);

        if (!Path.GetFullPath(fpath).StartsWith(Path.GetFullPath(uploadDir) + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { detail = "Ruta de archivo inválida" });

        await using var stream = new FileStream(fpath, FileMode.CreateNew);
        await file.CopyToAsync(stream);

        var updated = await _hrService.UpdatePositionDescriptionAsync(id, fname!);
        if (updated == null) return NotFound(new { detail = "Posición no encontrada" });

        return Ok(new { filename = fname });
    }

    // ─── HR Dashboard ───

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetHRDashboard()
    {
        var result = await _hrService.GetHRDashboardAsync();
        return Ok(result);
    }
}

public class SurveyAnswerDto
{
    public string EmployeeId { get; set; } = "";
    public string Answers { get; set; } = "{}";
}
