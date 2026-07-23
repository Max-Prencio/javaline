using Javaline.Commercial.Application.DTOs;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Application.Interfaces;

public interface IAdminService
{
    Task<PagedResult<PermissionDto>> GetAllPermissionsAsync(int page, int pageSize, string? search, string? userId);
    Task<PermissionDto?> GetPermissionByIdAsync(string id);
    Task<PermissionDto> CreatePermissionAsync(CreatePermissionDto dto);
    Task<PermissionDto?> UpdatePermissionAsync(string id, CreatePermissionDto dto);
    Task<bool> DeletePermissionAsync(string id);

    Task<PagedResult<AuditLogDto>> GetAllAuditLogsAsync(int page, int pageSize, string? search, string? userId);
    Task<AuditLogDto?> GetAuditLogByIdAsync(string id);

    Task<PagedResult<BranchDto>> GetAllBranchesAsync(int page, int pageSize, string? search);
    Task<BranchDto?> GetBranchByIdAsync(string id);
    Task<BranchDto> CreateBranchAsync(CreateBranchDto dto);
    Task<BranchDto?> UpdateBranchAsync(string id, CreateBranchDto dto);
    Task<bool> DeleteBranchAsync(string id);

    Task<List<TenantSettingsDto>> GetTenantSettingsAsync(string tenantId);
    Task<TenantSettingsDto?> GetTenantSettingByKeyAsync(string tenantId, string key);
    Task<TenantSettingsDto> UpdateTenantSettingAsync(UpdateTenantSettingsDto dto);

    Task<PagedResult<NotificationDto>> GetAllNotificationsAsync(int page, int pageSize, string? userId);
    Task<NotificationDto?> GetNotificationByIdAsync(string id);
    Task<bool> MarkAsReadAsync(string id);

    Task<List<DuplicatePairDto>> DetectDuplicatesAsync();
    Task<bool> ResolveDuplicateAsync(string action, string entity, string primaryId, string duplicateId);
}
