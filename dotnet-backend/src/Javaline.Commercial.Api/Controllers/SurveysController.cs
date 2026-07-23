using System.Security.Claims;
using Javaline.Commercial.Application.DTOs;
using Javaline.Commercial.Application.Interfaces;
using Javaline.Commercial.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Javaline.Commercial.Api.Controllers;

[ApiController]
[Route("surveys")]
[Authorize]
public class SurveysController : ControllerBase
{
    private readonly ISurveyService _surveyService;

    public SurveysController(ISurveyService surveyService) => _surveyService = surveyService;

    private string? GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? User.FindFirst("sub")?.Value;

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null)
    {
        var result = await _surveyService.GetAllAsync(page, pageSize, search, status);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var item = await _surveyService.GetByIdAsync(id);
        if (item == null) return NotFound(new { detail = "Survey not found." });
        return Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSurveyDto dto)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { detail = "User not authenticated." });

        var item = await _surveyService.CreateAsync(dto, userId);
        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] CreateSurveyDto dto)
    {
        var item = await _surveyService.UpdateAsync(id, dto);
        if (item == null) return NotFound(new { detail = "Survey not found." });
        return Ok(item);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var deleted = await _surveyService.DeleteAsync(id);
        if (!deleted) return NotFound(new { detail = "Survey not found." });
        return Ok(new { success = true });
    }

    // ─── Responses ───

    [HttpGet("{id}/responses")]
    public async Task<IActionResult> GetResponses(string id)
    {
        var responses = await _surveyService.GetResponsesBySurveyIdAsync(id);
        return Ok(responses);
    }

    [HttpPost("{id}/responses")]
    public async Task<IActionResult> SubmitResponse(string id, [FromBody] CreateSurveyResponseDto dto)
    {
        var responseDto = dto with { SurveyId = id };
        var item = await _surveyService.SubmitResponseAsync(responseDto);
        return CreatedAtAction(nameof(GetResponses), new { id }, item);
    }
}
