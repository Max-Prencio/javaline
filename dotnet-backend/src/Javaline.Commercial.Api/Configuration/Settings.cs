namespace Javaline.Commercial.Api.Configuration;

/// <summary>
/// JWT authentication settings loaded from configuration.
/// Values must come from environment variables or a vault — never hardcoded.
/// </summary>
public sealed class JwtSettings
{
    public const string SectionName = "AppSettings";

    /// <summary>Signing key for JWT tokens. Minimum 32 characters.</summary>
    public string Secret { get; set; } = string.Empty;

    /// <summary>JWT issuer claim value.</summary>
    public string Issuer { get; set; } = "javaline.commercial";

    /// <summary>JWT audience claim value.</summary>
    public string Audience { get; set; } = "javaline.commercial";

    /// <summary>Token lifetime in minutes.</summary>
    public int ExpirationMinutes { get; set; } = 60;

    /// <summary>Refresh token lifetime in days.</summary>
    public int RefreshExpirationDays { get; set; } = 7;
}

/// <summary>
/// CORS configuration loaded from configuration.
/// </summary>
public sealed class CorsSettings
{
    public const string SectionName = "AppSettings";

    /// <summary>Comma-separated list of allowed origins.</summary>
    public string AllowedOrigins { get; set; } = "http://localhost:5173";
}

/// <summary>
/// Application-level settings.
/// </summary>
public sealed class AppSettings
{
    public const string SectionName = "AppSettings";

    /// <summary>Application name for logging and telemetry.</summary>
    public string ApplicationName { get; set; } = "javaline-commercial";

    /// <summary>Max page size for paginated endpoints.</summary>
    public int MaxPageSize { get; set; } = 100;

    /// <summary>Default page size.</summary>
    public int DefaultPageSize { get; set; } = 20;
}

/// <summary>
/// Rate limiting configuration.
/// </summary>
public sealed class RateLimitSettings
{
    public const string SectionName = "RateLimit";

    /// <summary>Max general requests per window.</summary>
    public int GeneralLimit { get; set; } = 60;

    /// <summary>General window duration in seconds.</summary>
    public int WindowSeconds { get; set; } = 60;

    /// <summary>Max auth attempts per window.</summary>
    public int AuthLimit { get; set; } = 10;

    /// <summary>Auth window duration in seconds.</summary>
    public int AuthWindowSeconds { get; set; } = 900;
}

/// <summary>
/// Password policy configuration.
/// </summary>
public sealed class PasswordSettings
{
    public const string SectionName = "PasswordPolicy";

    public int MinLength { get; set; } = 8;
    public int MaxLength { get; set; } = 128;
    public bool RequireUppercase { get; set; } = true;
    public bool RequireLowercase { get; set; } = true;
    public bool RequireDigit { get; set; } = true;
    public bool RequireSpecialChar { get; set; } = true;
}
