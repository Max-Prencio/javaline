using System.Linq;
using System.Threading.Tasks;
using Javaline.Commercial.Application.DTOs;
using Javaline.Commercial.Application.Interfaces;
using Javaline.Commercial.Domain.Common;
using Javaline.Commercial.Domain.Entities;
using Javaline.Commercial.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Javaline.Commercial.Infrastructure.Services;

public class SurveyService : ISurveyService
{
    private readonly JavalineDbContext _db;

    public SurveyService(JavalineDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<SurveyDto>> GetAllAsync(int page, int pageSize, string? search, string? status)
    {
        IQueryable<Survey> query = _db.Surveys;

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(s => s.Status == status);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(s => s.Title.ToLower().Contains(term) || (s.Description != null && s.Description.ToLower().Contains(term)));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync();

        return new PagedResult<SurveyDto>
        {
            Items = items.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<SurveyDto?> GetByIdAsync(string id)
    {
        var entity = await _db.Surveys.FindAsync(new object[] { id });
        return entity == null ? null : MapToDto(entity);
    }

    public async Task<SurveyDto> CreateAsync(CreateSurveyDto dto, string userId)
    {
        var entity = new Survey
        {
            Title = dto.Title,
            Description = dto.Description,
            Questions = dto.Questions,
            Status = dto.Status,
            CreatedBy = userId
        };

        await _db.Surveys.AddAsync(entity);
        await _db.SaveChangesAsync();

        return MapToDto(entity);
    }

    public async Task<SurveyDto?> UpdateAsync(string id, CreateSurveyDto dto)
    {
        var entity = await _db.Surveys.FindAsync(new object[] { id });
        if (entity == null) return null;

        entity.Title = dto.Title;
        entity.Description = dto.Description;
        entity.Questions = dto.Questions;
        entity.Status = dto.Status;
        entity.CreatedBy = dto.CreatedBy;

        _db.Surveys.Update(entity);
        await _db.SaveChangesAsync();

        return MapToDto(entity);
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var entity = await _db.Surveys.FindAsync(new object[] { id });
        if (entity == null) return false;

        _db.Surveys.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }

    // ─── Responses ───

    public async Task<List<SurveyResponseDto>> GetResponsesBySurveyIdAsync(string surveyId)
    {
        return await _db.SurveyResponses
            .Where(r => r.SurveyId == surveyId)
            .OrderByDescending(r => r.SubmittedAt)
            .AsNoTracking()
            .Select(r => new SurveyResponseDto(
                r.Id, r.TenantId, r.SurveyId, r.EmployeeId, r.Answers, r.SubmittedAt, r.CreatedAt
            ))
            .ToListAsync();
    }

    public async Task<SurveyResponseDto> SubmitResponseAsync(CreateSurveyResponseDto dto)
    {
        var entity = new SurveyResponse
        {
            SurveyId = dto.SurveyId,
            EmployeeId = dto.EmployeeId,
            Answers = dto.Answers,
            SubmittedAt = DateTime.UtcNow
        };

        await _db.SurveyResponses.AddAsync(entity);
        await _db.SaveChangesAsync();

        return new SurveyResponseDto(
            entity.Id, entity.TenantId, entity.SurveyId, entity.EmployeeId,
            entity.Answers, entity.SubmittedAt, entity.CreatedAt
        );
    }

    public async Task<bool> DeleteResponseAsync(string id)
    {
        var entity = await _db.SurveyResponses.FindAsync(new object[] { id });
        if (entity == null) return false;

        _db.SurveyResponses.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }

    private static SurveyDto MapToDto(Survey s) => new(
        s.Id, s.TenantId, s.Title, s.Description, s.Questions, s.Status, s.CreatedBy, s.CreatedAt
    );
}
