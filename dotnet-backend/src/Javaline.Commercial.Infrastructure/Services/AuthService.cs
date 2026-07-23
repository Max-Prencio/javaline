using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Javaline.Commercial.Application.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Javaline.Commercial.Domain.Entities;
using Javaline.Commercial.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.IdentityModel.Tokens;

namespace Javaline.Commercial.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly JavalineDbContext _db;
    private readonly IConfiguration _config;
    private readonly IBackgroundTaskQueue _queue;

    public AuthService(JavalineDbContext db, IConfiguration config, IBackgroundTaskQueue queue)
    {
        _db = db;
        _config = config;
        _queue = queue;
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email, ct)
            ?? throw new ApplicationException("Invalid email or password.");

        if (!VerifyPassword(request.Password, user.PasswordHash))
            throw new ApplicationException("Invalid email or password.");

        if (user.Status != "active")
            throw new ApplicationException("Account is not active.");

        var token = GenerateJwtToken(user);
        var refreshToken = await CreateRefreshTokenAsync(user.Id);
        var dto = MapToDto(user);

        return new AuthResponse { Token = token, RefreshToken = refreshToken.Token, User = dto };
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct)
    {
        var exists = await _db.Users.AnyAsync(u => u.Email == request.Email, ct);
        if (exists)
            throw new ApplicationException("A user with this email already exists.");

        var user = new User
        {
            Name = request.Name,
            Email = request.Email,
            PasswordHash = HashPassword(request.Password),
            Role = "user",
            Status = "active",
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        var token = GenerateJwtToken(user);
        var refreshToken = await CreateRefreshTokenAsync(user.Id);
        var dto = MapToDto(user);

        return new AuthResponse { Token = token, RefreshToken = refreshToken.Token, User = dto };
    }

    public async Task<UserDto?> GetCurrentUserAsync(string userId, CancellationToken ct)
    {
        var user = await _db.Users.FindAsync(new object[] { userId }, ct);
        return user == null ? null : MapToDto(user);
    }

    public async Task<AuthResponse> RefreshTokenAsync(string refreshTokenValue, CancellationToken ct)
    {
        var refreshToken = await _db.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == refreshTokenValue, ct);

        if (refreshToken == null)
            throw new SecurityTokenException("Invalid refresh token.");

        if (!refreshToken.IsActive)
            throw new SecurityTokenException("Refresh token is expired or revoked.");

        var user = await _db.Users.FindAsync(new object[] { refreshToken.UserId }, ct);
        if (user == null || user.Status != "active")
            throw new SecurityTokenException("User not found or inactive.");

        var newRefreshToken = await RotateRefreshTokenAsync(refreshToken);

        var newJwt = GenerateJwtToken(user);
        var dto = MapToDto(user);

        return new AuthResponse { Token = newJwt, RefreshToken = newRefreshToken.Token, User = dto };
    }

    public static string HashPassword(string password) => BCrypt.Net.BCrypt.HashPassword(password);

    public static bool VerifyPassword(string password, string storedHash) => BCrypt.Net.BCrypt.Verify(password, storedHash);

    public async Task LogoutAsync(HttpResponse response, string? refreshTokenValue)
    {
        response.Cookies.Delete("javaline_token");

        if (!string.IsNullOrEmpty(refreshTokenValue))
        {
            var token = await _db.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.Token == refreshTokenValue);
            if (token != null && token.IsActive)
            {
                token.RevokedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }
        }

        await Task.CompletedTask;
    }

    public async Task ChangePasswordAsync(string userId, ChangePasswordRequest request, string? callerRole)
    {
        if (request.Id != userId && callerRole != "admin")
            throw new ApplicationException("No puedes cambiar la contraseña de otro usuario");

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == request.Id && u.Status == "active");
        if (user == null || !VerifyPassword(request.CurrentPassword, user.PasswordHash))
            throw new ApplicationException("Contraseña actual incorrecta");

        if (request.NewPassword.Length < 8)
            throw new ApplicationException("La nueva contraseña debe tener al menos 8 caracteres");

        user.PasswordHash = HashPassword(request.NewPassword);
        await _db.SaveChangesAsync();

        await RevokeAllUserRefreshTokensAsync(user.Id);
    }

    public async Task ChangePasswordAdminAsync(string targetUserId, ChangePasswordAdminRequest request)
    {
        if (request.NewPassword.Length < 8)
            throw new ApplicationException("La nueva contraseña debe tener al menos 8 caracteres");

        var user = await _db.Users.FindAsync(targetUserId);
        if (user == null)
            throw new KeyNotFoundException("Usuario no encontrado");

        user.PasswordHash = HashPassword(request.NewPassword);
        await _db.SaveChangesAsync();

        await RevokeAllUserRefreshTokensAsync(user.Id);
    }

    public async Task<InviteResponse> InviteAsync(InviteRequest request)
    {
        var existing = await _db.Users.AnyAsync(u => u.Email == request.Email);
        if (existing)
            throw new ApplicationException("El correo ya está registrado");

        var tempToken = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(
            Guid.NewGuid().ToString("N") + DateTime.UtcNow.Ticks));

        var user = new User
        {
            Name = request.Email.Split("@")[0],
            Email = request.Email,
            PasswordHash = HashPassword(Guid.NewGuid().ToString("N")),
            Role = "employee",
            Status = "invited",
            InvitationToken = tempToken,
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        // Enqueue email — response returns immediately, email sends in background
        var email = request.Email;
        var baseUrl = _config["AppSettings:BaseUrl"] ?? "http://localhost:5173";
        var inviteUrl = $"{baseUrl}/accept-invitation?token={Uri.EscapeDataString(tempToken)}";
        await _queue.QueueAsync(async (sp, ct) =>
        {
            var emailService = sp.GetRequiredService<IEmailService>();
            await emailService.SendInvitationAsync(email, inviteUrl, ct);
        });

        return new InviteResponse
        {
            Message = $"Invitación enviada a {request.Email}",
            UserId = user.Id,
            Token = tempToken
        };
    }

    public async Task<List<InvitedUserDto>> GetInvitationsAsync()
    {
        var users = await _db.Users
            .Where(u => u.Status == "invited")
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();

        return users.Select(u => new InvitedUserDto
        {
            Id = u.Id,
            Name = u.Name,
            Email = u.Email,
            Role = u.Role,
            Status = u.Status,
            InvitationToken = u.InvitationToken,
            CreatedAt = u.CreatedAt
        }).ToList();
    }

    public async Task<AuthResponse> AcceptInvitationAsync(AcceptInvitationRequest request)
    {
        if (string.IsNullOrEmpty(request.Token) || string.IsNullOrEmpty(request.Password))
            throw new ApplicationException("Token y contraseña requeridos");
        if (request.Password.Length < 8)
            throw new ApplicationException("La contraseña debe tener al menos 8 caracteres");

        var user = await _db.Users.FirstOrDefaultAsync(u =>
            u.InvitationToken == request.Token && u.Status == "invited");

        if (user == null)
            throw new KeyNotFoundException("Invitación no encontrada o ya usada");

        user.Name = string.IsNullOrEmpty(request.Name) ? user.Name : request.Name;
        user.PasswordHash = HashPassword(request.Password);
        user.Status = "active";
        user.InvitationToken = null;
        await _db.SaveChangesAsync();

        var token = GenerateJwtToken(user);
        var refreshToken = await CreateRefreshTokenAsync(user.Id);
        var dto = MapToDto(user);

        return new AuthResponse { Token = token, RefreshToken = refreshToken.Token, User = dto };
    }

    public async Task<InviteResponse> ResendInvitationAsync(string userId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId && u.Status == "invited");
        if (user == null)
            throw new KeyNotFoundException("Invitación no encontrada");

        return new InviteResponse
        {
            Message = $"Invitación reenviada a {user.Email}",
            UserId = user.Id,
            Token = user.InvitationToken ?? ""
        };
    }

    private string GenerateJwtToken(User user)
    {
        var secret = _config["AppSettings:JwtSecret"]
            ?? throw new InvalidOperationException("AppSettings:JwtSecret is not configured.");
        var issuer = _config["AppSettings:JwtIssuer"] ?? "javaline.commercial";
        var audience = _config["AppSettings:JwtAudience"] ?? "javaline.commercial";
        var expirationMinutes = int.TryParse(_config["AppSettings:JwtExpirationMinutes"], out var m) ? m : 60;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task<RefreshToken> CreateRefreshTokenAsync(string userId)
    {
        var refreshTokenExpirationDays = int.TryParse(_config["AppSettings:RefreshTokenExpirationDays"], out var d) ? d : 7;

        var refreshToken = new RefreshToken
        {
            UserId = userId,
            Token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
            ExpiresAt = DateTime.UtcNow.AddDays(refreshTokenExpirationDays),
            CreatedAt = DateTime.UtcNow
        };

        _db.RefreshTokens.Add(refreshToken);
        await _db.SaveChangesAsync();

        return refreshToken;
    }

    private async Task<RefreshToken> RotateRefreshTokenAsync(RefreshToken currentRefreshToken)
    {
        var newRefreshToken = await CreateRefreshTokenAsync(currentRefreshToken.UserId);

        currentRefreshToken.RevokedAt = DateTime.UtcNow;
        currentRefreshToken.ReplacedByToken = newRefreshToken.Token;
        await _db.SaveChangesAsync();

        return newRefreshToken;
    }

    private async Task RevokeAllUserRefreshTokensAsync(string userId)
    {
        var activeTokens = await _db.RefreshTokens
            .Where(rt => rt.UserId == userId && rt.RevokedAt == null)
            .ToListAsync();

        foreach (var token in activeTokens)
        {
            token.RevokedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
    }

    private static UserDto MapToDto(User user) => new()
    {
        Id = user.Id,
        Name = user.Name,
        Email = user.Email,
        Role = user.Role,
        Phone = user.Phone,
        Position = user.Position,
        Photo = user.Photo,
        Status = user.Status,
        TwoFactorEnabled = user.TwoFactorEnabled
    };
}
