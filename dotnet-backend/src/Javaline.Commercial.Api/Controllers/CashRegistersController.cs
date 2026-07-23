using System.Security.Claims;
using System.Text.Json;
using Javaline.Commercial.Domain.Entities;
using Javaline.Commercial.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Javaline.Commercial.Api.Controllers;

[ApiController]
[Route("cash-registers")]
[Authorize]
public class CashRegistersController : ControllerBase
{
    private readonly JavalineDbContext _db;

    public CashRegistersController(JavalineDbContext db) => _db = db;

    private string? GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? User.FindFirst("sub")?.Value;

    private static object ToDto(CashRegister r) => new
    {
        id = r.Id,
        userId = r.UserId,
        openDate = r.OpenDate.ToString("o"),
        closeDate = r.CloseDate?.ToString("o"),
        initialBalance = r.InitialBalance,
        currentBalance = r.CurrentBalance,
        totalIncome = r.TotalIncome,
        totalExpense = r.TotalExpense,
        status = r.Status?.ToLower(),
        currency = r.Currency,
        transactions = ParseTransactions(r.Transactions),
        createdAt = r.CreatedAt.ToString("o"),
    };

    private static List<object> ParseTransactions(string? json)
    {
        if (string.IsNullOrWhiteSpace(json) || json == "[]")
            return new List<object>();

        try
        {
            using var doc = JsonDocument.Parse(json);
            var list = new List<object>();
            foreach (var el in doc.RootElement.EnumerateArray())
            {
                list.Add(new
                {
                    id = el.TryGetProperty("id", out var id) ? id.GetString() : "",
                    createdAt = el.TryGetProperty("createdAt", out var ca) ? ca.GetString() : "",
                    concept = el.TryGetProperty("concept", out var c) ? c.GetString() : "",
                    paymentMethod = el.TryGetProperty("paymentMethod", out var pm) ? pm.GetString() : "cash",
                    type = el.TryGetProperty("type", out var t) ? t.GetString() : "",
                    amount = el.TryGetProperty("amount", out var a) ? a.GetDouble() : 0,
                });
            }
            return list;
        }
        catch
        {
            return new List<object>();
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var registers = await _db.CashRegisters
            .OrderByDescending(c => c.CreatedAt)
            .AsNoTracking()
            .ToListAsync();

        return Ok(registers.Select(ToDto).ToList());
    }

    [HttpGet("open/{userId}")]
    public async Task<IActionResult> GetOpen(string userId)
    {
        var register = await _db.CashRegisters
            .Where(c => c.UserId == userId && c.Status == "Open")
            .OrderByDescending(c => c.CreatedAt)
            .AsNoTracking()
            .FirstOrDefaultAsync();

        if (register == null) return Ok(null);
        return Ok(ToDto(register));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var register = await _db.CashRegisters.FindAsync(new object[] { id });
        if (register == null) return NotFound(new { detail = "Cash register not found." });
        return Ok(ToDto(register));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCashRegisterRequest request)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { detail = "User not authenticated." });

        var openExists = await _db.CashRegisters
            .AnyAsync(c => c.UserId == userId && c.Status == "Open");
        if (openExists)
            return BadRequest(new { detail = "Ya hay una caja abierta." });

        var register = new CashRegister
        {
            Id = $"CAJ-{DateTime.UtcNow:yyyyMMddHHmmss}",
            UserId = userId,
            OpenDate = DateTime.UtcNow,
            Status = "Open",
            InitialBalance = request.InitialBalance,
            CurrentBalance = request.InitialBalance,
            TotalIncome = 0,
            TotalExpense = 0,
            Transactions = "[]",
            Currency = "DOP",
            CreatedAt = DateTime.UtcNow,
        };

        await _db.CashRegisters.AddAsync(register);
        await _db.SaveChangesAsync();

        return Ok(ToDto(register));
    }

    [HttpPost("close")]
    public async Task<IActionResult> Close([FromBody] CloseCashRegisterRequest request)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { detail = "User not authenticated." });

        var register = await _db.CashRegisters
            .Where(c => c.UserId == userId && c.Status == "Open")
            .OrderByDescending(c => c.CreatedAt)
            .FirstOrDefaultAsync();

        if (register == null)
            return BadRequest(new { detail = "No hay caja abierta." });

        register.Status = "Closed";
        register.CloseDate = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(ToDto(register));
    }

    [HttpPost("{id}/transactions")]
    public async Task<IActionResult> AddTransaction(string id, [FromBody] AddTransactionRequest request)
    {
        var register = await _db.CashRegisters.FindAsync(new object[] { id });
        if (register == null)
            return NotFound(new { detail = "Cash register not found." });
        if (register.Status != "Open")
            return BadRequest(new { detail = "La caja está cerrada." });

        var txn = new
        {
            id = $"TXN-{DateTime.UtcNow:yyyyMMddHHmmssfff}",
            createdAt = DateTime.UtcNow.ToString("o"),
            concept = request.Concept ?? "",
            paymentMethod = request.PaymentMethod ?? "cash",
            type = request.Type,
            amount = request.Amount,
        };

        var transactions = ParseTransactions(register.Transactions);
        var txnList = transactions.Select(t => JsonSerializer.SerializeToElement(t)).ToList();
        txnList.Add(JsonSerializer.SerializeToElement(txn));
        register.Transactions = JsonSerializer.Serialize(txnList);

        if (request.Type == "income")
        {
            register.TotalIncome += request.Amount;
            register.CurrentBalance += request.Amount;
        }
        else if (request.Type == "expense")
        {
            register.TotalExpense += request.Amount;
            register.CurrentBalance -= request.Amount;
        }

        await _db.SaveChangesAsync();

        return Ok(ToDto(register));
    }

    [HttpDelete("{id}/transactions/{txnId}")]
    public async Task<IActionResult> RemoveTransaction(string id, string txnId, [FromQuery] string? userId = null)
    {
        var register = await _db.CashRegisters.FindAsync(new object[] { id });
        if (register == null)
            return NotFound(new { detail = "Cash register not found." });

        var transactions = ParseTransactions(register.Transactions);
        var txn = transactions.FirstOrDefault(t =>
        {
            var idProp = t.GetType().GetProperty("id");
            return idProp?.GetValue(t)?.ToString() == txnId;
        });

        if (txn == null)
            return NotFound(new { detail = "Transaction not found." });

        var amountProp = txn.GetType().GetProperty("amount");
        var typeProp = txn.GetType().GetProperty("type");
        var amount = amountProp != null ? (double)amountProp.GetValue(txn)! : 0;
        var type = typeProp?.GetValue(txn)?.ToString();

        if (type == "income")
        {
            register.TotalIncome -= (decimal)amount;
            register.CurrentBalance -= (decimal)amount;
        }
        else if (type == "expense")
        {
            register.TotalExpense -= (decimal)amount;
            register.CurrentBalance += (decimal)amount;
        }

        transactions.Remove(txn);
        register.Transactions = JsonSerializer.Serialize(transactions);

        await _db.SaveChangesAsync();

        return Ok(new { success = true });
    }

    [HttpGet("{id}/sessions")]
    public async Task<IActionResult> GetSessions(string id)
    {
        var register = await _db.CashRegisters.FindAsync(new object[] { id });
        if (register == null)
            return NotFound(new { detail = "Cash register not found." });

        var sessions = await _db.CashRegisters
            .Where(c => c.UserId == register.UserId)
            .OrderByDescending(c => c.CreatedAt)
            .AsNoTracking()
            .ToListAsync();

        return Ok(sessions.Select(ToDto).ToList());
    }
}

public record CreateCashRegisterRequest(decimal InitialBalance);
public record CloseCashRegisterRequest();
public record AddTransactionRequest(string Type, decimal Amount, string? Concept, string? PaymentMethod);
