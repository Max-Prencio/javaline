using Javaline.Commercial.Application.DTOs;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Application.Interfaces;

public interface ISurveyService
{
    Task<PagedResult<SurveyDto>> GetAllAsync(int page, int pageSize, string? search, string? status);
    Task<SurveyDto?> GetByIdAsync(string id);
    Task<SurveyDto> CreateAsync(CreateSurveyDto dto, string userId);
    Task<SurveyDto?> UpdateAsync(string id, CreateSurveyDto dto);
    Task<bool> DeleteAsync(string id);

    Task<List<SurveyResponseDto>> GetResponsesBySurveyIdAsync(string surveyId);
    Task<SurveyResponseDto> SubmitResponseAsync(CreateSurveyResponseDto dto);
    Task<bool> DeleteResponseAsync(string id);
}
