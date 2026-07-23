using System.Linq;
using System.Threading.Tasks;
using Javaline.Commercial.Application.DTOs;
using Javaline.Commercial.Application.Interfaces;
using Javaline.Commercial.Domain.Common;
using Javaline.Commercial.Domain.Entities;
using Javaline.Commercial.Domain.Interfaces;
using Javaline.Commercial.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Javaline.Commercial.Infrastructure.Services;

public class InvoiceService : IInvoiceService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly JavalineDbContext _db;

    public InvoiceService(IUnitOfWork unitOfWork, JavalineDbContext db)
    {
        _unitOfWork = unitOfWork;
        _db = db;
    }

    private static string NormalizeStatus(string status) =>
        char.ToUpper(status[0]) + status[1..].ToLower();

    public async Task<PagedResult<InvoiceDto>> GetAllAsync(int page, int pageSize, string? status, string? type, string? search)
    {
        IQueryable<Invoice> query = _db.Invoices;

        if (!string.IsNullOrWhiteSpace(status))
        {
            var normalized = NormalizeStatus(status);
            query = query.Where(i => i.Status == normalized);
        }

        if (!string.IsNullOrWhiteSpace(type))
            query = query.Where(i => i.Type == type);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(i =>
                (i.ClientName != null && i.ClientName.ToLower().Contains(term)) ||
                (i.Rnc != null && i.Rnc.ToLower().Contains(term)) ||
                i.Id.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(i => i.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync();

        return new PagedResult<InvoiceDto>(
            items.Select(MapToDto).ToList(),
            totalCount,
            page,
            pageSize
        );
    }

    public async Task<InvoiceDto?> GetByIdAsync(string id)
    {
        var invoice = await _db.Invoices.FindAsync(new object[] { id });
        return invoice == null ? null : MapToDto(invoice);
    }

    public async Task<InvoiceDto> CreateAsync(CreateInvoiceDto dto, string userId)
    {
        var invoice = new Invoice
        {
            Id = Guid.NewGuid().ToString(),
            Type = dto.Type,
            ClientName = dto.ClientName,
            ClientId = dto.ClientId,
            Rnc = dto.Rnc,
            Date = DateTime.UtcNow,
            DueDate = dto.DueDate,
            Currency = dto.Currency,
            PaymentType = dto.PaymentType,
            PaymentMethod = dto.PaymentMethod,
            Items = InvoiceItemsHelper.ToJsonString(dto.Items),
            Subtotal = dto.Subtotal,
            Discount = dto.Discount,
            DiscountType = dto.DiscountType,
            DiscountAmount = dto.DiscountAmount,
            TaxableBase = dto.TaxableBase,
            TaxRateId = dto.TaxRateId,
            Tax = dto.Tax,
            Total = dto.Total,
            Status = NormalizeStatus(dto.Status),
            Notes = dto.Notes,
            InstallmentPlan = dto.InstallmentPlan,
            CashRegisterId = dto.CashRegisterId,
            AmountReceived = dto.AmountReceived,
            ChangeReturned = dto.ChangeReturned,
            CreatedBy = userId
        };

        await _db.Invoices.AddAsync(invoice);
        await _unitOfWork.SaveChangesAsync();

        return MapToDto(invoice);
    }

    public async Task<InvoiceDto?> UpdateAsync(string id, CreateInvoiceDto dto)
    {
        var invoice = await _db.Invoices.FindAsync(new object[] { id });
        if (invoice == null) return null;

        invoice.Type = dto.Type;
        invoice.ClientName = dto.ClientName;
        invoice.ClientId = dto.ClientId;
        invoice.Rnc = dto.Rnc;
        invoice.DueDate = dto.DueDate;
        invoice.Currency = dto.Currency;
        invoice.PaymentType = dto.PaymentType;
        invoice.PaymentMethod = dto.PaymentMethod;
        invoice.Items = InvoiceItemsHelper.ToJsonString(dto.Items);
        invoice.Subtotal = dto.Subtotal;
        invoice.Discount = dto.Discount;
        invoice.DiscountType = dto.DiscountType;
        invoice.DiscountAmount = dto.DiscountAmount;
        invoice.TaxableBase = dto.TaxableBase;
        invoice.TaxRateId = dto.TaxRateId;
        invoice.Tax = dto.Tax;
        invoice.Total = dto.Total;
        invoice.Status = NormalizeStatus(dto.Status);
        invoice.Notes = dto.Notes;
        invoice.InstallmentPlan = dto.InstallmentPlan;
        invoice.CashRegisterId = dto.CashRegisterId;
        invoice.AmountReceived = dto.AmountReceived;
        invoice.ChangeReturned = dto.ChangeReturned;

        _db.Invoices.Update(invoice);
        await _unitOfWork.SaveChangesAsync();

        return MapToDto(invoice);
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var invoice = await _db.Invoices.FindAsync(new object[] { id });
        if (invoice == null) return false;

        _db.Invoices.Remove(invoice);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<InvoiceDto?> UpdateStatusAsync(string id, UpdateInvoiceStatusDto dto)
    {
        var invoice = await _db.Invoices.FindAsync(new object[] { id });
        if (invoice == null) return null;

        var normalized = NormalizeStatus(dto.Status);
        invoice.Status = normalized;

        if (normalized == "Paid")
            invoice.PaidAt = DateTime.UtcNow;

        _db.Invoices.Update(invoice);
        await _unitOfWork.SaveChangesAsync();

        return MapToDto(invoice);
    }

    public async Task<List<AccountsReceivableDto>> GetAccountsReceivableAsync(string? status)
    {
        var now = DateTime.UtcNow;
        IQueryable<Invoice> query = _db.Invoices
            .Where(i => i.Status == "Pending" || i.Status == "Partial");

        if (!string.IsNullOrWhiteSpace(status))
        {
            var normalized = NormalizeStatus(status);
            query = query.Where(i => i.Status == normalized);
        }

        var invoices = await query
            .OrderBy(i => i.DueDate)
            .AsNoTracking()
            .ToListAsync();

        return invoices.Select(i =>
        {
            var paidAmount = i.AmountReceived ?? 0m;
            var balance = i.Total - paidAmount;
            var daysOverdue = i.DueDate.HasValue && i.DueDate.Value < now
                ? (int)(now - i.DueDate.Value).TotalDays
                : 0;

            return new AccountsReceivableDto(
                i.Id,
                i.ClientName,
                i.ClientId,
                i.Rnc,
                i.Type,
                i.Total,
                paidAmount,
                balance,
                i.Date,
                i.DueDate,
                daysOverdue,
                i.Status,
                i.PaymentType,
                i.Notes,
                i.CreatedAt
            );
        }).ToList();
    }

    public async Task<DashboardStatsDto> GetDashboardStatsAsync()
    {
        var now = DateTime.UtcNow;

        var totalInvoices = await _db.Invoices.CountAsync();

        var totalRevenue = await _db.Invoices
            .Where(i => i.Status == "Paid")
            .SumAsync(i => i.Total);

        var pendingAmount = await _db.Invoices
            .Where(i => i.Status == "Pending")
            .SumAsync(i => i.Total);

        var overdueInvoices = await _db.Invoices
            .CountAsync(i => i.Status != "Paid" && i.DueDate.HasValue && i.DueDate.Value < now);

        var totalClients = await _db.Invoices
            .Where(i => i.ClientId != null)
            .Select(i => i.ClientId)
            .Distinct()
            .CountAsync();

        var totalProducts = await _db.InventoryItems.CountAsync();

        var lowStockCount = await _db.InventoryItems
            .CountAsync(i => i.Active && i.Stock <= i.MinStock);

        return new DashboardStatsDto(
            totalInvoices,
            totalRevenue,
            pendingAmount,
            totalRevenue,
            overdueInvoices,
            totalClients,
            totalProducts,
            lowStockCount
        );
    }

    private static InvoiceDto MapToDto(Invoice i) => new(
        i.Id,
        i.Type,
        i.ClientName,
        i.ClientId,
        i.Rnc,
        i.Date,
        i.DueDate,
        i.Currency,
        i.PaymentType,
        i.PaymentMethod,
        i.Items,
        i.Subtotal,
        i.Discount,
        i.DiscountType,
        i.DiscountAmount,
        i.TaxableBase,
        i.TaxRateId,
        i.Tax,
        i.Total,
        i.Status,
        i.Notes,
        i.InstallmentPlan,
        i.CashRegisterId,
        i.AmountReceived,
        i.ChangeReturned,
        i.RectifiesId,
        i.CreatedBy,
        i.PaidAt,
        i.CreatedAt
    );
}
