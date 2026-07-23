using System.Linq;
using System.Threading.Tasks;
using Javaline.Commercial.Application.DTOs;
using Javaline.Commercial.Application.Interfaces;
using Javaline.Commercial.Domain.Common;
using Javaline.Commercial.Domain.Entities;
using Javaline.Commercial.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Javaline.Commercial.Infrastructure.Services;

public class AdminService : IAdminService
{
    private readonly JavalineDbContext _db;

    public AdminService(JavalineDbContext db)
    {
        _db = db;
    }

    // ─── Permissions ───

    public async Task<PagedResult<PermissionDto>> GetAllPermissionsAsync(int page, int pageSize, string? search, string? userId)
    {
        IQueryable<Permission> query = _db.Permissions;

        if (!string.IsNullOrWhiteSpace(userId))
            query = query.Where(p => p.UserId == userId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(p => p.Module.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync();

        return new PagedResult<PermissionDto>
        {
            Items = items.Select(MapPermissionToDto).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<PermissionDto?> GetPermissionByIdAsync(string id)
    {
        var entity = await _db.Permissions.FindAsync(new object[] { id });
        return entity == null ? null : MapPermissionToDto(entity);
    }

    public async Task<PermissionDto> CreatePermissionAsync(CreatePermissionDto dto)
    {
        var entity = new Permission
        {
            UserId = dto.UserId,
            Module = dto.Module,
            CanView = dto.CanView,
            CanCreate = dto.CanCreate,
            CanEdit = dto.CanEdit,
            CanDelete = dto.CanDelete
        };

        await _db.Permissions.AddAsync(entity);
        await _db.SaveChangesAsync();

        return MapPermissionToDto(entity);
    }

    public async Task<PermissionDto?> UpdatePermissionAsync(string id, CreatePermissionDto dto)
    {
        var entity = await _db.Permissions.FindAsync(new object[] { id });
        if (entity == null) return null;

        entity.UserId = dto.UserId;
        entity.Module = dto.Module;
        entity.CanView = dto.CanView;
        entity.CanCreate = dto.CanCreate;
        entity.CanEdit = dto.CanEdit;
        entity.CanDelete = dto.CanDelete;

        _db.Permissions.Update(entity);
        await _db.SaveChangesAsync();

        return MapPermissionToDto(entity);
    }

    public async Task<bool> DeletePermissionAsync(string id)
    {
        var entity = await _db.Permissions.FindAsync(new object[] { id });
        if (entity == null) return false;

        _db.Permissions.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }

    // ─── Audit Logs ───

    public async Task<PagedResult<AuditLogDto>> GetAllAuditLogsAsync(int page, int pageSize, string? search, string? userId)
    {
        IQueryable<AuditLog> query = _db.AuditLogs;

        if (!string.IsNullOrWhiteSpace(userId))
            query = query.Where(a => a.UserId == userId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(a => a.Action.ToLower().Contains(term) || (a.EntityType != null && a.EntityType.ToLower().Contains(term)));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync();

        return new PagedResult<AuditLogDto>
        {
            Items = items.Select(MapAuditLogToDto).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<AuditLogDto?> GetAuditLogByIdAsync(string id)
    {
        var entity = await _db.AuditLogs.FindAsync(new object[] { id });
        return entity == null ? null : MapAuditLogToDto(entity);
    }

    // ─── Branches ───

    public async Task<PagedResult<BranchDto>> GetAllBranchesAsync(int page, int pageSize, string? search)
    {
        IQueryable<Branch> query = _db.Branches;

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(b => b.Name.ToLower().Contains(term) || (b.Address != null && b.Address.ToLower().Contains(term)));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(b => b.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync();

        return new PagedResult<BranchDto>
        {
            Items = items.Select(MapBranchToDto).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<BranchDto?> GetBranchByIdAsync(string id)
    {
        var entity = await _db.Branches.FindAsync(new object[] { id });
        return entity == null ? null : MapBranchToDto(entity);
    }

    public async Task<BranchDto> CreateBranchAsync(CreateBranchDto dto)
    {
        var entity = new Branch
        {
            Name = dto.Name,
            Address = dto.Address,
            Phone = dto.Phone,
            Email = dto.Email,
            Manager = dto.Manager,
            Active = dto.Active
        };

        await _db.Branches.AddAsync(entity);
        await _db.SaveChangesAsync();

        return MapBranchToDto(entity);
    }

    public async Task<BranchDto?> UpdateBranchAsync(string id, CreateBranchDto dto)
    {
        var entity = await _db.Branches.FindAsync(new object[] { id });
        if (entity == null) return null;

        entity.Name = dto.Name;
        entity.Address = dto.Address;
        entity.Phone = dto.Phone;
        entity.Email = dto.Email;
        entity.Manager = dto.Manager;
        entity.Active = dto.Active;

        _db.Branches.Update(entity);
        await _db.SaveChangesAsync();

        return MapBranchToDto(entity);
    }

    public async Task<bool> DeleteBranchAsync(string id)
    {
        var entity = await _db.Branches.FindAsync(new object[] { id });
        if (entity == null) return false;

        _db.Branches.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }

    // ─── Tenant Settings ───

    public async Task<List<TenantSettingsDto>> GetTenantSettingsAsync(string tenantId)
    {
        return await _db.TenantSettings
            .Where(s => s.TenantId == tenantId)
            .OrderBy(s => s.Key)
            .AsNoTracking()
            .Select(s => new TenantSettingsDto(
                s.Id, s.TenantId, s.Key, s.Value, s.CreatedAt
            ))
            .ToListAsync();
    }

    public async Task<TenantSettingsDto?> GetTenantSettingByKeyAsync(string tenantId, string key)
    {
        var entity = await _db.TenantSettings
            .FirstOrDefaultAsync(s => s.TenantId == tenantId && s.Key == key);

        return entity == null ? null : new TenantSettingsDto(
            entity.Id, entity.TenantId, entity.Key, entity.Value, entity.CreatedAt
        );
    }

    public async Task<TenantSettingsDto> UpdateTenantSettingAsync(UpdateTenantSettingsDto dto)
    {
        var entity = await _db.TenantSettings
            .FirstOrDefaultAsync(s => s.TenantId == dto.TenantId && s.Key == dto.Key);

        if (entity == null)
        {
            entity = new TenantSettings
            {
                TenantId = dto.TenantId,
                Key = dto.Key,
                Value = dto.Value
            };
            await _db.TenantSettings.AddAsync(entity);
        }
        else
        {
            entity.Value = dto.Value;
            _db.TenantSettings.Update(entity);
        }

        await _db.SaveChangesAsync();

        return new TenantSettingsDto(
            entity.Id, entity.TenantId, entity.Key, entity.Value, entity.CreatedAt
        );
    }

    // ─── Notifications ───

    public async Task<PagedResult<NotificationDto>> GetAllNotificationsAsync(int page, int pageSize, string? userId)
    {
        IQueryable<Notification> query = _db.Notifications;

        if (!string.IsNullOrWhiteSpace(userId))
            query = query.Where(n => n.UserId == userId);

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync();

        return new PagedResult<NotificationDto>
        {
            Items = items.Select(MapNotificationToDto).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<NotificationDto?> GetNotificationByIdAsync(string id)
    {
        var entity = await _db.Notifications.FindAsync(new object[] { id });
        return entity == null ? null : MapNotificationToDto(entity);
    }

    public async Task<bool> MarkAsReadAsync(string id)
    {
        var entity = await _db.Notifications.FindAsync(new object[] { id });
        if (entity == null) return false;

        entity.Read = true;
        _db.Notifications.Update(entity);
        await _db.SaveChangesAsync();
        return true;
    }

    // ─── Duplicate Detection ───

    public async Task<List<DuplicatePairDto>> DetectDuplicatesAsync()
    {
        var duplicates = new List<DuplicatePairDto>();

        var contactNames = await _db.Contacts
            .Where(c => c.Active)
            .Select(c => new { c.Id, c.Name })
            .ToListAsync();
        duplicates.AddRange(FindSimilarPairs(contactNames, c => c.Name, "contacts", "name"));

        var inventoryNames = await _db.InventoryItems
            .Where(i => i.Active)
            .Select(i => new { i.Id, i.Name })
            .ToListAsync();
        duplicates.AddRange(FindSimilarPairs(inventoryNames, i => i.Name, "inventory", "name"));

        var userNames = await _db.Users
            .Select(u => new { u.Id, u.Name })
            .ToListAsync();
        duplicates.AddRange(FindSimilarPairs(userNames, u => u.Name, "users", "name"));

        return duplicates;
    }

    public async Task<bool> ResolveDuplicateAsync(string action, string entity, string primaryId, string duplicateId)
    {
        switch (entity)
        {
            case "contacts":
            {
                var primary = await _db.Contacts.FindAsync(primaryId);
                var duplicate = await _db.Contacts.FindAsync(duplicateId);
                if (primary == null || duplicate == null) return false;
                if (action == "merge")
                {
                    if (string.IsNullOrEmpty(primary.Name) && !string.IsNullOrEmpty(duplicate.Name)) primary.Name = duplicate.Name;
                    if (string.IsNullOrEmpty(primary.Email) && !string.IsNullOrEmpty(duplicate.Email)) primary.Email = duplicate.Email;
                    if (string.IsNullOrEmpty(primary.Phone) && !string.IsNullOrEmpty(duplicate.Phone)) primary.Phone = duplicate.Phone;
                }
                duplicate.Active = false;
                break;
            }
            case "inventory":
            {
                var primary = await _db.InventoryItems.FindAsync(primaryId);
                var duplicate = await _db.InventoryItems.FindAsync(duplicateId);
                if (primary == null || duplicate == null) return false;
                if (action == "merge")
                {
                    if (string.IsNullOrEmpty(primary.Name) && !string.IsNullOrEmpty(duplicate.Name)) primary.Name = duplicate.Name;
                    if (string.IsNullOrEmpty(primary.Sku) && !string.IsNullOrEmpty(duplicate.Sku)) primary.Sku = duplicate.Sku;
                }
                duplicate.Active = false;
                break;
            }
            case "users":
            {
                var primary = await _db.Users.FindAsync(primaryId);
                var duplicate = await _db.Users.FindAsync(duplicateId);
                if (primary == null || duplicate == null) return false;
                if (action == "merge")
                {
                    if (string.IsNullOrEmpty(primary.Name) && !string.IsNullOrEmpty(duplicate.Name)) primary.Name = duplicate.Name;
                }
                duplicate.Status = "inactive";
                break;
            }
            default:
                return false;
        }

        await _db.SaveChangesAsync();
        return true;
    }

    private static List<DuplicatePairDto> FindSimilarPairs<T>(List<T> items, Func<T, string?> selector, string entity, string field)
    {
        var results = new List<DuplicatePairDto>();
        var seen = new HashSet<string>();

        for (int i = 0; i < items.Count; i++)
        {
            for (int j = i + 1; j < items.Count; j++)
            {
                var a = selector(items[i]);
                var b = selector(items[j]);
                if (string.IsNullOrEmpty(a) || string.IsNullOrEmpty(b)) continue;

                var sim = CalculateSimilarity(a.ToLower(), b.ToLower());
                if (sim > 0.5)
                {
                    var idA = items[i]!.GetType().GetProperty("Id")!.GetValue(items[i])!.ToString()!;
                    var idB = items[j]!.GetType().GetProperty("Id")!.GetValue(items[j])!.ToString()!;
                    var key = string.Compare(idA, idB, StringComparison.Ordinal) < 0 ? $"{idA}:{idB}" : $"{idB}:{idA}";

                    if (seen.Add(key))
                    {
                        results.Add(new DuplicatePairDto(entity, field, idA, idB, a, b, Math.Round(sim, 3)));
                    }
                }
            }
        }
        return results;
    }

    private static double CalculateSimilarity(string a, string b)
    {
        if (a == b) return 1.0;
        var maxLen = Math.Max(a.Length, b.Length);
        if (maxLen == 0) return 1.0;

        var d = new int[a.Length + 1, b.Length + 1];
        for (int i = 0; i <= a.Length; i++) d[i, 0] = i;
        for (int j = 0; j <= b.Length; j++) d[0, j] = j;

        for (int i = 1; i <= a.Length; i++)
            for (int j = 1; j <= b.Length; j++)
            {
                int cost = a[i - 1] == b[j - 1] ? 0 : 1;
                d[i, j] = Math.Min(Math.Min(d[i - 1, j] + 1, d[i, j - 1] + 1), d[i - 1, j - 1] + cost);
            }

        return 1.0 - (double)d[a.Length, b.Length] / maxLen;
    }

    // ─── Mapping helpers ───

    private static PermissionDto MapPermissionToDto(Permission p) => new(
        p.Id, p.UserId, p.Module, p.CanView, p.CanCreate, p.CanEdit, p.CanDelete, p.CreatedAt
    );

    private static AuditLogDto MapAuditLogToDto(AuditLog a) => new(
        a.Id, a.UserId, a.Action, a.EntityType, a.EntityId, a.Details, a.IpAddress, a.CreatedAt
    );

    private static BranchDto MapBranchToDto(Branch b) => new(
        b.Id, b.Name, b.Address, b.Phone, b.Email, b.Manager, b.Active, b.CreatedAt
    );

    private static NotificationDto MapNotificationToDto(Notification n) => new(
        n.Id, n.UserId, n.Title, n.Message, n.Read, n.CreatedAt
    );
}
