using Javaline.Commercial.Application.DTOs;
using Javaline.Commercial.Application.Interfaces;
using Javaline.Commercial.Domain.Common;
using Javaline.Commercial.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Javaline.Commercial.Api.Controllers;

[ApiController]
[Route("admin")]
[Authorize(Roles = "admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    // ─── Permissions ───

    [HttpGet("permissions")]
    public async Task<IActionResult> GetAllPermissions(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? userId = null)
    {
        var result = await _adminService.GetAllPermissionsAsync(page, pageSize, search, userId);
        return Ok(result);
    }

    [HttpGet("permissions/{id}")]
    public async Task<IActionResult> GetPermissionById(string id)
    {
        var item = await _adminService.GetPermissionByIdAsync(id);
        if (item == null) return NotFound(new { detail = "Permission not found." });
        return Ok(item);
    }

    [HttpPost("permissions")]
    public async Task<IActionResult> CreatePermission([FromBody] CreatePermissionDto dto)
    {
        var item = await _adminService.CreatePermissionAsync(dto);
        return CreatedAtAction(nameof(GetPermissionById), new { id = item.Id }, item);
    }

    [HttpPut("permissions/{id}")]
    public async Task<IActionResult> UpdatePermission(string id, [FromBody] CreatePermissionDto dto)
    {
        var item = await _adminService.UpdatePermissionAsync(id, dto);
        if (item == null) return NotFound(new { detail = "Permission not found." });
        return Ok(item);
    }

    [HttpDelete("permissions/{id}")]
    public async Task<IActionResult> DeletePermission(string id)
    {
        var deleted = await _adminService.DeletePermissionAsync(id);
        if (!deleted) return NotFound(new { detail = "Permission not found." });
        return Ok(new { success = true });
    }

    // ─── Audit Logs ───

    [HttpGet("audit-logs")]
    public async Task<IActionResult> GetAllAuditLogs(
        [FromQuery] string? entityType = null,
        [FromQuery] string? userId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _adminService.GetAllAuditLogsAsync(page, pageSize, entityType, userId);
        return Ok(result);
    }

    // ─── Branches ───

    [HttpGet("branches")]
    public async Task<IActionResult> GetAllBranches(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
    {
        var result = await _adminService.GetAllBranchesAsync(page, pageSize, search);
        return Ok(result);
    }

    [HttpGet("branches/{id}")]
    public async Task<IActionResult> GetBranchById(string id)
    {
        var item = await _adminService.GetBranchByIdAsync(id);
        if (item == null) return NotFound(new { detail = "Branch not found." });
        return Ok(item);
    }

    [HttpPost("branches")]
    public async Task<IActionResult> CreateBranch([FromBody] CreateBranchDto dto)
    {
        var item = await _adminService.CreateBranchAsync(dto);
        return CreatedAtAction(nameof(GetBranchById), new { id = item.Id }, item);
    }

    [HttpPut("branches/{id}")]
    public async Task<IActionResult> UpdateBranch(string id, [FromBody] CreateBranchDto dto)
    {
        var item = await _adminService.UpdateBranchAsync(id, dto);
        if (item == null) return NotFound(new { detail = "Branch not found." });
        return Ok(item);
    }

    [HttpDelete("branches/{id}")]
    public async Task<IActionResult> DeleteBranch(string id)
    {
        var deleted = await _adminService.DeleteBranchAsync(id);
        if (!deleted) return NotFound(new { detail = "Branch not found." });
        return Ok(new { success = true });
    }

    // ─── Settings ───

    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings([FromQuery] string tenantId)
    {
        if (string.IsNullOrEmpty(tenantId))
            return BadRequest(new { detail = "tenantId is required." });

        var result = await _adminService.GetTenantSettingsAsync(tenantId);
        return Ok(result);
    }

    [HttpPut("settings")]
    public async Task<IActionResult> UpdateSettings([FromBody] UpdateTenantSettingsDto dto)
    {
        var item = await _adminService.UpdateTenantSettingAsync(dto);
        return Ok(item);
    }

    // ─── Notifications ───

    [HttpGet("notifications")]
    public async Task<IActionResult> GetAllNotifications(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? userId = null)
    {
        var result = await _adminService.GetAllNotificationsAsync(page, pageSize, userId);
        return Ok(result);
    }

    [HttpPost("notifications")]
    public IActionResult CreateNotification()
    {
        return StatusCode(501, new { detail = "Notification creation is not yet implemented." });
    }

    [HttpPut("notifications/{id}/read")]
    public async Task<IActionResult> MarkNotificationAsRead(string id)
    {
        var marked = await _adminService.MarkAsReadAsync(id);
        if (!marked) return NotFound(new { detail = "Notification not found." });
        return Ok(new { success = true });
    }

    // ─── Duplicate Detection ───

    [HttpGet("detect-duplicates")]
    public async Task<IActionResult> DetectDuplicates()
    {
        var duplicates = await _adminService.DetectDuplicatesAsync();
        return Ok(new { duplicates, total = duplicates.Count });
    }

    [HttpPost("detect-duplicates/resolve")]
    public async Task<IActionResult> ResolveDuplicates([FromBody] ResolveDuplicateDto data)
    {
        if (string.IsNullOrEmpty(data.Action) || string.IsNullOrEmpty(data.Entity) ||
            string.IsNullOrEmpty(data.PrimaryId) || string.IsNullOrEmpty(data.DuplicateId))
            return BadRequest(new { detail = "action, entity, primary_id, duplicate_id requeridos" });

        if (data.Action != "merge" && data.Action != "delete")
            return BadRequest(new { detail = "action debe ser 'merge' o 'delete'" });

        var resolved = await _adminService.ResolveDuplicateAsync(data.Action, data.Entity, data.PrimaryId, data.DuplicateId);
        if (!resolved) return NotFound(new { detail = "Registro primario o duplicado no encontrado" });

        return Ok(new { message = $"Duplicado {(data.Action == "merge" ? "fusionado" : "eliminado")}", primary_id = data.PrimaryId });
    }
}

public record ResolveDuplicateDto(string Action, string Entity, string PrimaryId, string DuplicateId);
