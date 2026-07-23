using Javaline.Commercial.Domain.Entities;
using Javaline.Commercial.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Javaline.Commercial.Api.Controllers;

[ApiController]
[Route("accounting")]
[Authorize]
public class AccountingController : ControllerBase
{
    private readonly JavalineDbContext _db;

    public AccountingController(JavalineDbContext db) => _db = db;

    // ─── Discounts ───

    [HttpGet("discounts")]
    public async Task<IActionResult> GetDiscounts()
    {
        var items = await _db.DiscountConfigs
            .Where(d => d.Active)
            .OrderByDescending(d => d.CreatedAt)
            .AsNoTracking()
            .ToListAsync();

        return Ok(items.Select(d => new
        {
            id = d.Id,
            name = d.Name,
            type = d.Type,
            value = d.Value,
            active = d.Active,
            createdAt = d.CreatedAt.ToString("o"),
        }));
    }

    [HttpPost("discounts")]
    public async Task<IActionResult> CreateDiscount([FromBody] CreateDiscountRequest request)
    {
        var entity = new DiscountConfig
        {
            Name = request.Name,
            Type = request.Type ?? "percentage",
            Value = request.Value,
            Active = request.Active ?? true,
        };

        await _db.DiscountConfigs.AddAsync(entity);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            id = entity.Id,
            name = entity.Name,
            type = entity.Type,
            value = entity.Value,
            active = entity.Active,
            createdAt = entity.CreatedAt.ToString("o"),
        });
    }

    [HttpPut("discounts/{id}")]
    public async Task<IActionResult> UpdateDiscount(string id, [FromBody] CreateDiscountRequest request)
    {
        var entity = await _db.DiscountConfigs.FindAsync(new object[] { id });
        if (entity == null) return NotFound(new { detail = "Discount not found." });

        entity.Name = request.Name;
        entity.Type = request.Type ?? entity.Type;
        entity.Value = request.Value;
        entity.Active = request.Active ?? entity.Active;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            id = entity.Id,
            name = entity.Name,
            type = entity.Type,
            value = entity.Value,
            active = entity.Active,
            createdAt = entity.CreatedAt.ToString("o"),
        });
    }

    [HttpDelete("discounts/{id}")]
    public async Task<IActionResult> DeleteDiscount(string id)
    {
        var entity = await _db.DiscountConfigs.FindAsync(new object[] { id });
        if (entity == null) return NotFound(new { detail = "Discount not found." });

        _db.DiscountConfigs.Remove(entity);
        await _db.SaveChangesAsync();

        return Ok(new { success = true });
    }

    // ─── Taxes ───

    [HttpGet("taxes")]
    public async Task<IActionResult> GetTaxes()
    {
        var items = await _db.TaxConfigs
            .Where(t => t.Active)
            .OrderByDescending(t => t.CreatedAt)
            .AsNoTracking()
            .ToListAsync();

        return Ok(items.Select(t => new
        {
            id = t.Id,
            name = t.Name,
            rate = t.Rate,
            type = t.Type,
            active = t.Active,
            createdAt = t.CreatedAt.ToString("o"),
        }));
    }

    [HttpPost("taxes")]
    public async Task<IActionResult> CreateTax([FromBody] CreateTaxRequest request)
    {
        var entity = new TaxConfig
        {
            Name = request.Name,
            Rate = request.Rate,
            Type = request.Type ?? "ITBIS",
            Active = request.Active ?? true,
        };

        await _db.TaxConfigs.AddAsync(entity);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            id = entity.Id,
            name = entity.Name,
            rate = entity.Rate,
            type = entity.Type,
            active = entity.Active,
            createdAt = entity.CreatedAt.ToString("o"),
        });
    }

    [HttpPut("taxes/{id}")]
    public async Task<IActionResult> UpdateTax(string id, [FromBody] CreateTaxRequest request)
    {
        var entity = await _db.TaxConfigs.FindAsync(new object[] { id });
        if (entity == null) return NotFound(new { detail = "Tax not found." });

        entity.Name = request.Name;
        entity.Rate = request.Rate;
        entity.Type = request.Type ?? entity.Type;
        entity.Active = request.Active ?? entity.Active;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            id = entity.Id,
            name = entity.Name,
            rate = entity.Rate,
            type = entity.Type,
            active = entity.Active,
            createdAt = entity.CreatedAt.ToString("o"),
        });
    }

    [HttpDelete("taxes/{id}")]
    public async Task<IActionResult> DeleteTax(string id)
    {
        var entity = await _db.TaxConfigs.FindAsync(new object[] { id });
        if (entity == null) return NotFound(new { detail = "Tax not found." });

        _db.TaxConfigs.Remove(entity);
        await _db.SaveChangesAsync();

        return Ok(new { success = true });
    }

    // ─── Exemptions ───

    [HttpGet("exemptions")]
    public async Task<IActionResult> GetExemptions()
    {
        var items = await _db.ExemptionConfigs
            .Where(e => e.Active)
            .OrderByDescending(e => e.CreatedAt)
            .AsNoTracking()
            .ToListAsync();

        return Ok(items.Select(e => new
        {
            id = e.Id,
            name = e.Name,
            description = e.Description,
            appliesTo = e.AppliesTo,
            active = e.Active,
            createdAt = e.CreatedAt.ToString("o"),
        }));
    }

    [HttpPost("exemptions")]
    public async Task<IActionResult> CreateExemption([FromBody] CreateExemptionRequest request)
    {
        var entity = new ExemptionConfig
        {
            Name = request.Name,
            Description = request.Description,
            AppliesTo = request.AppliesTo,
            Active = request.Active ?? true,
        };

        await _db.ExemptionConfigs.AddAsync(entity);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            id = entity.Id,
            name = entity.Name,
            description = entity.Description,
            appliesTo = entity.AppliesTo,
            active = entity.Active,
            createdAt = entity.CreatedAt.ToString("o"),
        });
    }

    [HttpPut("exemptions/{id}")]
    public async Task<IActionResult> UpdateExemption(string id, [FromBody] CreateExemptionRequest request)
    {
        var entity = await _db.ExemptionConfigs.FindAsync(new object[] { id });
        if (entity == null) return NotFound(new { detail = "Exemption not found." });

        entity.Name = request.Name;
        entity.Description = request.Description;
        entity.AppliesTo = request.AppliesTo;
        entity.Active = request.Active ?? entity.Active;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            id = entity.Id,
            name = entity.Name,
            description = entity.Description,
            appliesTo = entity.AppliesTo,
            active = entity.Active,
            createdAt = entity.CreatedAt.ToString("o"),
        });
    }

    [HttpDelete("exemptions/{id}")]
    public async Task<IActionResult> DeleteExemption(string id)
    {
        var entity = await _db.ExemptionConfigs.FindAsync(new object[] { id });
        if (entity == null) return NotFound(new { detail = "Exemption not found." });

        _db.ExemptionConfigs.Remove(entity);
        await _db.SaveChangesAsync();

        return Ok(new { success = true });
    }

    // ────────────────────────────────────────────────────────────
    // CHART OF ACCOUNTS
    // ────────────────────────────────────────────────────────────
    [HttpGet("accounts")]
    public async Task<IActionResult> GetAccounts([FromQuery] string? search, [FromQuery] string? type)
    {
        var query = _db.ChartAccounts.AsNoTracking().AsQueryable();
        if (!string.IsNullOrEmpty(search)) query = query.Where(a => a.Code.Contains(search) || a.Name.Contains(search));
        if (!string.IsNullOrEmpty(type)) query = query.Where(a => a.Type == type);
        var items = await query.OrderBy(a => a.Code).ToListAsync();
        return Ok(items.Select(a => new { id = a.Id, code = a.Code, name = a.Name, type = a.Type, parentCode = a.ParentCode, level = a.Level, active = a.Active, description = a.Description }));
    }

    [HttpPost("accounts")]
    public async Task<IActionResult> CreateAccount([FromBody] CreateChartAccountDto dto)
    {
        var entity = new ChartAccount { Code = dto.Code, Name = dto.Name, Type = dto.Type, ParentCode = dto.ParentCode, Description = dto.Description };
        await _db.ChartAccounts.AddAsync(entity);
        await _db.SaveChangesAsync();
        return Ok(new { id = entity.Id, code = entity.Code, name = entity.Name, type = entity.Type, parentCode = entity.ParentCode, level = entity.Level, active = entity.Active, description = entity.Description });
    }

    [HttpPut("accounts/{id}")]
    public async Task<IActionResult> UpdateAccount(string id, [FromBody] UpdateChartAccountDto dto)
    {
        var entity = await _db.ChartAccounts.FindAsync(new object[] { id });
        if (entity == null) return NotFound(new { detail = "Account not found." });
        if (dto.Name != null) entity.Name = dto.Name;
        if (dto.Type != null) entity.Type = dto.Type;
        if (dto.ParentCode != null) entity.ParentCode = dto.ParentCode;
        if (dto.Description != null) entity.Description = dto.Description;
        if (dto.Active.HasValue) entity.Active = dto.Active.Value;
        await _db.SaveChangesAsync();
        return Ok(new { id = entity.Id, code = entity.Code, name = entity.Name, type = entity.Type, parentCode = entity.ParentCode, level = entity.Level, active = entity.Active, description = entity.Description });
    }

    // ────────────────────────────────────────────────────────────
    // JOURNAL ENTRIES
    // ────────────────────────────────────────────────────────────
    [HttpGet("journal")]
    public async Task<IActionResult> GetJournalEntries([FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] string? status)
    {
        var query = _db.JournalEntries.AsNoTracking().AsQueryable();
        if (from.HasValue) query = query.Where(e => e.Date >= from.Value);
        if (to.HasValue) query = query.Where(e => e.Date <= to.Value);
        if (!string.IsNullOrEmpty(status)) query = query.Where(e => e.Status == status);
        var items = await query.OrderByDescending(e => e.Date).ToListAsync();
        return Ok(items.Select(e => new { id = e.Id, date = e.Date.ToString("yyyy-MM-dd"), reference = e.Reference, description = e.Description, status = e.Status, totalDebit = e.TotalDebit, totalCredit = e.TotalCredit, reversesId = e.ReversesId, createdBy = e.CreatedBy, linesJson = e.LinesJson }));
    }

    [HttpPost("journal")]
    public async Task<IActionResult> CreateJournalEntry([FromBody] CreateJournalEntryDto dto)
    {
        if (dto.Lines == null || dto.Lines.Count == 0) return BadRequest(new { detail = "El asiento debe tener al menos una línea" });
        var totalDebit = dto.Lines.Sum(l => l.Debit);
        var totalCredit = dto.Lines.Sum(l => l.Credit);
        if (Math.Abs(totalDebit - totalCredit) > 0.01m) return BadRequest(new { detail = "El asiento no está balanceado" });
        var count = await _db.JournalEntries.CountAsync();
        var refNum = $"AST-{DateTime.UtcNow:yyyyMMdd}-{(count + 1):D4}";
        var userId = HttpContext.User.FindFirst("sub")?.Value ?? "";
        var entity = new JournalEntry
        {
            Date = dto.Date, Reference = refNum, Description = dto.Description,
            Status = "posted", TotalDebit = totalDebit, TotalCredit = totalCredit,
            TenantId = "", CreatedBy = userId,
            LinesJson = System.Text.Json.JsonSerializer.Serialize(dto.Lines.Select(l => new { l.AccountCode, l.AccountName, l.Description, l.Debit, l.Credit }))
        };
        await _db.JournalEntries.AddAsync(entity);
        await _db.SaveChangesAsync();
        return Ok(new { id = entity.Id, date = entity.Date.ToString("yyyy-MM-dd"), reference = entity.Reference, description = entity.Description, status = entity.Status, totalDebit = entity.TotalDebit, totalCredit = entity.TotalCredit, linesJson = entity.LinesJson });
    }

    [HttpPost("journal/{id}/reverse")]
    public async Task<IActionResult> ReverseJournalEntry(string id, [FromBody] ReverseDto dto)
    {
        var original = await _db.JournalEntries.FindAsync(new object[] { id });
        if (original == null) return NotFound(new { detail = "Journal entry not found." });
        original.Status = "reversed";
        var count = await _db.JournalEntries.CountAsync();
        var userId = HttpContext.User.FindFirst("sub")?.Value ?? "";
        var reversed = new JournalEntry
        {
            Date = DateTime.UtcNow, Reference = $"AST-{DateTime.UtcNow:yyyyMMdd}-{(count + 1):D4}",
            Description = $"Reversa de {original.Reference}: {dto.Reason}",
            Status = "posted", TotalDebit = original.TotalDebit, TotalCredit = original.TotalCredit,
            ReversesId = original.Id, TenantId = "", CreatedBy = userId, LinesJson = original.LinesJson,
        };
        await _db.JournalEntries.AddAsync(reversed);
        await _db.SaveChangesAsync();
        return Ok(new { id = reversed.Id, reference = reversed.Reference, status = reversed.Status });
    }

    // ────────────────────────────────────────────────────────────
    // ACCOUNTS RECEIVABLE
    // ────────────────────────────────────────────────────────────
    [HttpGet("receivables")]
    public async Task<IActionResult> GetReceivables([FromQuery] string? status)
    {
        var query = _db.AccountsReceivable.AsNoTracking().AsQueryable();
        if (!string.IsNullOrEmpty(status)) query = query.Where(r => r.Status == status);
        var items = await query.OrderByDescending(r => r.Date).ToListAsync();
        return Ok(items.Select(r => new { id = r.Id, clientName = r.ClientName, rnc = r.Rnc, ncf = r.Ncf, date = r.Date.ToString("yyyy-MM-dd"), dueDate = r.DueDate?.ToString("yyyy-MM-dd"), amount = r.Amount, paid = r.Paid, status = r.Status, invoiceId = r.InvoiceId, paymentsJson = r.PaymentsJson }));
    }

    [HttpPost("receivables")]
    public async Task<IActionResult> CreateReceivable([FromBody] CreateReceivableDto dto)
    {
        var userId = HttpContext.User.FindFirst("sub")?.Value ?? "";
        var entity = new AccountsReceivable { ClientName = dto.ClientName, Rnc = dto.Rnc, Ncf = dto.Ncf, Date = dto.Date, DueDate = dto.DueDate, Amount = dto.Amount, InvoiceId = dto.InvoiceId, TenantId = "", CreatedBy = userId };
        await _db.AccountsReceivable.AddAsync(entity);
        await _db.SaveChangesAsync();
        return Ok(new { id = entity.Id, clientName = entity.ClientName, amount = entity.Amount, paid = entity.Paid, status = entity.Status });
    }

    [HttpPost("receivables/{id}/pay")]
    public async Task<IActionResult> PayReceivable(string id, [FromBody] PaymentDto dto)
    {
        var entity = await _db.AccountsReceivable.FindAsync(new object[] { id });
        if (entity == null) return NotFound(new { detail = "Receivable not found." });
        var payments = System.Text.Json.JsonSerializer.Deserialize<List<PaymentRecord>>(entity.PaymentsJson) ?? new();
        payments.Add(new PaymentRecord { Date = dto.Date, Amount = dto.Amount, Method = dto.Method, Reference = dto.Reference });
        entity.PaymentsJson = System.Text.Json.JsonSerializer.Serialize(payments);
        entity.Paid += dto.Amount;
        if (entity.Paid >= entity.Amount) entity.Status = "paid";
        else if (entity.Paid > 0) entity.Status = "partial";
        await _db.SaveChangesAsync();
        return Ok(new { id = entity.Id, paid = entity.Paid, status = entity.Status });
    }

    [HttpGet("receivables/aging")]
    public async Task<IActionResult> GetReceivablesAging()
    {
        var items = await _db.AccountsReceivable.AsNoTracking().Where(r => r.Status != "paid").ToListAsync();
        var today = DateTime.UtcNow;
        var aging = items.GroupBy(r =>
        {
            var days = r.DueDate.HasValue ? (today - r.DueDate.Value).Days : 999;
            if (days <= 0) return "current";
            if (days <= 30) return "1-30d";
            if (days <= 60) return "31-60d";
            if (days <= 90) return "61-90d";
            return "90+d";
        }).ToDictionary(g => g.Key, g => new { count = g.Count(), total = g.Sum(r => r.Amount - r.Paid) });
        return Ok(aging);
    }

    // ────────────────────────────────────────────────────────────
    // ACCOUNTS PAYABLE
    // ────────────────────────────────────────────────────────────
    [HttpGet("payables")]
    public async Task<IActionResult> GetPayables([FromQuery] string? status)
    {
        var query = _db.AccountsPayable.AsNoTracking().AsQueryable();
        if (!string.IsNullOrEmpty(status)) query = query.Where(p => p.Status == status);
        var items = await query.OrderByDescending(p => p.Date).ToListAsync();
        return Ok(items.Select(p => new { id = p.Id, supplierName = p.SupplierName, rnc = p.Rnc, ncf = p.Ncf, date = p.Date.ToString("yyyy-MM-dd"), dueDate = p.DueDate?.ToString("yyyy-MM-dd"), amount = p.Amount, paid = p.Paid, status = p.Status, purchaseOrderId = p.PurchaseOrderId, paymentsJson = p.PaymentsJson }));
    }

    [HttpPost("payables")]
    public async Task<IActionResult> CreatePayable([FromBody] CreatePayableDto dto)
    {
        var userId = HttpContext.User.FindFirst("sub")?.Value ?? "";
        var entity = new AccountsPayable { SupplierName = dto.SupplierName, Rnc = dto.Rnc, Ncf = dto.Ncf, Date = dto.Date, DueDate = dto.DueDate, Amount = dto.Amount, PurchaseOrderId = dto.PurchaseOrderId, TenantId = "", CreatedBy = userId };
        await _db.AccountsPayable.AddAsync(entity);
        await _db.SaveChangesAsync();
        return Ok(new { id = entity.Id, supplierName = entity.SupplierName, amount = entity.Amount, paid = entity.Paid, status = entity.Status });
    }

    [HttpPost("payables/{id}/pay")]
    public async Task<IActionResult> PayPayable(string id, [FromBody] PaymentDto dto)
    {
        var entity = await _db.AccountsPayable.FindAsync(new object[] { id });
        if (entity == null) return NotFound(new { detail = "Payable not found." });
        var payments = System.Text.Json.JsonSerializer.Deserialize<List<PaymentRecord>>(entity.PaymentsJson) ?? new();
        payments.Add(new PaymentRecord { Date = dto.Date, Amount = dto.Amount, Method = dto.Method, Reference = dto.Reference });
        entity.PaymentsJson = System.Text.Json.JsonSerializer.Serialize(payments);
        entity.Paid += dto.Amount;
        if (entity.Paid >= entity.Amount) entity.Status = "paid";
        else if (entity.Paid > 0) entity.Status = "partial";
        await _db.SaveChangesAsync();
        return Ok(new { id = entity.Id, paid = entity.Paid, status = entity.Status });
    }

    [HttpGet("payables/aging")]
    public async Task<IActionResult> GetPayablesAging()
    {
        var items = await _db.AccountsPayable.AsNoTracking().Where(p => p.Status != "paid").ToListAsync();
        var today = DateTime.UtcNow;
        var aging = items.GroupBy(p =>
        {
            var days = p.DueDate.HasValue ? (today - p.DueDate.Value).Days : 999;
            if (days <= 0) return "current";
            if (days <= 30) return "1-30d";
            if (days <= 60) return "31-60d";
            if (days <= 90) return "61-90d";
            return "90+d";
        }).ToDictionary(g => g.Key, g => new { count = g.Count(), total = g.Sum(p => p.Amount - p.Paid) });
        return Ok(aging);
    }

    // ────────────────────────────────────────────────────────────
    // DEBIT NOTES
    // ────────────────────────────────────────────────────────────
    [HttpGet("debit-notes")]
    public async Task<IActionResult> GetDebitNotes([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var query = _db.DebitNotes.AsNoTracking().AsQueryable();
        if (from.HasValue) query = query.Where(n => n.Date >= from.Value);
        if (to.HasValue) query = query.Where(n => n.Date <= to.Value);
        var items = await query.OrderByDescending(n => n.Date).ToListAsync();
        return Ok(items.Select(n => new { id = n.Id, ncf = n.Ncf, ncfType = n.NcfType, partyType = n.PartyType, partyName = n.PartyName, partyRnc = n.PartyRnc, originalNcf = n.OriginalNcf, concept = n.Concept, amount = n.Amount, itbis = n.Itbis, total = n.Amount + n.Itbis, date = n.Date.ToString("yyyy-MM-dd"), status = n.Status }));
    }

    [HttpPost("debit-notes")]
    public async Task<IActionResult> CreateDebitNote([FromBody] CreateNoteDto dto)
    {
        var userId = HttpContext.User.FindFirst("sub")?.Value ?? "";
        var seq = await _db.NcfSequences.FirstOrDefaultAsync(s => s.NcfType == "B34" && s.Active);
        var ncf = "B34-LOCAL";
        if (seq != null)
        {
            ncf = $"B34{seq.CurrentSequence:D10}";
            seq.CurrentSequence++;
        }
        var entity = new DebitNote { Ncf = ncf, NcfType = "B34", PartyType = dto.PartyType, PartyName = dto.PartyName, PartyRnc = dto.PartyRnc, OriginalNcf = dto.OriginalNcf, Concept = dto.Concept, Amount = dto.Amount, Itbis = dto.Itbis, Date = dto.Date, TenantId = "", CreatedBy = userId };
        await _db.DebitNotes.AddAsync(entity);
        await _db.SaveChangesAsync();
        return Ok(new { id = entity.Id, ncf = entity.Ncf, amount = entity.Amount, itbis = entity.Itbis, date = entity.Date.ToString("yyyy-MM-dd"), status = entity.Status });
    }

    // ────────────────────────────────────────────────────────────
    // CREDIT NOTES
    // ────────────────────────────────────────────────────────────
    [HttpGet("credit-notes")]
    public async Task<IActionResult> GetCreditNotes([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var query = _db.CreditNotes.AsNoTracking().AsQueryable();
        if (from.HasValue) query = query.Where(n => n.Date >= from.Value);
        if (to.HasValue) query = query.Where(n => n.Date <= to.Value);
        var items = await query.OrderByDescending(n => n.Date).ToListAsync();
        return Ok(items.Select(n => new { id = n.Id, ncf = n.Ncf, ncfType = n.NcfType, partyType = n.PartyType, partyName = n.PartyName, partyRnc = n.PartyRnc, originalNcf = n.OriginalNcf, concept = n.Concept, amount = n.Amount, itbis = n.Itbis, total = n.Amount + n.Itbis, date = n.Date.ToString("yyyy-MM-dd"), status = n.Status }));
    }

    [HttpPost("credit-notes")]
    public async Task<IActionResult> CreateCreditNote([FromBody] CreateNoteDto dto)
    {
        var userId = HttpContext.User.FindFirst("sub")?.Value ?? "";
        var seq = await _db.NcfSequences.FirstOrDefaultAsync(s => s.NcfType == "B04" && s.Active);
        var ncf = "B04-LOCAL";
        if (seq != null)
        {
            ncf = $"B04{seq.CurrentSequence:D10}";
            seq.CurrentSequence++;
        }
        var entity = new CreditNote { Ncf = ncf, NcfType = "B04", PartyType = dto.PartyType, PartyName = dto.PartyName, PartyRnc = dto.PartyRnc, OriginalNcf = dto.OriginalNcf, Concept = dto.Concept, Amount = dto.Amount, Itbis = dto.Itbis, Date = dto.Date, TenantId = "", CreatedBy = userId };
        await _db.CreditNotes.AddAsync(entity);
        await _db.SaveChangesAsync();
        return Ok(new { id = entity.Id, ncf = entity.Ncf, amount = entity.Amount, itbis = entity.Itbis, date = entity.Date.ToString("yyyy-MM-dd"), status = entity.Status });
    }

    // ────────────────────────────────────────────────────────────
    // CHECKS
    // ────────────────────────────────────────────────────────────
    [HttpGet("checks")]
    public async Task<IActionResult> GetChecks([FromQuery] string? type, [FromQuery] string? status)
    {
        var query = _db.CheckRecords.AsNoTracking().AsQueryable();
        if (!string.IsNullOrEmpty(type)) query = query.Where(c => c.Type == type);
        if (!string.IsNullOrEmpty(status)) query = query.Where(c => c.Status == status);
        var items = await query.OrderByDescending(c => c.Date).ToListAsync();
        return Ok(items.Select(c => new { id = c.Id, number = c.Number, type = c.Type, bank = c.Bank, payee = c.Payee, amount = c.Amount, currency = c.Currency, date = c.Date.ToString("yyyy-MM-dd"), concept = c.Concept, status = c.Status }));
    }

    [HttpPost("checks")]
    public async Task<IActionResult> CreateCheck([FromBody] CreateCheckDto dto)
    {
        var userId = HttpContext.User.FindFirst("sub")?.Value ?? "";
        var entity = new CheckRecord { Number = dto.Number, Type = dto.Type, Bank = dto.Bank, Payee = dto.Payee, Amount = dto.Amount, Currency = dto.Currency, Date = dto.Date, Concept = dto.Concept, TenantId = "", CreatedBy = userId };
        await _db.CheckRecords.AddAsync(entity);
        await _db.SaveChangesAsync();
        return Ok(new { id = entity.Id, number = entity.Number, status = entity.Status });
    }

    [HttpPut("checks/{id}/status")]
    public async Task<IActionResult> UpdateCheckStatus(string id, [FromBody] StatusUpdateDto dto)
    {
        var entity = await _db.CheckRecords.FindAsync(new object[] { id });
        if (entity == null) return NotFound(new { detail = "Check not found." });
        entity.Status = dto.Status;
        await _db.SaveChangesAsync();
        return Ok(new { id = entity.Id, status = entity.Status });
    }

    // ────────────────────────────────────────────────────────────
    // PETTY CASH
    // ────────────────────────────────────────────────────────────
    [HttpGet("petty-cash")]
    public async Task<IActionResult> GetPettyCashFunds()
    {
        var items = await _db.PettyCashFunds.AsNoTracking().Where(f => f.Active).ToListAsync();
        return Ok(items.Select(f => new { id = f.Id, name = f.Name, initialBalance = f.InitialBalance, currentBalance = f.CurrentBalance, currency = f.Currency, active = f.Active }));
    }

    [HttpGet("petty-cash/{fundId}/movements")]
    public async Task<IActionResult> GetPettyCashMovements(string fundId, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var query = _db.PettyCashMovements.AsNoTracking().Where(m => m.FundId == fundId);
        if (from.HasValue) query = query.Where(m => m.Date >= from.Value);
        if (to.HasValue) query = query.Where(m => m.Date <= to.Value);
        var items = await query.OrderByDescending(m => m.Date).ToListAsync();
        return Ok(items.Select(m => new { id = m.Id, fundId = m.FundId, type = m.Type, concept = m.Concept, category = m.Category, amount = m.Amount, balanceAfter = m.BalanceAfter, receipt = m.Receipt, date = m.Date.ToString("yyyy-MM-dd") }));
    }

    [HttpPost("petty-cash/{fundId}/movements")]
    public async Task<IActionResult> AddPettyCashMovement(string fundId, [FromBody] PettyCashMovementDto dto)
    {
        var fund = await _db.PettyCashFunds.FindAsync(new object[] { fundId });
        if (fund == null) return NotFound(new { detail = "Fund not found." });
        if (dto.Type == "egreso" && fund.CurrentBalance < dto.Amount) return BadRequest(new { detail = "Saldo insuficiente" });
        var userId = HttpContext.User.FindFirst("sub")?.Value ?? "";
        var newBalance = dto.Type == "egreso" ? fund.CurrentBalance - dto.Amount : fund.CurrentBalance + dto.Amount;
        fund.CurrentBalance = newBalance;
        var entity = new PettyCashMovement { FundId = fundId, Type = dto.Type, Concept = dto.Concept, Category = dto.Category, Amount = dto.Amount, BalanceAfter = newBalance, Receipt = dto.Receipt, Date = dto.Date, TenantId = "", CreatedBy = userId };
        await _db.PettyCashMovements.AddAsync(entity);
        await _db.SaveChangesAsync();
        return Ok(new { id = entity.Id, balanceAfter = entity.BalanceAfter });
    }

    [HttpPost("petty-cash/{fundId}/reconcile")]
    public async Task<IActionResult> ReconcilePettyCash(string fundId, [FromBody] ReconcileDto dto)
    {
        var fund = await _db.PettyCashFunds.FindAsync(new object[] { fundId });
        if (fund == null) return NotFound(new { detail = "Fund not found." });
        var userId = HttpContext.User.FindFirst("sub")?.Value ?? "";
        var entity = new PettyCashMovement { FundId = fundId, Type = "reposicion", Concept = $"Reposición: {dto.Concept}", Amount = fund.InitialBalance - fund.CurrentBalance, BalanceAfter = fund.InitialBalance, Date = DateTime.UtcNow, TenantId = "", CreatedBy = userId };
        fund.CurrentBalance = fund.InitialBalance;
        await _db.PettyCashMovements.AddAsync(entity);
        await _db.SaveChangesAsync();
        return Ok(new { id = entity.Id, currentBalance = fund.CurrentBalance });
    }

    // ────────────────────────────────────────────────────────────
    // FIXED ASSETS
    // ────────────────────────────────────────────────────────────
    [HttpGet("fixed-assets")]
    public async Task<IActionResult> GetFixedAssets()
    {
        var items = await _db.FixedAssets.AsNoTracking().OrderBy(a => a.Name).ToListAsync();
        return Ok(items.Select(a => new { id = a.Id, name = a.Name, category = a.Category, acquisitionDate = a.AcquisitionDate.ToString("yyyy-MM-dd"), acquisitionCost = a.AcquisitionCost, usefulLifeYears = a.UsefulLifeYears, depreciationMethod = a.DepreciationMethod, salvageValue = a.SalvageValue, location = a.Location, serialNumber = a.SerialNumber, status = a.Status, disposalDate = a.DisposalDate?.ToString("yyyy-MM-dd"), disposalPrice = a.DisposalPrice, disposalReason = a.DisposalReason }));
    }

    [HttpPost("fixed-assets")]
    public async Task<IActionResult> CreateFixedAsset([FromBody] CreateFixedAssetDto dto)
    {
        var entity = new FixedAsset { Name = dto.Name, Category = dto.Category, AcquisitionDate = dto.AcquisitionDate, AcquisitionCost = dto.AcquisitionCost, UsefulLifeYears = dto.UsefulLifeYears, DepreciationMethod = dto.DepreciationMethod, SalvageValue = dto.SalvageValue, Location = dto.Location, SerialNumber = dto.SerialNumber, TenantId = "" };
        await _db.FixedAssets.AddAsync(entity);
        await _db.SaveChangesAsync();
        return Ok(new { id = entity.Id, name = entity.Name, status = entity.Status });
    }

    [HttpGet("fixed-assets/{id}/depreciation")]
    public async Task<IActionResult> GetDepreciationSchedule(string id)
    {
        var asset = await _db.FixedAssets.FindAsync(new object[] { id });
        if (asset == null) return NotFound(new { detail = "Asset not found." });
        var monthlyDep = asset.UsefulLifeYears > 0 ? (asset.AcquisitionCost - asset.SalvageValue) / (asset.UsefulLifeYears * 12) : 0;
        var months = asset.UsefulLifeYears * 12;
        var schedule = new List<object>();
        var accumulated = 0m;
        var start = asset.AcquisitionDate;
        for (int i = 0; i < months; i++)
        {
            accumulated += monthlyDep;
            var date = start.AddMonths(i);
            schedule.Add(new { month = date.ToString("yyyy-MM"), depreciation = Math.Round(monthlyDep, 2), accumulated = Math.Round(accumulated, 2), bookValue = Math.Round(asset.AcquisitionCost - accumulated, 2) });
        }
        return Ok(new { assetId = id, monthlyDepreciation = Math.Round(monthlyDep, 2), schedule });
    }

    [HttpPut("fixed-assets/{id}/dispose")]
    public async Task<IActionResult> DisposeAsset(string id, [FromBody] DisposeDto dto)
    {
        var entity = await _db.FixedAssets.FindAsync(new object[] { id });
        if (entity == null) return NotFound(new { detail = "Asset not found." });
        entity.Status = "disposed";
        entity.DisposalDate = dto.DisposalDate;
        entity.DisposalPrice = dto.DisposalPrice;
        entity.DisposalReason = dto.Reason;
        await _db.SaveChangesAsync();
        return Ok(new { id = entity.Id, status = entity.Status });
    }

    // ────────────────────────────────────────────────────────────
    // NCF SEQUENCES
    // ────────────────────────────────────────────────────────────
    [HttpGet("ncf/sequences")]
    public async Task<IActionResult> GetNcfSequences()
    {
        var items = await _db.NcfSequences.AsNoTracking().OrderBy(s => s.NcfType).ToListAsync();
        return Ok(items.Select(s => new { id = s.Id, ncfType = s.NcfType, name = s.Name, currentSequence = s.CurrentSequence, maxSequence = s.MaxSequence, active = s.Active }));
    }

    [HttpGet("ncf/{ncfType}/next")]
    public async Task<IActionResult> GetNextNcf(string ncfType)
    {
        var seq = await _db.NcfSequences.FirstOrDefaultAsync(s => s.NcfType == ncfType && s.Active);
        if (seq == null) return NotFound(new { detail = "Sequence not found." });
        return Ok(new { ncf = $"{ncfType}{seq.CurrentSequence:D10}", sequence = seq.CurrentSequence });
    }

    // ────────────────────────────────────────────────────────────
    // INCOME & COST RECORDS
    // ────────────────────────────────────────────────────────────
    [HttpGet("income-records")]
    public async Task<IActionResult> GetIncomeRecords([FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] string? type)
    {
        var query = _db.IncomeRecords.AsNoTracking().AsQueryable();
        if (from.HasValue) query = query.Where(r => r.Date >= from.Value);
        if (to.HasValue) query = query.Where(r => r.Date <= to.Value);
        if (!string.IsNullOrEmpty(type)) query = query.Where(r => r.Type == type);
        var items = await query.OrderByDescending(r => r.Date).ToListAsync();
        return Ok(items.Select(r => new { id = r.Id, date = r.Date.ToString("yyyy-MM-dd"), type = r.Type, concept = r.Concept, amount = r.Amount, itbis = r.Itbis, ncf = r.Ncf, accountCode = r.AccountCode }));
    }

    [HttpPost("income-records")]
    public async Task<IActionResult> CreateIncomeRecord([FromBody] CreateIncomeRecordDto dto)
    {
        var userId = HttpContext.User.FindFirst("sub")?.Value ?? "";
        var entity = new IncomeRecord { Date = dto.Date, Type = dto.Type, Concept = dto.Concept, Amount = dto.Amount, Itbis = dto.Itbis, Ncf = dto.Ncf, AccountCode = dto.AccountCode, TenantId = "", CreatedBy = userId };
        await _db.IncomeRecords.AddAsync(entity);
        await _db.SaveChangesAsync();
        return Ok(new { id = entity.Id, date = entity.Date.ToString("yyyy-MM-dd"), amount = entity.Amount });
    }

    [HttpGet("cost-records")]
    public async Task<IActionResult> GetCostRecords([FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] string? type)
    {
        var query = _db.CostRecords.AsNoTracking().AsQueryable();
        if (from.HasValue) query = query.Where(r => r.Date >= from.Value);
        if (to.HasValue) query = query.Where(r => r.Date <= to.Value);
        if (!string.IsNullOrEmpty(type)) query = query.Where(r => r.Type == type);
        var items = await query.OrderByDescending(r => r.Date).ToListAsync();
        return Ok(items.Select(r => new { id = r.Id, date = r.Date.ToString("yyyy-MM-dd"), type = r.Type, concept = r.Concept, amount = r.Amount, itbis = r.Itbis, supplierNcf = r.SupplierNcf, accountCode = r.AccountCode }));
    }

    [HttpPost("cost-records")]
    public async Task<IActionResult> CreateCostRecord([FromBody] CreateCostRecordDto dto)
    {
        var userId = HttpContext.User.FindFirst("sub")?.Value ?? "";
        var entity = new CostRecord { Date = dto.Date, Type = dto.Type, Concept = dto.Concept, Amount = dto.Amount, Itbis = dto.Itbis, SupplierNcf = dto.SupplierNcf, AccountCode = dto.AccountCode, TenantId = "", CreatedBy = userId };
        await _db.CostRecords.AddAsync(entity);
        await _db.SaveChangesAsync();
        return Ok(new { id = entity.Id, date = entity.Date.ToString("yyyy-MM-dd"), amount = entity.Amount });
    }

    // ────────────────────────────────────────────────────────────
    // REPORTS
    // ────────────────────────────────────────────────────────────
    [HttpGet("report/607")]
    public async Task<IActionResult> GetReport607([FromQuery] string period)
    {
        if (string.IsNullOrEmpty(period) || period.Length != 6) return BadRequest(new { detail = "Period must be YYYYMM" });
        var year = int.Parse(period[..4]);
        var month = int.Parse(period.Substring(4, 2));
        var from = new DateTime(year, month, 1);
        var to = from.AddMonths(1).AddDays(-1);
        var invoices = await _db.Invoices.AsNoTracking().Where(i => i.Date >= from && i.Date <= to && i.Status != "cancelled").ToListAsync();
        var rows = invoices.Select(inv => new
        {
            rnc = inv.Rnc ?? "", tipoIdentificacion = (inv.Rnc?.Length ?? 0) == 11 ? "1" : "2",
            ncf = "", fechaNcf = inv.Date.ToString("yyyyMMdd"),
            montoFacturado = inv.Subtotal, itbisFacturado = inv.Tax, itbisRetenidoTerceros = 0, itbisPercibido = 0,
            totalItbis = inv.Tax, montoPropina = 0, efectivo = inv.Total, tarjeta = 0, chequeTransferencia = 0, credito = 0, bonosCertificados = 0,
        });
        return Ok(rows);
    }

    [HttpGet("report/607/export")]
    public async Task<IActionResult> ExportReport607([FromQuery] string period)
    {
        if (string.IsNullOrEmpty(period) || period.Length != 6) return BadRequest(new { detail = "Period must be YYYYMM" });
        var year = int.Parse(period[..4]);
        var month = int.Parse(period.Substring(4, 2));
        var from = new DateTime(year, month, 1);
        var to = from.AddMonths(1).AddDays(-1);
        var invoices = await _db.Invoices.AsNoTracking().Where(i => i.Date >= from && i.Date <= to && i.Status != "cancelled").ToListAsync();
        var header = "RNC|TIPO|NCF|FECHA|MONTO|ITBIS|ITBIS_RET|ITBIS_PERC|TOTAL_ITBIS|PROPINA|EFECTIVO|TARJETA|CHEQUE|CREDITO|BONOS";
        // Invoice.Rnc = RNC del cliente; NCF no está en la entidad Invoice (campo para versión futura)
        var lines = invoices.Select(inv => $"{inv.Rnc ?? ""}|{((inv.Rnc?.Length ?? 0) == 11 ? "1" : "2")}|{""}|{inv.Date:yyyyMMdd}|{inv.Subtotal:F2}|{inv.Tax:F2}|0.00|0.00|{inv.Tax:F2}|0.00|{inv.Total:F2}|0.00|0.00|0.00|0.00");
        var content = string.Join("\n", new[] { header }.Concat(lines));
        var bytes = System.Text.Encoding.UTF8.GetBytes(content);
        return File(bytes, "text/plain; charset=utf-8", $"607_{period}.txt");
    }

    [HttpGet("report/income-statement")]
    public async Task<IActionResult> GetIncomeStatement([FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        var income = await _db.IncomeRecords.AsNoTracking().Where(r => r.Date >= from && r.Date <= to).ToListAsync();
        var costs = await _db.CostRecords.AsNoTracking().Where(r => r.Date >= from && r.Date <= to && r.Type == "costo_venta").ToListAsync();
        var expenses = await _db.CostRecords.AsNoTracking().Where(r => r.Date >= from && r.Date <= to && r.Type != "costo_venta").ToListAsync();
        var totalIncome = income.Sum(r => r.Amount);
        var totalCosts = costs.Sum(r => r.Amount);
        var totalExpenses = expenses.Sum(r => r.Amount);
        return Ok(new
        {
            income = new { total = totalIncome, items = income.Select(r => new { id = r.Id, date = r.Date.ToString("yyyy-MM-dd"), concept = r.Concept, amount = r.Amount }) },
            costs = new { total = totalCosts, items = costs.Select(r => new { id = r.Id, date = r.Date.ToString("yyyy-MM-dd"), concept = r.Concept, amount = r.Amount }) },
            expenses = new { total = totalExpenses, items = expenses.Select(r => new { id = r.Id, date = r.Date.ToString("yyyy-MM-dd"), concept = r.Concept, amount = r.Amount }) },
            grossProfit = totalIncome - totalCosts,
            operatingProfit = totalIncome - totalCosts - totalExpenses,
            netIncome = totalIncome - totalCosts - totalExpenses,
        });
    }

    [HttpGet("report/cash-reconciliation")]
    public async Task<IActionResult> GetCashReconciliationReport([FromQuery] DateTime date, [FromQuery] string? registerId)
    {
        var query = _db.CashReconciliations.AsNoTracking().Where(c => c.Date.Date == date.Date);
        if (!string.IsNullOrEmpty(registerId)) query = query.Where(c => c.CashRegisterId == registerId);
        var item = await query.FirstOrDefaultAsync();
        return Ok(item == null ? null : new { id = item.Id, date = item.Date.ToString("yyyy-MM-dd"), openingBalance = item.OpeningBalance, totalIncome = item.TotalIncome, totalExpenses = item.TotalExpenses, theoreticalBalance = item.TheoreticalBalance, actualCash = item.ActualCash, difference = item.Difference, status = item.Status, notes = item.Notes });
    }

    [HttpPost("report/cash-reconciliation")]
    public async Task<IActionResult> SaveCashReconciliation([FromBody] SaveReconciliationDto dto)
    {
        var userId = HttpContext.User.FindFirst("sub")?.Value ?? "";
        var theoretical = dto.OpeningBalance + dto.TotalIncome - dto.TotalExpenses;
        var diff = dto.ActualCash - theoretical;
        var entity = new CashReconciliation
        {
            Date = dto.Date, CashRegisterId = dto.CashRegisterId, OpeningBalance = dto.OpeningBalance,
            TotalIncome = dto.TotalIncome, TotalExpenses = dto.TotalExpenses, TheoreticalBalance = theoretical,
            ActualCash = dto.ActualCash, Difference = diff, Status = Math.Abs(diff) < 0.01m ? "cuadrado" : "descuadrado",
            Notes = dto.Notes, TenantId = "", CreatedBy = userId
        };
        await _db.CashReconciliations.AddAsync(entity);
        await _db.SaveChangesAsync();
        return Ok(new { id = entity.Id, theoreticalBalance = theoretical, difference = diff, status = entity.Status });
    }
}

public record CreateDiscountRequest(string Name, string? Type, double Value, bool? Active);
public record CreateTaxRequest(string Name, double Rate, string? Type, bool? Active);
public record CreateExemptionRequest(string Name, string? Description, string? AppliesTo, bool? Active);

// New DTOs
public record CreateChartAccountDto(string Code, string Name, string Type, string? ParentCode, string? Description);
public record UpdateChartAccountDto(string? Name, string? Type, string? ParentCode, string? Description, bool? Active);
public record CreateJournalEntryDto(DateTime Date, string Description, List<JournalLineDto> Lines);
public record JournalLineDto(string AccountCode, string AccountName, string? Description, decimal Debit, decimal Credit);
public record ReverseDto(string Reason);
public record PaymentDto(decimal Amount, DateTime Date, string Method, string? Reference);
public record CreateReceivableDto(string ClientName, string? Rnc, string? Ncf, DateTime Date, DateTime? DueDate, decimal Amount, string? InvoiceId);
public record CreatePayableDto(string SupplierName, string? Rnc, string? Ncf, DateTime Date, DateTime? DueDate, decimal Amount, string? PurchaseOrderId);
public record CreateNoteDto(string PartyType, string PartyName, string? PartyRnc, string? OriginalNcf, string Concept, decimal Amount, decimal Itbis, DateTime Date);
public record CreateCheckDto(string Number, string Type, string Bank, string Payee, decimal Amount, string Currency, DateTime Date, string Concept);
public record StatusUpdateDto(string Status);
public record PettyCashMovementDto(string Type, string Concept, string? Category, decimal Amount, string? Receipt, DateTime Date);
public record ReconcileDto(string Concept);
public record CreateFixedAssetDto(string Name, string Category, DateTime AcquisitionDate, decimal AcquisitionCost, int UsefulLifeYears, string DepreciationMethod, decimal SalvageValue, string? Location, string? SerialNumber);
public record DisposeDto(DateTime DisposalDate, decimal DisposalPrice, string Reason);
public record CreateIncomeRecordDto(DateTime Date, string Type, string Concept, decimal Amount, decimal Itbis, string? Ncf, string? AccountCode);
public record CreateCostRecordDto(DateTime Date, string Type, string Concept, decimal Amount, decimal Itbis, string? SupplierNcf, string? AccountCode);
public record SaveReconciliationDto(DateTime Date, string? CashRegisterId, decimal OpeningBalance, decimal TotalIncome, decimal TotalExpenses, decimal ActualCash, string? Notes);

// Helper record for JSON deserialization
public class PaymentRecord { public DateTime Date { get; set; } public decimal Amount { get; set; } public string Method { get; set; } = ""; public string? Reference { get; set; } }
