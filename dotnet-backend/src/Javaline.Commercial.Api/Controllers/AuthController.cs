using System.Security.Claims;
using Javaline.Commercial.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Javaline.Commercial.Api.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService) => _authService = authService;

    private string? GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? User.FindFirst("sub")?.Value;
    private string? GetUserRole() => User.FindFirst(ClaimTypes.Role)?.Value;

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var result = await _authService.LoginAsync(request, ct);
        SetAuthCookie(result.Token);
        SetRefreshTokenCookie(result.RefreshToken);
        return Ok(new { user = result.User, access_token = (string?)null });
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken ct)
    {
        var result = await _authService.RegisterAsync(request, ct);
        SetAuthCookie(result.Token);
        SetRefreshTokenCookie(result.RefreshToken);
        return Ok(new { user = result.User, access_token = (string?)null });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(CancellationToken ct)
    {
        var refreshToken = Request.Cookies["javaline_refresh_token"];
        if (string.IsNullOrEmpty(refreshToken))
            return Unauthorized(new { detail = "Refresh token not found." });

        var result = await _authService.RefreshTokenAsync(refreshToken, ct);
        SetAuthCookie(result.Token);
        SetRefreshTokenCookie(result.RefreshToken);
        return Ok(new { user = result.User, access_token = (string?)null });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        var refreshToken = Request.Cookies["javaline_refresh_token"];
        await _authService.LogoutAsync(Response, refreshToken);
        Response.Cookies.Delete("javaline_refresh_token");
        return Ok(new { message = "Sesión cerrada" });
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken ct)
    {
        await _authService.ChangePasswordAsync(GetUserId()!, request, GetUserRole());
        return Ok(new { message = "Contraseña actualizada" });
    }

    [HttpPost("change-password-admin")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> ChangePasswordAdmin([FromBody] ChangePasswordAdminRequest request, CancellationToken ct)
    {
        await _authService.ChangePasswordAdminAsync(request.Id, request);
        return Ok(new { message = "Contraseña actualizada por administrador" });
    }

    [HttpPost("invite")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Invite([FromBody] InviteRequest request, CancellationToken ct)
    {
        var result = await _authService.InviteAsync(request);
        return Ok(result);
    }

    [HttpGet("invitations")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> GetInvitations(CancellationToken ct)
    {
        var result = await _authService.GetInvitationsAsync();
        return Ok(result);
    }

    [HttpPost("accept-invitation")]
    public async Task<IActionResult> AcceptInvitation([FromBody] AcceptInvitationRequest request, CancellationToken ct)
    {
        var result = await _authService.AcceptInvitationAsync(request);
        SetAuthCookie(result.Token);
        SetRefreshTokenCookie(result.RefreshToken);
        return Ok(new { user = result.User, access_token = (string?)null });
    }

    [HttpPost("invitations/{id}/resend")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> ResendInvitation(string id, CancellationToken ct)
    {
        var result = await _authService.ResendInvitationAsync(id);
        return Ok(result);
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request, CancellationToken ct)
    {
        await _authService.ResetPasswordAsync(request, ct);
        return Ok(new { message = "Contraseña restablecida exitosamente." });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser(CancellationToken ct)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { detail = "User not authenticated." });

        var user = await _authService.GetCurrentUserAsync(userId, ct);
        if (user == null)
            return NotFound(new { detail = "User not found." });

        return Ok(user);
    }

    private void SetAuthCookie(string token)
    {
        var isProduction = Environment.GetEnvironmentVariable("RAILWAY_ENVIRONMENT") != null
            || Environment.GetEnvironmentVariable("RENDER") != null
            || Environment.GetEnvironmentVariable("PRODUCTION") != null;

        Response.Cookies.Append("javaline_token", token, new CookieOptions
        {
            HttpOnly = true,
            Secure = isProduction,
            SameSite = SameSiteMode.Strict,
            Path = "/",
            MaxAge = TimeSpan.FromHours(1)
        });
    }

    private void SetRefreshTokenCookie(string refreshToken)
    {
        var isProduction = Environment.GetEnvironmentVariable("RAILWAY_ENVIRONMENT") != null
            || Environment.GetEnvironmentVariable("RENDER") != null
            || Environment.GetEnvironmentVariable("PRODUCTION") != null;

        Response.Cookies.Append("javaline_refresh_token", refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = isProduction,
            SameSite = SameSiteMode.Strict,
            Path = "/",
            MaxAge = TimeSpan.FromDays(7)
        });
    }
}
