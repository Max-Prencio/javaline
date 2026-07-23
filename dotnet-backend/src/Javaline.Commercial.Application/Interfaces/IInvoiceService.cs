using Javaline.Commercial.Application.DTOs;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Application.Interfaces;

public interface IInvoiceService
{
    Task<PagedResult<InvoiceDto>> GetAllAsync(int page, int pageSize, string? status, string? type, string? search);
    Task<InvoiceDto?> GetByIdAsync(string id);
    Task<InvoiceDto> CreateAsync(CreateInvoiceDto dto, string userId);
    Task<InvoiceDto?> UpdateAsync(string id, CreateInvoiceDto dto);
    Task<bool> DeleteAsync(string id);
    Task<InvoiceDto?> UpdateStatusAsync(string id, UpdateInvoiceStatusDto dto);
    Task<List<AccountsReceivableDto>> GetAccountsReceivableAsync(string? status);
    Task<DashboardStatsDto> GetDashboardStatsAsync();
}
