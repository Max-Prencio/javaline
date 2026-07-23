using Microsoft.AspNetCore.Http;

namespace Javaline.Commercial.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct);
    Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct);
    Task<UserDto?> GetCurrentUserAsync(string userId, CancellationToken ct);
    Task LogoutAsync(HttpResponse response, string? refreshToken);
    Task<AuthResponse> RefreshTokenAsync(string refreshToken, CancellationToken ct);
    Task ChangePasswordAsync(string userId, ChangePasswordRequest request, string? callerRole);
    Task ChangePasswordAdminAsync(string targetUserId, ChangePasswordAdminRequest request);
    Task<InviteResponse> InviteAsync(InviteRequest request);
    Task<List<InvitedUserDto>> GetInvitationsAsync();
    Task<AuthResponse> AcceptInvitationAsync(AcceptInvitationRequest request);
    Task<InviteResponse> ResendInvitationAsync(string userId);
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class RegisterRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public UserDto User { get; set; } = null!;
}

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Position { get; set; }
    public string? Photo { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool TwoFactorEnabled { get; set; }
}

public class ChangePasswordRequest
{
    public string Id { get; set; } = string.Empty;
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class ChangePasswordAdminRequest
{
    public string Id { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class InviteRequest
{
    public string Email { get; set; } = string.Empty;
}

public class InviteResponse
{
    public string Message { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
}

public class InvitedUserDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? InvitationToken { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AcceptInvitationRequest
{
    public string Token { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
