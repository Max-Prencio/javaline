using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace Javaline.Commercial.Api.Middleware;

public class CookieAuthMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IConfiguration _config;

    public CookieAuthMiddleware(RequestDelegate next, IConfiguration config)
    {
        _next = next;
        _config = config;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!context.Request.Headers.ContainsKey("Authorization"))
        {
            if (context.Request.Cookies.TryGetValue("javaline_token", out var cookieToken) && !string.IsNullOrEmpty(cookieToken))
            {
                context.Request.Headers.Append("Authorization", $"Bearer {cookieToken}");
            }
        }

        await _next(context);
    }
}
