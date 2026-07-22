using System.Security.Claims;
using Javaline.Commercial.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Javaline.Commercial.Api.Controllers;

[ApiController]
[Route("users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly JavalineDbContext _db;

    public UsersController(JavalineDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = _db.Users.AsNoTracking();
        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new
            {
                u.Id,
                u.Name,
                u.Email,
                u.Role,
                u.Phone,
                u.Position,
                u.Photo,
                u.Status
            })
            .ToListAsync();

        return Ok(new { items, totalCount, page, pageSize });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var user = await _db.Users.AsNoTracking()
            .Where(u => u.Id == id)
            .Select(u => new
            {
                u.Id,
                u.Name,
                u.Email,
                u.Role,
                u.Phone,
                u.Position,
                u.Photo,
                u.Status,
                u.TwoFactorEnabled
            })
            .FirstOrDefaultAsync();

        if (user == null) return NotFound(new { detail = "User not found." });
        return Ok(user);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateUserDto dto)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound(new { detail = "User not found." });

        if (dto.Name != null) user.Name = dto.Name;
        if (dto.Phone != null) user.Phone = dto.Phone;
        if (dto.Position != null) user.Position = dto.Position;
        if (dto.Photo != null) user.Photo = dto.Photo;
        if (dto.Status != null) user.Status = dto.Status;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            user.Id,
            user.Name,
            user.Email,
            user.Role,
            user.Phone,
            user.Position,
            user.Photo,
            user.Status,
            user.TwoFactorEnabled
        });
    }

    [HttpPost("{id}/deactivate")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Deactivate(string id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound(new { detail = "User not found." });
        user.Status = "inactive";
        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    [HttpPost("{id}/activate")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Activate(string id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound(new { detail = "User not found." });
        user.Status = "active";
        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    [HttpPut("{id}/photo")]
    public async Task<IActionResult> UpdatePhoto(string id, [FromBody] UserPhotoUpdateDto data)
    {
        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

        if (currentUserRole != "admin" && currentUserId != id)
            return Forbid();

        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound(new { detail = "Usuario no encontrado" });

        user.Photo = data.Photo;
        await _db.SaveChangesAsync();

        return Ok(new
        {
            user.Id,
            user.Name,
            user.Email,
            user.Role,
            user.Phone,
            user.Position,
            user.Photo,
            user.Status,
            user.TwoFactorEnabled
        });
    }
}

public record UpdateUserDto(string? Name, string? Phone, string? Position, string? Photo, string? Status);
public record UserPhotoUpdateDto(string? Photo);
