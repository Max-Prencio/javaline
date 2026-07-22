using Javaline.Commercial.Domain.Entities;
using Javaline.Commercial.Domain.Interfaces;
using Javaline.Commercial.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Javaline.Commercial.Api.Controllers;

[ApiController]
[Route("contacts")]
[Authorize]
public class ContactsController : ControllerBase
{
    private readonly JavalineDbContext _db;
    private readonly IUnitOfWork _unitOfWork;

    public ContactsController(JavalineDbContext db, IUnitOfWork unitOfWork)
    {
        _db = db;
        _unitOfWork = unitOfWork;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? type = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        IQueryable<Contact> query = _db.Contacts.Where(c => c.Active);

        if (!string.IsNullOrWhiteSpace(type))
            query = query.Where(c => c.Type == type);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(c =>
                c.Name.ToLower().Contains(term) ||
                (c.Company != null && c.Company.ToLower().Contains(term)) ||
                (c.Email != null && c.Email.ToLower().Contains(term)));
        }

        var contacts = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync();

        var totalCount = await query.CountAsync();

        return Ok(new { items = contacts, totalCount, page, pageSize });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var contact = await _db.Contacts.FindAsync(new object[] { id });
        if (contact == null)
            return NotFound(new { detail = "Contact not found." });

        return Ok(contact);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ContactDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest(new { detail = "Name es requerido." });

        var contact = new Contact
        {
            Id = Guid.NewGuid().ToString(),
            Name = dto.Name,
            Company = dto.Company,
            Rnc = dto.Rnc,
            Email = dto.Email,
            Phone = dto.Phone,
            Type = dto.Type ?? "cliente",
            Address = dto.Address,
            Notes = dto.Notes,
            Active = true,
            CreatedAt = DateTime.UtcNow
        };

        await _db.Contacts.AddAsync(contact);
        await _unitOfWork.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = contact.Id }, contact);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] ContactDto dto)
    {
        var existing = await _db.Contacts.FindAsync(new object[] { id });
        if (existing == null)
            return NotFound(new { detail = "Contact not found." });

        if (dto.Name != null) existing.Name = dto.Name;
        if (dto.Company != null) existing.Company = dto.Company;
        if (dto.Rnc != null) existing.Rnc = dto.Rnc;
        if (dto.Email != null) existing.Email = dto.Email;
        if (dto.Phone != null) existing.Phone = dto.Phone;
        if (dto.Type != null) existing.Type = dto.Type;
        if (dto.Address != null) existing.Address = dto.Address;
        if (dto.Notes != null) existing.Notes = dto.Notes;

        _db.Contacts.Update(existing);
        await _unitOfWork.SaveChangesAsync();

        return Ok(existing);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var contact = await _db.Contacts.FindAsync(new object[] { id });
        if (contact == null)
            return NotFound(new { detail = "Contact not found." });

        contact.Active = false;
        _db.Contacts.Update(contact);
        await _unitOfWork.SaveChangesAsync();

        return Ok(new { success = true });
    }
}

public record ContactDto(
    string? Name,
    string? Company,
    string? Rnc,
    string? Email,
    string? Phone,
    string? Type,
    string? Address,
    string? Notes
);
