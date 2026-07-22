using System.Collections.Concurrent;

namespace Javaline.Commercial.Api.Middleware;

public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;

    // Key: "{ip}:{path}" → sliding window
    private static readonly ConcurrentDictionary<string, SlidingWindow> _windows = new();

    // General: 60 req/min per IP
    private const int GeneralLimit = 60;
    private const int GeneralWindowSeconds = 60;

    // Login: 5 attempts per 15 min per IP (brute force protection)
    private const int LoginLimit = 5;
    private const int LoginWindowSeconds = 900;

    // Register: 3 accounts per hour per IP
    private const int RegisterLimit = 3;
    private const int RegisterWindowSeconds = 3600;

    // 2FA verify: 5 attempts per 10 min per IP
    private const int TwoFaLimit = 5;
    private const int TwoFaWindowSeconds = 600;

    public RateLimitingMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var path = (context.Request.Path.Value ?? "").ToLowerInvariant();
        var method = context.Request.Method;

        // General limit
        if (!Allow(ip, "general", GeneralLimit, GeneralWindowSeconds))
        {
            await Reject(context, "Demasiadas solicitudes. Intenta de nuevo en un minuto.");
            return;
        }

        // Per-route auth limits
        if (method == "POST")
        {
            if (path == "/auth/login")
            {
                if (!Allow(ip, "login", LoginLimit, LoginWindowSeconds))
                {
                    await Reject(context, "Demasiados intentos de inicio de sesión. Espera 15 minutos.");
                    return;
                }
            }
            else if (path == "/auth/register")
            {
                if (!Allow(ip, "register", RegisterLimit, RegisterWindowSeconds))
                {
                    await Reject(context, "Límite de registros alcanzado. Espera 1 hora.");
                    return;
                }
            }
            else if (path == "/auth/verify-2fa")
            {
                if (!Allow(ip, "2fa", TwoFaLimit, TwoFaWindowSeconds))
                {
                    await Reject(context, "Demasiados intentos de verificación. Espera 10 minutos.");
                    return;
                }
            }
        }

        await _next(context);
    }

    private static bool Allow(string ip, string scope, int limit, int windowSeconds)
    {
        var key = $"{ip}:{scope}";
        var window = _windows.GetOrAdd(key, _ => new SlidingWindow());
        lock (window)
        {
            window.CleanUp(windowSeconds);
            if (window.Count >= limit) return false;
            window.Add();
            return true;
        }
    }

    private static Task Reject(HttpContext context, string detail)
    {
        context.Response.StatusCode = 429;
        context.Response.ContentType = "application/problem+json";
        context.Response.Headers["Retry-After"] = "60";
        return context.Response.WriteAsync(
            $"{{\"type\":\"https://httpstatuses.com/429\",\"title\":\"Too Many Requests\",\"status\":429,\"detail\":\"{detail}\"}}");
    }

    private class SlidingWindow
    {
        private readonly List<DateTimeOffset> _timestamps = new();
        public int Count => _timestamps.Count;

        public void CleanUp(int windowSeconds)
        {
            var cutoff = DateTimeOffset.UtcNow.AddSeconds(-windowSeconds);
            _timestamps.RemoveAll(t => t < cutoff);
        }

        public void Add() => _timestamps.Add(DateTimeOffset.UtcNow);
    }
}
