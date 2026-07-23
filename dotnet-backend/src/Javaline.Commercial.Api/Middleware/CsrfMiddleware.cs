using System.Security.Cryptography;

namespace Javaline.Commercial.Api.Middleware;

/// <summary>
/// CSRF protection using the double-submit cookie pattern.
/// For cookie-based auth, this prevents cross-site request forgery
/// by requiring a custom header that browsers won't send cross-origin.
/// </summary>
public class CsrfMiddleware
{
    private readonly RequestDelegate _next;
    private const string CsrfTokenCookie = "XSRF-TOKEN";
    private const string CsrfTokenHeader = "X-XSRF-TOKEN";

    private static readonly HashSet<string> UnsafeMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        "POST", "PUT", "PATCH", "DELETE"
    };

    public CsrfMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Always set the CSRF cookie for GET requests
        if (HttpMethods.IsGet(context.Request.Method))
        {
            var token = GenerateToken();
            context.Response.Cookies.Append(CsrfTokenCookie, token, new CookieOptions
            {
                HttpOnly = false, // Must be readable by JavaScript
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Path = "/",
                MaxAge = TimeSpan.FromHours(1)
            });
        }

        // Validate CSRF on unsafe methods (skip for auth endpoints that use Bearer token)
        if (UnsafeMethods.Contains(context.Request.Method))
        {
            var hasAuthHeader = context.Request.Headers.ContainsKey("Authorization");

            // Only enforce CSRF for cookie-based auth (not Bearer token)
            if (!hasAuthHeader && context.Request.Cookies.ContainsKey("javaline_token"))
            {
                if (!context.Request.Headers.TryGetValue(CsrfTokenHeader, out var headerToken) ||
                    string.IsNullOrEmpty(headerToken))
                {
                    context.Response.StatusCode = 403;
                    context.Response.ContentType = "application/problem+json";
                    await context.Response.WriteAsync("{\"type\":\"https://httpstatuses.com/403\",\"title\":\"Forbidden\",\"status\":403,\"detail\":\"CSRF token missing. Include X-XSRF-TOKEN header.\"}");
                    return;
                }

                // Validate the header token matches the cookie token
                if (!context.Request.Cookies.TryGetValue(CsrfTokenCookie, out var cookieToken) ||
                    string.IsNullOrEmpty(cookieToken) ||
                    !CryptographicOperations.FixedTimeEquals(
                        System.Text.Encoding.UTF8.GetBytes(headerToken!),
                        System.Text.Encoding.UTF8.GetBytes(cookieToken)))
                {
                    context.Response.StatusCode = 403;
                    context.Response.ContentType = "application/problem+json";
                    await context.Response.WriteAsync("{\"type\":\"https://httpstatuses.com/403\",\"title\":\"Forbidden\",\"status\":403,\"detail\":\"CSRF token mismatch.\"}");
                    return;
                }
            }
        }

        await _next(context);
    }

    private static string GenerateToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes);
    }
}
