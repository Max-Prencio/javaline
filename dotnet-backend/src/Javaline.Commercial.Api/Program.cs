using System.Text;
using Microsoft.AspNetCore.Mvc.Versioning;
using FluentValidation;
using FluentValidation.AspNetCore;
using Javaline.Commercial.Api.Configuration;
using Javaline.Commercial.Api.Filters;
using Javaline.Commercial.Api.Middleware;
using Javaline.Commercial.Application.Interfaces;
using Javaline.Commercial.Application.Validators;
using Javaline.Commercial.Domain.Interfaces;
using Javaline.Commercial.Infrastructure.Data;
using Javaline.Commercial.Infrastructure.Repositories;
using Javaline.Commercial.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// ─── Configuration ───
builder.Configuration.AddJsonFile("appsettings.json", optional: true, reloadOnChange: true);
builder.Configuration.AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true);
builder.Configuration.AddEnvironmentVariables();

// Fail fast if critical secrets are not configured.
var jwtSecret = builder.Configuration["AppSettings:JwtSecret"];
if (string.IsNullOrWhiteSpace(jwtSecret) || jwtSecret.Length < 32)
    throw new InvalidOperationException(
        "AppSettings:JwtSecret must be set via environment variable or vault (min 32 chars).");

var connStr = builder.Configuration.GetConnectionString("Default");
if (string.IsNullOrWhiteSpace(connStr))
    throw new InvalidOperationException(
        "ConnectionStrings:Default must be set via environment variable or vault.");

var rawCorsOrigins = builder.Configuration["AppSettings:CorsOrigins"];
if (string.IsNullOrWhiteSpace(rawCorsOrigins) && !builder.Environment.IsDevelopment())
    throw new InvalidOperationException(
        "AppSettings:CorsOrigins must be set in production (comma-separated list of allowed frontend origins).");

// ─── Options Pattern ───
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection(JwtSettings.SectionName));
builder.Services.Configure<CorsSettings>(builder.Configuration.GetSection(CorsSettings.SectionName));
builder.Services.Configure<AppSettings>(builder.Configuration.GetSection(AppSettings.SectionName));
builder.Services.Configure<RateLimitSettings>(builder.Configuration.GetSection(RateLimitSettings.SectionName));
builder.Services.Configure<PasswordSettings>(builder.Configuration.GetSection(PasswordSettings.SectionName));

// ─── Logging ───
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Application", "javaline-commercial")
    .WriteTo.Console()
    .CreateLogger();
builder.Host.UseSerilog();

// ─── RLS Interceptor ───
builder.Services.AddScoped<TenantConnectionInterceptor>();

// ─── Database ───
builder.Services.AddDbContext<JavalineDbContext>((sp, o) =>
{
    o.UseNpgsql(connStr, npgsql =>
    {
        npgsql.MigrationsAssembly("Javaline.Commercial.Infrastructure");
        npgsql.EnableRetryOnFailure(3, TimeSpan.FromSeconds(5), null);
    });
    o.AddInterceptors(sp.GetRequiredService<TenantConnectionInterceptor>());
    if (builder.Environment.IsDevelopment())
        o.EnableSensitiveDataLogging();
});

// ─── Authentication ───
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["AppSettings:JwtIssuer"] ?? "javaline.commercial",
            ValidAudience = builder.Configuration["AppSettings:JwtAudience"] ?? "javaline.commercial",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });
builder.Services.AddAuthorization();

// ─── CORS ───
// Dev fallback = Vite default ports. Prod MUST set AppSettings__CorsOrigins env var.
var allowedOrigins = string.IsNullOrWhiteSpace(rawCorsOrigins)
    ? new[] { "http://localhost:5173", "http://localhost:4173" }
    : rawCorsOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .WithMethods("GET", "POST", "PUT", "DELETE", "PATCH")
              .WithHeaders("Content-Type", "Authorization", "X-CSRF-Token")
              .AllowCredentials()
              .SetPreflightMaxAge(TimeSpan.FromMinutes(10));
    });
});

// ─── FluentValidation ───
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddFluentValidationClientsideAdapters();
builder.Services.AddValidatorsFromAssemblyContaining<LoginRequestValidator>();

// ─── API Versioning ───
builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
});

// ─── OpenTelemetry ───
builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource => resource
        .AddService("javaline-commercial", serviceVersion: "1.0.0"))
    .WithTracing(tracing => tracing
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation())
    .WithMetrics(metrics => metrics
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddPrometheusExporter());

// ─── Caching ───
builder.Services.AddMemoryCache(o => o.SizeLimit = 2048);
builder.Services.AddSingleton<ICacheService, MemoryCacheService>();

// ─── Background Queue ───
builder.Services.AddSingleton<IBackgroundTaskQueue, BackgroundTaskQueue>();
builder.Services.AddHostedService<QueuedHostedService>();
builder.Services.AddSingleton<IEmailService, EmailService>();

// ─── DI Registration ───
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<IInvoiceService, InvoiceService>();
builder.Services.AddScoped<IHRService, HRService>();
builder.Services.AddScoped<IPurchaseService, PurchaseService>();
builder.Services.AddScoped<ISurveyService, SurveyService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<IStockService, StockService>();

// ─── API ───
builder.Services.AddControllers(options =>
{
    options.Filters.Add<ValidationFilter>();
})
.ConfigureApiBehaviorOptions(options =>
{
    // Suppress automatic model validation — handled by ValidationFilter
    options.SuppressModelStateInvalidFilter = true;
})
.AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Javaline Commercial API",
        Version = "v1",
        Description = "Enterprise ERP/CRM SaaS API",
        Contact = new OpenApiContact { Name = "Javaline", Url = new Uri("https://javaline.com") },
        License = new OpenApiLicense { Name = "Proprietary" }
    });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});
builder.Services.AddHttpContextAccessor();

// ─── Health Checks ───
builder.Services.AddHealthChecks()
    .AddNpgSql(connStr, name: "postgresql", tags: new[] { "db", "ready" });

var app = builder.Build();

// ─── Middleware Pipeline ───
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<RequestLoggingMiddleware>();
app.UseMiddleware<RateLimitingMiddleware>();
app.UseMiddleware<AuditTrailMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Javaline Commercial API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseCors();
app.UseMiddleware<CsrfMiddleware>();
app.UseMiddleware<CookieAuthMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ─── Health Checks ───
app.MapHealthChecks("/health", new()
{
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var result = new
        {
            status = report.Status.ToString(),
            system = "javaline-commercial",
            runtime = ".NET 9",
            timestamp = DateTime.UtcNow,
            checks = report.Entries.Select(e => new
            {
                name = e.Key,
                status = e.Value.Status.ToString(),
                duration = e.Value.Duration.TotalMilliseconds,
                description = e.Value.Description
            })
        };
        await context.Response.WriteAsJsonAsync(result);
    }
});

app.MapHealthChecks("/health/ready", new()
{
    Predicate = check => check.Tags.Contains("ready")
});

app.MapHealthChecks("/health/live", new()
{
    Predicate = _ => false
});

// ─── Prometheus Metrics ───
app.MapPrometheusScrapingEndpoint("/metrics");

app.Run();

/// <summary>
/// Partial Program class for integration testing with WebApplicationFactory.
/// </summary>
public partial class Program { }
