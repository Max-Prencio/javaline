using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace Javaline.Commercial.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            var correlationId = context.Items["CorrelationId"]?.ToString() ?? "unknown";
            _logger.LogError(ex, "[{CorrelationId}] Unhandled exception: {MessageType}", correlationId, ex.Message);
            await HandleExceptionAsync(context, ex, correlationId);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception, string correlationId)
    {
        context.Response.ContentType = "application/problem+json";

        var statusCode = exception switch
        {
            ApplicationException => HttpStatusCode.BadRequest,
            KeyNotFoundException => HttpStatusCode.NotFound,
            UnauthorizedAccessException => HttpStatusCode.Unauthorized,
            ArgumentException => HttpStatusCode.BadRequest,
            InvalidOperationException => HttpStatusCode.Conflict,
            _ => HttpStatusCode.InternalServerError
        };

        var detail = exception switch
        {
            ApplicationException appEx => appEx.Message,
            KeyNotFoundException => "The requested resource was not found.",
            UnauthorizedAccessException => "Unauthorized access.",
            ArgumentException argEx => argEx.Message,
            InvalidOperationException opEx => opEx.Message,
            _ => "An unexpected error occurred. Please try again later."
        };

        context.Response.StatusCode = (int)statusCode;

        var problem = new ProblemDetails
        {
            Type = $"https://httpstatuses.com/{(int)statusCode}",
            Title = GetTitle(statusCode),
            Status = (int)statusCode,
            Detail = detail,
            Instance = context.Request.Path
        };

        problem.Extensions["correlationId"] = correlationId;

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        await context.Response.WriteAsync(JsonSerializer.Serialize(problem, options));
    }

    private static string GetTitle(HttpStatusCode statusCode) => statusCode switch
    {
        HttpStatusCode.BadRequest => "Bad Request",
        HttpStatusCode.Unauthorized => "Unauthorized",
        HttpStatusCode.Forbidden => "Forbidden",
        HttpStatusCode.NotFound => "Not Found",
        HttpStatusCode.Conflict => "Conflict",
        HttpStatusCode.InternalServerError => "Internal Server Error",
        HttpStatusCode.TooManyRequests => "Too Many Requests",
        _ => "Error"
    };
}
