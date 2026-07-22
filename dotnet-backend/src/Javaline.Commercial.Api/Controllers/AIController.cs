using System.Security.Claims;
using System.Text.Json;
using Javaline.Commercial.Domain.Entities;
using Javaline.Commercial.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Javaline.Commercial.Api.Controllers;

[ApiController]
[Route("ai")]
[Authorize]
public class AIController : ControllerBase
{
    private readonly JavalineDbContext _db;
    private readonly IConfiguration _config;

    public AIController(JavalineDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    private string? GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;

    private string GetTenantId()
    {
        var userId = GetUserId();
        var user = _db.Users.FirstOrDefault(u => u.Id == userId);
        return user?.TenantId ?? "default";
    }

    // ─── Context CRUD ───

    [HttpGet("context")]
    public async Task<IActionResult> ListContext([FromQuery] string? category = null)
    {
        var tenantId = GetTenantId();
        var query = _db.BusinessContexts
            .Where(c => c.TenantId == tenantId && c.Active);

        if (!string.IsNullOrEmpty(category))
            query = query.Where(c => c.Category == category);

        var entries = await query.OrderByDescending(c => c.CreatedAt).ToListAsync();
        return Ok(entries);
    }

    [HttpPost("context")]
    public async Task<IActionResult> CreateContext([FromBody] CreateContextDto data)
    {
        var ctx = new BusinessContext
        {
            Id = Guid.NewGuid().ToString(),
            TenantId = GetTenantId(),
            Title = data.Title ?? "",
            Content = data.Content ?? "",
            Category = data.Category ?? "general",
            Active = true,
            CreatedAt = DateTime.UtcNow
        };
        _db.BusinessContexts.Add(ctx);
        await _db.SaveChangesAsync();
        return Ok(ctx);
    }

    [HttpPut("context/{id}")]
    public async Task<IActionResult> UpdateContext(string id, [FromBody] CreateContextDto data)
    {
        var tenantId = GetTenantId();
        var ctx = await _db.BusinessContexts.FindAsync(id);
        if (ctx == null) return NotFound(new { detail = "Contexto no encontrado" });
        if (ctx.TenantId != tenantId) return Forbid();

        if (data.Title != null) ctx.Title = data.Title;
        if (data.Content != null) ctx.Content = data.Content;
        if (data.Category != null) ctx.Category = data.Category;
        await _db.SaveChangesAsync();
        return Ok(ctx);
    }

    [HttpDelete("context/{id}")]
    public async Task<IActionResult> DeleteContext(string id)
    {
        var tenantId = GetTenantId();
        var ctx = await _db.BusinessContexts.FindAsync(id);
        if (ctx == null) return NotFound(new { detail = "Contexto no encontrado" });
        if (ctx.TenantId != tenantId) return Forbid();

        ctx.Active = false;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Contexto eliminado" });
    }

    // ─── Chat ───

    [HttpPost("chat")]
    public async Task<IActionResult> Chat([FromBody] ChatDto data)
    {
        if (string.IsNullOrWhiteSpace(data.Message))
            return BadRequest(new { detail = "Mensaje requerido" });

        var tenantId = GetTenantId();
        var userId = GetUserId()!;
        AiConversation? conversation = null;

        if (!string.IsNullOrEmpty(data.ConversationId))
        {
            conversation = await _db.AiConversations.FirstOrDefaultAsync(c =>
                c.Id == data.ConversationId && c.UserId == userId);
        }

        if (conversation == null)
        {
            conversation = new AiConversation
            {
                Id = Guid.NewGuid().ToString(),
                UserId = userId,
                TenantId = tenantId,
                Title = data.Message[..Math.Min(80, data.Message.Length)],
                Messages = "[]",
                Active = true,
                UpdatedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };
            _db.AiConversations.Add(conversation);
            await _db.SaveChangesAsync();
        }

        var history = JsonSerializer.Deserialize<List<JsonElement>>(conversation.Messages ?? "[]") ?? new();
        var openAiKey = _config["OpenAI:ApiKey"] ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY");
        var model = _config["OpenAI:Model"] ?? Environment.GetEnvironmentVariable("OPENAI_MODEL") ?? "gpt-4o-mini";

        var response = "El asistente de IA no está configurado. Configura OPENAI_API_KEY para usar esta función.";

        if (!string.IsNullOrEmpty(openAiKey))
        {
            try
            {
                using var httpClient = new HttpClient();
                httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {openAiKey}");

                var messages = new List<object>
                {
                    new { role = "system", content = "Eres Javaline AI, un asistente experto en gestión empresarial, contabilidad, inventario y RRHH. Responde en español." }
                };

                foreach (var msg in history.TakeLast(20))
                {
                    var role = msg.GetProperty("role").GetString() ?? "user";
                    var content = msg.GetProperty("content").GetString() ?? "";
                    messages.Add(new { role, content });
                }

                messages.Add(new { role = "user", content = data.Message });

                var body = JsonSerializer.Serialize(new
                {
                    model,
                    messages,
                    max_tokens = 1000,
                    temperature = 0.7
                });

                var resp = await httpClient.PostAsync("https://api.openai.com/v1/chat/completions",
                    new StringContent(body, System.Text.Encoding.UTF8, "application/json"));

                if (resp.IsSuccessStatusCode)
                {
                    var json = await resp.Content.ReadFromJsonAsync<JsonElement>();
                    response = json.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? response;
                }
            }
            catch (Exception ex)
            {
                response = $"Error al conectar con OpenAI: {ex.Message}";
            }
        }

        // Save to history
        var messagesList = new List<object>();
        foreach (var msg in history)
            messagesList.Add(new { role = msg.GetProperty("role").GetString(), content = msg.GetProperty("content").GetString() });
        messagesList.Add(new { role = "user", content = data.Message });
        messagesList.Add(new { role = "assistant", content = response });
        conversation.Messages = JsonSerializer.Serialize(messagesList);
        conversation.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new
        {
            conversation_id = conversation.Id,
            response,
            sql = (string?)null,
            data = (object?)null,
            alerts = new List<object>()
        });
    }

    // ─── Alerts ───

    [HttpGet("alerts")]
    public async Task<IActionResult> GetAlerts()
    {
        var tenantId = GetTenantId();
        var alerts = new List<object>();

        var lowStock = await _db.InventoryItems
            .Where(i => i.TenantId == tenantId && i.Active && i.Stock <= i.MinStock)
            .Select(i => new { type = "low_stock", product = i.Name, stock = i.Stock, minStock = i.MinStock })
            .ToListAsync();

        foreach (var item in lowStock)
            alerts.Add(new { type = "low_stock", message = $"Stock bajo: {item.product} ({item.stock}/{item.minStock})", severity = "warning" });

        return Ok(alerts);
    }

    // ─── Conversations ───

    [HttpGet("conversations")]
    public async Task<IActionResult> ListConversations()
    {
        var userId = GetUserId()!;
        var convs = await _db.AiConversations
            .Where(c => c.UserId == userId && c.Active)
            .OrderByDescending(c => c.UpdatedAt)
            .Take(50)
            .ToListAsync();

        return Ok(convs.Select(c => new
        {
            id = c.Id,
            title = c.Title,
            message_count = (c.Messages ?? "").Count(f => f == '"') / 4,
            updated_at = c.UpdatedAt.ToString("o")
        }));
    }

    [HttpGet("conversations/{id}")]
    public async Task<IActionResult> GetConversation(string id)
    {
        var userId = GetUserId()!;
        var conv = await _db.AiConversations.FirstOrDefaultAsync(c =>
            c.Id == id && c.UserId == userId);

        if (conv == null) return NotFound(new { detail = "Conversación no encontrada" });

        return Ok(new
        {
            id = conv.Id,
            title = conv.Title,
            messages = JsonSerializer.Deserialize<object[]>(conv.Messages ?? "[]")
        });
    }

    [HttpDelete("conversations/{id}")]
    public async Task<IActionResult> DeleteConversation(string id)
    {
        var userId = GetUserId()!;
        var conv = await _db.AiConversations.FirstOrDefaultAsync(c =>
            c.Id == id && c.UserId == userId);

        if (conv == null) return NotFound(new { detail = "Conversación no encontrada" });
        conv.Active = false;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Conversación eliminada" });
    }

    // ─── Config ───

    [HttpGet("config")]
    public IActionResult GetConfig()
    {
        var apiKey = _config["OpenAI:ApiKey"] ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY");
        var model = _config["OpenAI:Model"] ?? Environment.GetEnvironmentVariable("OPENAI_MODEL") ?? "gpt-4o-mini";
        return Ok(new { configured = !string.IsNullOrEmpty(apiKey), model = !string.IsNullOrEmpty(apiKey) ? model : "" });
    }
}

public class ChatDto
{
    public string Message { get; set; } = "";
    public string? ConversationId { get; set; }
}

public class CreateContextDto
{
    public string? Title { get; set; }
    public string? Content { get; set; }
    public string? Category { get; set; }
}
