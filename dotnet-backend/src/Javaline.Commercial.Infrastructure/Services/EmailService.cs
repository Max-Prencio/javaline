using System.Net;
using System.Net.Mail;
using Javaline.Commercial.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Javaline.Commercial.Infrastructure.Services;

public sealed class EmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    private string? SmtpHost     => _config["Email:SmtpHost"];
    private int     SmtpPort     => int.TryParse(_config["Email:SmtpPort"], out var p) ? p : 587;
    private string? SmtpUser     => _config["Email:SmtpUser"];
    private string? SmtpPassword => _config["Email:SmtpPassword"];
    private string  FromAddress  => _config["Email:From"] ?? "noreply@javaline.com";
    private string  FromName     => _config["Email:FromName"] ?? "Javaline";
    private bool    IsConfigured => !string.IsNullOrWhiteSpace(SmtpHost) && !string.IsNullOrWhiteSpace(SmtpUser);

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default)
    {
        if (!IsConfigured)
        {
            _logger.LogInformation("[EMAIL STUB] To={To} Subject={Subject}", to, subject);
            return;
        }

        using var client = new SmtpClient(SmtpHost, SmtpPort)
        {
            EnableSsl = true,
            Credentials = new NetworkCredential(SmtpUser, SmtpPassword),
            Timeout = 10_000,
        };

        using var message = new MailMessage
        {
            From       = new MailAddress(FromAddress, FromName),
            Subject    = subject,
            Body       = htmlBody,
            IsBodyHtml = true,
        };
        message.To.Add(to);

        await client.SendMailAsync(message, ct);
        _logger.LogInformation("Email sent to {To}: {Subject}", to, subject);
    }

    public Task SendInvitationAsync(string to, string inviteUrl, CancellationToken ct = default)
        => SendAsync(to, "Te han invitado a Javaline", $"""
            <h2>Bienvenido a Javaline</h2>
            <p>Has sido invitado a unirte a la plataforma Javaline.</p>
            <p><a href="{inviteUrl}" style="padding:10px 20px;background:#f59e0b;color:#fff;text-decoration:none;border-radius:6px;">
                Aceptar invitación
            </a></p>
            <p style="color:#6b7280;font-size:12px;">Si no esperabas esta invitación, ignora este correo.</p>
            """, ct);

    public Task SendInvoiceNotificationAsync(string to, string invoiceId, decimal total, CancellationToken ct = default)
        => SendAsync(to, $"Nueva factura creada — {invoiceId}", $"""
            <h2>Factura creada</h2>
            <p>Se ha creado la factura <strong>{invoiceId}</strong> por un monto de <strong>${total:N2}</strong>.</p>
            <p>Ingresa a Javaline para verla en detalle.</p>
            """, ct);
}
