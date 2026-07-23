using System.Linq;
using System.Threading.Tasks;
using Javaline.Commercial.Application.DTOs;
using Javaline.Commercial.Application.Interfaces;
using Javaline.Commercial.Domain.Common;
using Javaline.Commercial.Domain.Entities;
using Javaline.Commercial.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Javaline.Commercial.Infrastructure.Services;

public class HRService : IHRService
{
    private readonly JavalineDbContext _db;

    public HRService(JavalineDbContext db)
    {
        _db = db;
    }

    // ─── Employees ───

    public async Task<PagedResult<EmployeeDto>> GetAllEmployeesAsync(int page, int pageSize, string? search, string? status)
    {
        IQueryable<Employee> query = _db.Employees;

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(e => e.Name.ToLower().Contains(term) || (e.Email != null && e.Email.ToLower().Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(e => e.Status == status);

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(e => e.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync();

        return new PagedResult<EmployeeDto>
        {
            Items = items.Select(MapEmployeeToDto).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<EmployeeDto?> GetEmployeeByIdAsync(string id)
    {
        var entity = await _db.Employees.FindAsync(new object[] { id });
        return entity == null ? null : MapEmployeeToDto(entity);
    }

    public async Task<EmployeeDto> CreateEmployeeAsync(CreateEmployeeDto dto)
    {
        var entity = new Employee
        {
            Name = dto.Name,
            Email = dto.Email,
            Phone = dto.Phone,
            Department = dto.Department,
            Position = dto.Position,
            Salary = dto.Salary,
            SalaryType = dto.SalaryType,
            HireDate = dto.HireDate,
            ContractEndDate = dto.ContractEndDate,
            ContractType = dto.ContractType,
            Status = dto.Status,
            Photo = dto.Photo,
            SupervisorId = dto.SupervisorId,
            Rnc = dto.Rnc,
            TssNumber = dto.TssNumber,
            Ars = dto.Ars,
            AFP = dto.AFP,
            BankAccount = dto.BankAccount,
            EmergencyContact = dto.EmergencyContact,
            EmergencyPhone = dto.EmergencyPhone,
            PunchEnabled = dto.PunchEnabled,
            UserId = dto.UserId
        };

        await _db.Employees.AddAsync(entity);
        await _db.SaveChangesAsync();

        return MapEmployeeToDto(entity);
    }

    public async Task<EmployeeDto?> UpdateEmployeeAsync(string id, CreateEmployeeDto dto)
    {
        var entity = await _db.Employees.FindAsync(new object[] { id });
        if (entity == null) return null;

        entity.Name = dto.Name;
        entity.Email = dto.Email;
        entity.Phone = dto.Phone;
        entity.Department = dto.Department;
        entity.Position = dto.Position;
        entity.Salary = dto.Salary;
        entity.SalaryType = dto.SalaryType;
        entity.HireDate = dto.HireDate;
        entity.ContractEndDate = dto.ContractEndDate;
        entity.ContractType = dto.ContractType;
        entity.Status = dto.Status;
        entity.Photo = dto.Photo;
        entity.SupervisorId = dto.SupervisorId;
        entity.Rnc = dto.Rnc;
        entity.TssNumber = dto.TssNumber;
        entity.Ars = dto.Ars;
        entity.AFP = dto.AFP;
        entity.BankAccount = dto.BankAccount;
        entity.EmergencyContact = dto.EmergencyContact;
        entity.EmergencyPhone = dto.EmergencyPhone;
        entity.PunchEnabled = dto.PunchEnabled;
        entity.UserId = dto.UserId;

        _db.Employees.Update(entity);
        await _db.SaveChangesAsync();

        return MapEmployeeToDto(entity);
    }

    public async Task<bool> DeleteEmployeeAsync(string id)
    {
        var entity = await _db.Employees.FindAsync(new object[] { id });
        if (entity == null) return false;

        _db.Employees.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }

    // ─── Positions ───

    public async Task<PagedResult<PositionDto>> GetAllPositionsAsync(int page, int pageSize, string? search)
    {
        IQueryable<HRPosition> query = _db.HRPositions;

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync();

        return new PagedResult<PositionDto>
        {
            Items = items.Select(MapPositionToDto).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<PositionDto?> GetPositionByIdAsync(string id)
    {
        var entity = await _db.HRPositions.FindAsync(new object[] { id });
        return entity == null ? null : MapPositionToDto(entity);
    }

    public async Task<PositionDto> CreatePositionAsync(CreatePositionDto dto)
    {
        var entity = new HRPosition
        {
            Name = dto.Name,
            DescriptionFile = dto.DescriptionFile
        };

        await _db.HRPositions.AddAsync(entity);
        await _db.SaveChangesAsync();

        return MapPositionToDto(entity);
    }

    public async Task<PositionDto?> UpdatePositionAsync(string id, CreatePositionDto dto)
    {
        var entity = await _db.HRPositions.FindAsync(new object[] { id });
        if (entity == null) return null;

        entity.Name = dto.Name;
        entity.DescriptionFile = dto.DescriptionFile;

        _db.HRPositions.Update(entity);
        await _db.SaveChangesAsync();

        return MapPositionToDto(entity);
    }

    public async Task<bool> DeletePositionAsync(string id)
    {
        var entity = await _db.HRPositions.FindAsync(new object[] { id });
        if (entity == null) return false;

        _db.HRPositions.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }

    // ─── Deductions ───

    public async Task<PagedResult<DeductionDto>> GetAllDeductionsAsync(int page, int pageSize, string? search, string? employeeId)
    {
        IQueryable<Deduction> query = _db.Deductions;

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(d => d.Name.ToLower().Contains(term) || d.DeductionType.ToLower().Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(employeeId))
            query = query.Where(d => d.EmployeeId == employeeId);

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(d => d.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync();

        return new PagedResult<DeductionDto>
        {
            Items = items.Select(MapDeductionToDto).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<DeductionDto?> GetDeductionByIdAsync(string id)
    {
        var entity = await _db.Deductions.FindAsync(new object[] { id });
        return entity == null ? null : MapDeductionToDto(entity);
    }

    public async Task<DeductionDto> CreateDeductionAsync(CreateDeductionDto dto)
    {
        var entity = new Deduction
        {
            EmployeeId = dto.EmployeeId,
            Name = dto.Name,
            DeductionType = dto.DeductionType,
            Amount = dto.Amount,
            Percentage = dto.Percentage,
            IsMandatory = dto.IsMandatory,
            IsActive = dto.IsActive,
            Description = dto.Description
        };

        await _db.Deductions.AddAsync(entity);
        await _db.SaveChangesAsync();

        return MapDeductionToDto(entity);
    }

    public async Task<DeductionDto?> UpdateDeductionAsync(string id, CreateDeductionDto dto)
    {
        var entity = await _db.Deductions.FindAsync(new object[] { id });
        if (entity == null) return null;

        entity.EmployeeId = dto.EmployeeId;
        entity.Name = dto.Name;
        entity.DeductionType = dto.DeductionType;
        entity.Amount = dto.Amount;
        entity.Percentage = dto.Percentage;
        entity.IsMandatory = dto.IsMandatory;
        entity.IsActive = dto.IsActive;
        entity.Description = dto.Description;

        _db.Deductions.Update(entity);
        await _db.SaveChangesAsync();

        return MapDeductionToDto(entity);
    }

    public async Task<bool> DeleteDeductionAsync(string id)
    {
        var entity = await _db.Deductions.FindAsync(new object[] { id });
        if (entity == null) return false;

        _db.Deductions.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }

    // ─── Payrolls ───

    public async Task<PagedResult<PayrollDto>> GetAllPayrollsAsync(int page, int pageSize, string? search, string? status)
    {
        IQueryable<Payroll> query = _db.Payrolls;

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(p => p.Status == status);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(p => p.EmployeeId.ToLower().Contains(term) || p.Notes != null && p.Notes.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync();

        return new PagedResult<PayrollDto>
        {
            Items = items.Select(MapPayrollToDto).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<PayrollDto?> GetPayrollByIdAsync(string id)
    {
        var entity = await _db.Payrolls.FindAsync(new object[] { id });
        return entity == null ? null : MapPayrollToDto(entity);
    }

    public async Task<PayrollDto> CreatePayrollAsync(CreatePayrollDto dto)
    {
        var entity = new Payroll
        {
            EmployeeId = dto.EmployeeId,
            PeriodStart = dto.PeriodStart,
            PeriodEnd = dto.PeriodEnd,
            GrossSalary = dto.GrossSalary,
            TotalDeductions = dto.TotalDeductions,
            NetSalary = dto.NetSalary,
            Bonuses = dto.Bonuses,
            OvertimePay = dto.OvertimePay,
            Status = dto.Status,
            PaidAt = dto.PaidAt,
            PaymentMethod = dto.PaymentMethod,
            ReceiptSent = dto.ReceiptSent,
            Notes = dto.Notes
        };

        await _db.Payrolls.AddAsync(entity);
        await _db.SaveChangesAsync();

        return MapPayrollToDto(entity);
    }

    public async Task<PayrollDto?> UpdatePayrollAsync(string id, CreatePayrollDto dto)
    {
        var entity = await _db.Payrolls.FindAsync(new object[] { id });
        if (entity == null) return null;

        entity.EmployeeId = dto.EmployeeId;
        entity.PeriodStart = dto.PeriodStart;
        entity.PeriodEnd = dto.PeriodEnd;
        entity.GrossSalary = dto.GrossSalary;
        entity.TotalDeductions = dto.TotalDeductions;
        entity.NetSalary = dto.NetSalary;
        entity.Bonuses = dto.Bonuses;
        entity.OvertimePay = dto.OvertimePay;
        entity.Status = dto.Status;
        entity.PaidAt = dto.PaidAt;
        entity.PaymentMethod = dto.PaymentMethod;
        entity.ReceiptSent = dto.ReceiptSent;
        entity.Notes = dto.Notes;

        _db.Payrolls.Update(entity);
        await _db.SaveChangesAsync();

        return MapPayrollToDto(entity);
    }

    public async Task<bool> DeletePayrollAsync(string id)
    {
        var entity = await _db.Payrolls.FindAsync(new object[] { id });
        if (entity == null) return false;

        _db.Payrolls.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }

    // ─── Vacations ───

    public async Task<PagedResult<VacationDto>> GetAllVacationsAsync(int page, int pageSize, string? search, string? status)
    {
        IQueryable<Vacation> query = _db.Vacations;

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(v => v.Status == status);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(v => v.EmployeeId.ToLower().Contains(term) || v.VacationType.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(v => v.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync();

        return new PagedResult<VacationDto>
        {
            Items = items.Select(MapVacationToDto).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<VacationDto?> GetVacationByIdAsync(string id)
    {
        var entity = await _db.Vacations.FindAsync(new object[] { id });
        return entity == null ? null : MapVacationToDto(entity);
    }

    public async Task<VacationDto> CreateVacationAsync(CreateVacationDto dto)
    {
        var entity = new Vacation
        {
            EmployeeId = dto.EmployeeId,
            VacationType = dto.VacationType,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            TotalDays = dto.TotalDays,
            Status = dto.Status,
            ApprovedBy = dto.ApprovedBy,
            Year = dto.Year,
            IsRecurring = dto.IsRecurring,
            Notes = dto.Notes
        };

        await _db.Vacations.AddAsync(entity);
        await _db.SaveChangesAsync();

        return MapVacationToDto(entity);
    }

    public async Task<VacationDto?> UpdateVacationAsync(string id, CreateVacationDto dto)
    {
        var entity = await _db.Vacations.FindAsync(new object[] { id });
        if (entity == null) return null;

        entity.EmployeeId = dto.EmployeeId;
        entity.VacationType = dto.VacationType;
        entity.StartDate = dto.StartDate;
        entity.EndDate = dto.EndDate;
        entity.TotalDays = dto.TotalDays;
        entity.Status = dto.Status;
        entity.ApprovedBy = dto.ApprovedBy;
        entity.Year = dto.Year;
        entity.IsRecurring = dto.IsRecurring;
        entity.Notes = dto.Notes;

        _db.Vacations.Update(entity);
        await _db.SaveChangesAsync();

        return MapVacationToDto(entity);
    }

    public async Task<bool> DeleteVacationAsync(string id)
    {
        var entity = await _db.Vacations.FindAsync(new object[] { id });
        if (entity == null) return false;

        _db.Vacations.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }

    // ─── Attendances ───

    public async Task<PagedResult<AttendanceDto>> GetAllAttendancesAsync(int page, int pageSize, string? search, string? status)
    {
        IQueryable<Attendance> query = _db.Attendances;

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(a => a.Status == status);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(a => a.EmployeeId.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync();

        return new PagedResult<AttendanceDto>
        {
            Items = items.Select(MapAttendanceToDto).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<AttendanceDto?> GetAttendanceByIdAsync(string id)
    {
        var entity = await _db.Attendances.FindAsync(new object[] { id });
        return entity == null ? null : MapAttendanceToDto(entity);
    }

    public async Task<AttendanceDto> CreateAttendanceAsync(CreateAttendanceDto dto)
    {
        var entity = new Attendance
        {
            EmployeeId = dto.EmployeeId,
            Date = dto.Date,
            ClockIn = dto.ClockIn,
            ClockOut = dto.ClockOut,
            BreakStart = dto.BreakStart,
            BreakEnd = dto.BreakEnd,
            TotalHours = dto.TotalHours,
            OvertimeHours = dto.OvertimeHours,
            MissingHours = dto.MissingHours,
            Status = dto.Status,
            Source = dto.Source,
            Notes = dto.Notes
        };

        await _db.Attendances.AddAsync(entity);
        await _db.SaveChangesAsync();

        return MapAttendanceToDto(entity);
    }

    public async Task<AttendanceDto?> UpdateAttendanceAsync(string id, CreateAttendanceDto dto)
    {
        var entity = await _db.Attendances.FindAsync(new object[] { id });
        if (entity == null) return null;

        entity.EmployeeId = dto.EmployeeId;
        entity.Date = dto.Date;
        entity.ClockIn = dto.ClockIn;
        entity.ClockOut = dto.ClockOut;
        entity.BreakStart = dto.BreakStart;
        entity.BreakEnd = dto.BreakEnd;
        entity.TotalHours = dto.TotalHours;
        entity.OvertimeHours = dto.OvertimeHours;
        entity.MissingHours = dto.MissingHours;
        entity.Status = dto.Status;
        entity.Source = dto.Source;
        entity.Notes = dto.Notes;

        _db.Attendances.Update(entity);
        await _db.SaveChangesAsync();

        return MapAttendanceToDto(entity);
    }

    public async Task<bool> DeleteAttendanceAsync(string id)
    {
        var entity = await _db.Attendances.FindAsync(new object[] { id });
        if (entity == null) return false;

        _db.Attendances.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }

    // ─── Performance Evaluations ───

    public async Task<PagedResult<PerformanceEvaluationDto>> GetAllEvaluationsAsync(int page, int pageSize, string? search, string? status)
    {
        IQueryable<PerformanceEvaluation> query = _db.PerformanceEvaluations;

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(p => p.Status == status);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(p => p.EmployeeId.ToLower().Contains(term) || (p.Category != null && p.Category.ToLower().Contains(term)));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync();

        return new PagedResult<PerformanceEvaluationDto>
        {
            Items = items.Select(MapEvaluationToDto).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<PerformanceEvaluationDto?> GetEvaluationByIdAsync(string id)
    {
        var entity = await _db.PerformanceEvaluations.FindAsync(new object[] { id });
        return entity == null ? null : MapEvaluationToDto(entity);
    }

    public async Task<PerformanceEvaluationDto> CreateEvaluationAsync(CreatePerformanceEvaluationDto dto)
    {
        var entity = new PerformanceEvaluation
        {
            EmployeeId = dto.EmployeeId,
            EvaluatorId = dto.EvaluatorId,
            EvaluationDate = dto.EvaluationDate,
            Score = dto.Score,
            MaxScore = dto.MaxScore,
            Category = dto.Category,
            Strengths = dto.Strengths,
            Weaknesses = dto.Weaknesses,
            Recommendations = dto.Recommendations,
            CriteriaScores = dto.CriteriaScores,
            Status = dto.Status
        };

        await _db.PerformanceEvaluations.AddAsync(entity);
        await _db.SaveChangesAsync();

        return MapEvaluationToDto(entity);
    }

    public async Task<PerformanceEvaluationDto?> UpdateEvaluationAsync(string id, CreatePerformanceEvaluationDto dto)
    {
        var entity = await _db.PerformanceEvaluations.FindAsync(new object[] { id });
        if (entity == null) return null;

        entity.EmployeeId = dto.EmployeeId;
        entity.EvaluatorId = dto.EvaluatorId;
        entity.EvaluationDate = dto.EvaluationDate;
        entity.Score = dto.Score;
        entity.MaxScore = dto.MaxScore;
        entity.Category = dto.Category;
        entity.Strengths = dto.Strengths;
        entity.Weaknesses = dto.Weaknesses;
        entity.Recommendations = dto.Recommendations;
        entity.CriteriaScores = dto.CriteriaScores;
        entity.Status = dto.Status;

        _db.PerformanceEvaluations.Update(entity);
        await _db.SaveChangesAsync();

        return MapEvaluationToDto(entity);
    }

    public async Task<bool> DeleteEvaluationAsync(string id)
    {
        var entity = await _db.PerformanceEvaluations.FindAsync(new object[] { id });
        if (entity == null) return false;

        _db.PerformanceEvaluations.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }

    // ─── ATS Candidates ───

    public async Task<PagedResult<ATSCandidateDto>> GetAllCandidatesAsync(int page, int pageSize, string? search, string? status)
    {
        IQueryable<ATSCandidate> query = _db.ATSCandidates;

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(c => c.Status == status);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(c => c.Name.ToLower().Contains(term) || (c.Email != null && c.Email.ToLower().Contains(term)));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync();

        return new PagedResult<ATSCandidateDto>
        {
            Items = items.Select(MapCandidateToDto).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<ATSCandidateDto?> GetCandidateByIdAsync(string id)
    {
        var entity = await _db.ATSCandidates.FindAsync(new object[] { id });
        return entity == null ? null : MapCandidateToDto(entity);
    }

    public async Task<ATSCandidateDto> CreateCandidateAsync(CreateATSCandidateDto dto)
    {
        var entity = new ATSCandidate
        {
            Name = dto.Name,
            Email = dto.Email,
            Phone = dto.Phone,
            PositionApplied = dto.PositionApplied,
            ResumeFile = dto.ResumeFile,
            ResumeText = dto.ResumeText,
            PositionDescrFile = dto.PositionDescrFile,
            AiAnalysis = dto.AiAnalysis,
            Classification = dto.Classification,
            Score = dto.Score,
            Strengths = dto.Strengths,
            Weaknesses = dto.Weaknesses,
            Recommendations = dto.Recommendations,
            Status = dto.Status,
            EvaluatedBy = dto.EvaluatedBy,
            Notes = dto.Notes
        };

        await _db.ATSCandidates.AddAsync(entity);
        await _db.SaveChangesAsync();

        return MapCandidateToDto(entity);
    }

    public async Task<ATSCandidateDto?> UpdateCandidateAsync(string id, CreateATSCandidateDto dto)
    {
        var entity = await _db.ATSCandidates.FindAsync(new object[] { id });
        if (entity == null) return null;

        entity.Name = dto.Name;
        entity.Email = dto.Email;
        entity.Phone = dto.Phone;
        entity.PositionApplied = dto.PositionApplied;
        entity.ResumeFile = dto.ResumeFile;
        entity.ResumeText = dto.ResumeText;
        entity.PositionDescrFile = dto.PositionDescrFile;
        entity.AiAnalysis = dto.AiAnalysis;
        entity.Classification = dto.Classification;
        entity.Score = dto.Score;
        entity.Strengths = dto.Strengths;
        entity.Weaknesses = dto.Weaknesses;
        entity.Recommendations = dto.Recommendations;
        entity.Status = dto.Status;
        entity.EvaluatedBy = dto.EvaluatedBy;
        entity.Notes = dto.Notes;

        _db.ATSCandidates.Update(entity);
        await _db.SaveChangesAsync();

        return MapCandidateToDto(entity);
    }

    public async Task<bool> DeleteCandidateAsync(string id)
    {
        var entity = await _db.ATSCandidates.FindAsync(new object[] { id });
        if (entity == null) return false;

        _db.ATSCandidates.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }

    // ─── Additional HR Endpoints ───

    public async Task<List<string>> GetDepartmentsAsync()
    {
        return await _db.Employees
            .Where(e => e.Department != null && e.Department != "")
            .Select(e => e.Department!)
            .Distinct()
            .OrderBy(d => d)
            .ToListAsync();
    }

    public async Task<object> GetEmployeeStatsAsync()
    {
        var total = await _db.Employees.CountAsync();
        var active = await _db.Employees.CountAsync(e => e.Status == "active");
        var totalSalary = await _db.Employees
            .Where(e => e.Status == "active" && e.Salary != null)
            .SumAsync(e => e.Salary!);
        var departments = await _db.Employees
            .Where(e => e.Department != null && e.Department != "")
            .Select(e => e.Department!)
            .Distinct()
            .CountAsync();

        return new
        {
            totalEmployees = total,
            activeEmployees = active,
            inactiveEmployees = total - active,
            totalMonthlySalary = totalSalary,
            departmentCount = departments
        };
    }

    public async Task<object> GetVacationAvailableAsync(string employeeId)
    {
        var currentYear = DateTime.UtcNow.Year;
        var totalDays = 14;
        var usedDays = await _db.Vacations
            .Where(v => v.EmployeeId == employeeId && v.Year == currentYear && v.Status == "approved")
            .SumAsync(v => v.TotalDays);

        return new
        {
            employeeId,
            year = currentYear,
            totalDays,
            usedDays,
            availableDays = totalDays - usedDays
        };
    }

    public async Task<object> PunchClockAsync(string employeeId, string action)
    {
        var today = DateTime.UtcNow.Date;
        var record = await _db.Attendances
            .FirstOrDefaultAsync(a => a.EmployeeId == employeeId && a.Date == today);

        if (record == null)
        {
            record = new Attendance
            {
                EmployeeId = employeeId,
                Date = today,
                Status = "present",
                Source = "punch"
            };
            _db.Attendances.Add(record);
        }

        var now = DateTime.UtcNow;
        switch (action.ToLower())
        {
            case "in":
                record.ClockIn = now;
                break;
            case "out":
                record.ClockOut = now;
                break;
            case "break_start":
                record.BreakStart = now;
                break;
            case "break_end":
                record.BreakEnd = now;
                break;
        }

        if (record.ClockIn != null && record.ClockOut != null)
        {
            var total = (record.ClockOut.Value - record.ClockIn.Value).TotalHours;
            if (record.BreakStart != null && record.BreakEnd != null)
                total -= (record.BreakEnd.Value - record.BreakStart.Value).TotalHours;
            record.TotalHours = (decimal)Math.Round(total, 2);
            if (total > 8) record.OvertimeHours = (decimal)Math.Round(total - 8, 2);
            else if (total < 8) record.MissingHours = (decimal)Math.Round(8 - total, 2);
        }

        await _db.SaveChangesAsync();

        return new
        {
            id = record.Id,
            employeeId,
            action,
            timestamp = now,
            clockIn = record.ClockIn,
            clockOut = record.ClockOut,
            breakStart = record.BreakStart,
            breakEnd = record.BreakEnd,
            totalHours = record.TotalHours
        };
    }

    public async Task<object> GetAttendanceSummaryAsync(string employeeId, int? year, int? month)
    {
        var y = year ?? DateTime.UtcNow.Year;
        var m = month ?? DateTime.UtcNow.Month;

        var records = await _db.Attendances
            .Where(a => a.EmployeeId == employeeId && a.Date.Year == y && a.Date.Month == m)
            .ToListAsync();

        var totalHours = records.Sum(r => r.TotalHours);
        var overtimeHours = records.Sum(r => r.OvertimeHours);
        var missingHours = records.Sum(r => r.MissingHours);
        var daysPresent = records.Count(r => r.Status == "present");
        var daysAbsent = DateTime.DaysInMonth(y, m) - records.Count;

        return new
        {
            employeeId,
            year = y,
            month = m,
            totalHours,
            overtimeHours,
            missingHours,
            daysPresent,
            daysAbsent,
            totalRecords = records.Count
        };
    }

    public async Task<object?> PayPayrollAsync(string payrollId)
    {
        var entity = await _db.Payrolls.FindAsync(new object[] { payrollId });
        if (entity == null) return null;

        entity.Status = "paid";
        entity.PaidAt = DateTime.UtcNow;
        _db.Payrolls.Update(entity);
        await _db.SaveChangesAsync();

        return MapPayrollToDto(entity);
    }

    public async Task<object> GetPayrollSummaryAsync()
    {
        var all = await _db.Payrolls.AsNoTracking().ToListAsync();

        return new
        {
            totalCount = all.Count,
            paidCount = all.Count(p => p.Status == "paid"),
            pendingCount = all.Count(p => p.Status == "pending"),
            totalGross = all.Sum(p => p.GrossSalary),
            totalNet = all.Sum(p => p.NetSalary),
            totalDeductions = all.Sum(p => p.TotalDeductions)
        };
    }

    public async Task<object> RespondSurveyAsync(string surveyId, string employeeId, string answers)
    {
        var survey = await _db.Surveys.FindAsync(new object[] { surveyId });
        if (survey == null)
            return new { error = "Encuesta no encontrada" };

        var response = new SurveyResponse
        {
            SurveyId = surveyId,
            EmployeeId = employeeId,
            Answers = answers,
            SubmittedAt = DateTime.UtcNow
        };

        _db.SurveyResponses.Add(response);
        await _db.SaveChangesAsync();

        return new
        {
            id = response.Id,
            surveyId,
            employeeId,
            answers,
            submittedAt = response.SubmittedAt
        };
    }

    public async Task<List<string>> GetATSPositionsAsync()
    {
        return await _db.HRPositions
            .Select(p => p.Name)
            .Distinct()
            .OrderBy(n => n)
            .ToListAsync();
    }

    public async Task<object?> AnalyzeCandidateAsync(string candidateId)
    {
        var candidate = await _db.ATSCandidates.FindAsync(new object[] { candidateId });
        if (candidate == null) return null;

        candidate.Classification = candidate.Classification ?? "pending";
        candidate.AiAnalysis = candidate.AiAnalysis ?? "Análisis no disponible - OpenAI no configurado";
        candidate.Score = candidate.Score ?? 0;
        candidate.Strengths = candidate.Strengths ?? "";
        candidate.Weaknesses = candidate.Weaknesses ?? "";
        candidate.Recommendations = candidate.Recommendations ?? "";

        _db.ATSCandidates.Update(candidate);
        await _db.SaveChangesAsync();

        return MapCandidateToDto(candidate);
    }

    public async Task<object?> UpdatePositionDescriptionAsync(string positionId, string fileName)
    {
        var entity = await _db.HRPositions.FindAsync(new object[] { positionId });
        if (entity == null) return null;

        entity.DescriptionFile = fileName;
        _db.HRPositions.Update(entity);
        await _db.SaveChangesAsync();

        return MapPositionToDto(entity);
    }

    public async Task<object> GetHRDashboardAsync()
    {
        var totalEmployees = await _db.Employees.CountAsync();
        var activeEmployees = await _db.Employees.CountAsync(e => e.Status == "active");

        var totalPayroll = await _db.Payrolls
            .Where(p => p.Status == "paid")
            .SumAsync(p => (decimal?)p.NetSalary) ?? 0;

        var pendingPayrolls = await _db.Payrolls.CountAsync(p => p.Status == "pending");

        var pendingVacations = await _db.Vacations.CountAsync(v => v.Status == "pending");

        var totalCandidates = await _db.ATSCandidates.CountAsync();
        var newCandidates = await _db.ATSCandidates.CountAsync(c => c.Status == "new");

        var totalEvaluations = await _db.PerformanceEvaluations.CountAsync();

        var departments = await _db.Employees
            .Where(e => e.Department != null && e.Department != "")
            .Select(e => e.Department!)
            .Distinct()
            .CountAsync();

        return new
        {
            totalEmployees,
            activeEmployees,
            totalPayroll,
            pendingPayrolls,
            pendingVacations,
            totalCandidates,
            newCandidates,
            totalEvaluations,
            departments
        };
    }

    // ─── Mapping helpers ───

    private static EmployeeDto MapEmployeeToDto(Employee e) => new(
        e.Id, e.TenantId, e.UserId, e.Name, e.Email, e.Phone, e.Department, e.Position,
        e.Salary, e.SalaryType, e.HireDate, e.ContractEndDate, e.ContractType, e.Status,
        e.Photo, e.SupervisorId, e.Rnc, e.TssNumber, e.Ars, e.AFP, e.BankAccount,
        e.EmergencyContact, e.EmergencyPhone, e.PunchEnabled, e.CreatedAt
    );

    private static PositionDto MapPositionToDto(HRPosition p) => new(
        p.Id, p.TenantId, p.Name, p.DescriptionFile, p.CreatedAt
    );

    private static DeductionDto MapDeductionToDto(Deduction d) => new(
        d.Id, d.TenantId, d.EmployeeId, d.Name, d.DeductionType, d.Amount, d.Percentage,
        d.IsMandatory, d.IsActive, d.Description, d.CreatedAt
    );

    private static PayrollDto MapPayrollToDto(Payroll p) => new(
        p.Id, p.TenantId, p.EmployeeId, p.PeriodStart, p.PeriodEnd, p.GrossSalary,
        p.TotalDeductions, p.NetSalary, p.Bonuses, p.OvertimePay, p.Status, p.PaidAt,
        p.PaymentMethod, p.ReceiptSent, p.Notes, p.CreatedAt
    );

    private static VacationDto MapVacationToDto(Vacation v) => new(
        v.Id, v.TenantId, v.EmployeeId, v.VacationType, v.StartDate, v.EndDate,
        v.TotalDays, v.Status, v.ApprovedBy, v.Year, v.IsRecurring, v.Notes, v.CreatedAt
    );

    private static AttendanceDto MapAttendanceToDto(Attendance a) => new(
        a.Id, a.TenantId, a.EmployeeId, a.Date, a.ClockIn, a.ClockOut, a.BreakStart,
        a.BreakEnd, a.TotalHours, a.OvertimeHours, a.MissingHours, a.Status, a.Source,
        a.Notes, a.CreatedAt
    );

    private static PerformanceEvaluationDto MapEvaluationToDto(PerformanceEvaluation p) => new(
        p.Id, p.TenantId, p.EmployeeId, p.EvaluatorId, p.EvaluationDate, p.Score,
        p.MaxScore, p.Category, p.Strengths, p.Weaknesses, p.Recommendations,
        p.CriteriaScores, p.Status, p.CreatedAt
    );

    private static ATSCandidateDto MapCandidateToDto(ATSCandidate c) => new(
        c.Id, c.TenantId, c.Name, c.Email, c.Phone, c.PositionApplied, c.ResumeFile,
        c.ResumeText, c.PositionDescrFile, c.AiAnalysis, c.Classification, c.Score,
        c.Strengths, c.Weaknesses, c.Recommendations, c.Status, c.EvaluatedBy,
        c.Notes, c.CreatedAt
    );
}
