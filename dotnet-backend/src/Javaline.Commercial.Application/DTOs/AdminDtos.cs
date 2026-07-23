namespace Javaline.Commercial.Application.DTOs;

public record PermissionDto(
    string Id,
    string UserId,
    string Module,
    bool CanView,
    bool CanCreate,
    bool CanEdit,
    bool CanDelete,
    DateTime CreatedAt
);

public record CreatePermissionDto(
    string UserId,
    string Module,
    bool CanView,
    bool CanCreate,
    bool CanEdit,
    bool CanDelete
);

public record AuditLogDto(
    string Id,
    string? UserId,
    string Action,
    string? EntityType,
    string? EntityId,
    string? Details,
    string? IpAddress,
    DateTime CreatedAt
);

public record BranchDto(
    string Id,
    string Name,
    string? Address,
    string? Phone,
    string? Email,
    string? Manager,
    bool Active,
    DateTime CreatedAt
);

public record CreateBranchDto(
    string Name,
    string? Address,
    string? Phone,
    string? Email,
    string? Manager,
    bool Active
);

public record TenantSettingsDto(
    string Id,
    string TenantId,
    string Key,
    string? Value,
    DateTime CreatedAt
);

public record UpdateTenantSettingsDto(
    string TenantId,
    string Key,
    string? Value
);

public record NotificationDto(
    string Id,
    string UserId,
    string Title,
    string Message,
    bool Read,
    DateTime CreatedAt
);

public record DuplicatePairDto(
    string Entity,
    string Field,
    string IdA,
    string IdB,
    string ValA,
    string ValB,
    double Similarity
);
