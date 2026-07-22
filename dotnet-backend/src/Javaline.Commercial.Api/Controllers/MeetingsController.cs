using Javaline.Commercial.Domain.Entities;
using Javaline.Commercial.Domain.Interfaces;
using Javaline.Commercial.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Javaline.Commercial.Api.Controllers;

[ApiController]
[Route("meetings")]
[Authorize]
public class MeetingsController : ControllerBase
{
    private readonly JavalineDbContext _db;
    private readonly IUnitOfWork _unitOfWork;

    public MeetingsController(JavalineDbContext db, IUnitOfWork unitOfWork)
    {
        _db = db;
        _unitOfWork = unitOfWork;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? type = null,
        [FromQuery] string? from = null,
        [FromQuery] string? to = null)
    {
        IQueryable<Meeting> query = _db.Meetings.AsQueryable();

        if (!string.IsNullOrWhiteSpace(type))
            query = query.Where(m => m.Type == type);

        if (DateTime.TryParse(from, out var fromDate))
            query = query.Where(m => m.StartDate >= fromDate);

        if (DateTime.TryParse(to, out var toDate))
            query = query.Where(m => m.StartDate <= toDate);

        var items = await query
            .OrderBy(m => m.StartDate)
            .AsNoTracking()
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var meeting = await _db.Meetings.FindAsync(new object[] { id });
        if (meeting == null)
            return NotFound(new { detail = "Reunión no encontrada." });

        return Ok(meeting);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Meeting meeting)
    {
        meeting.Id = Guid.NewGuid().ToString();
        meeting.CreatedAt = DateTime.UtcNow;

        await _db.Meetings.AddAsync(meeting);
        await _unitOfWork.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = meeting.Id }, meeting);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] Meeting meeting)
    {
        var existing = await _db.Meetings.FindAsync(new object[] { id });
        if (existing == null)
            return NotFound(new { detail = "Reunión no encontrada." });

        existing.Title = meeting.Title;
        existing.Description = meeting.Description;
        existing.StartDate = meeting.StartDate;
        existing.EndDate = meeting.EndDate;
        existing.Location = meeting.Location;
        existing.Attendees = meeting.Attendees;
        existing.Type = meeting.Type;

        _db.Meetings.Update(existing);
        await _unitOfWork.SaveChangesAsync();

        return Ok(existing);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var meeting = await _db.Meetings.FindAsync(new object[] { id });
        if (meeting == null)
            return NotFound(new { detail = "Reunión no encontrada." });

        _db.Meetings.Remove(meeting);
        await _unitOfWork.SaveChangesAsync();

        return Ok(new { success = true });
    }
}
