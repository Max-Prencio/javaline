namespace Javaline.Commercial.Application.Interfaces;

public interface IEmailService
{
    Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default);
    Task SendInvitationAsync(string to, string inviteUrl, CancellationToken ct = default);
    Task SendInvoiceNotificationAsync(string to, string invoiceId, decimal total, CancellationToken ct = default);
}
