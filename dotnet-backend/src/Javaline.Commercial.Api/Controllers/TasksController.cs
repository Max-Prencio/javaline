using Javaline.Commercial.Domain.Entities;
using Javaline.Commercial.Domain.Interfaces;
using Javaline.Commercial.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Javaline.Commercial.Api.Controllers;

[ApiController]
[Route("tasks")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly JavalineDbContext _db;
    private readonly IUnitOfWork _unitOfWork;

    public TasksController(JavalineDbContext db, IUnitOfWork unitOfWork)
    {
        _db = db;
        _unitOfWork = unitOfWork;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? status = null,
        [FromQuery] string? assignedTo = null,
        [FromQuery] string? search = null)
    {
        IQueryable<TaskItem> query = _db.Tasks.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(t => t.Status == status);

        if (!string.IsNullOrWhiteSpace(assignedTo))
            query = query.Where(t => t.AssignedTo == assignedTo);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(t => t.Title.ToLower().Contains(term) ||
                (t.Description != null && t.Description.ToLower().Contains(term)));
        }

        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .AsNoTracking()
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var task = await _db.Tasks.FindAsync(new object[] { id });
        if (task == null)
            return NotFound(new { detail = "Tarea no encontrada." });

        return Ok(task);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TaskItem task)
    {
        task.Id = Guid.NewGuid().ToString();
        task.CreatedAt = DateTime.UtcNow;

        await _db.Tasks.AddAsync(task);
        await _unitOfWork.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = task.Id }, task);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] TaskItem task)
    {
        var existing = await _db.Tasks.FindAsync(new object[] { id });
        if (existing == null)
            return NotFound(new { detail = "Tarea no encontrada." });

        existing.Title = task.Title;
        existing.Description = task.Description;
        existing.Status = task.Status;
        existing.Priority = task.Priority;
        existing.AssignedTo = task.AssignedTo;
        existing.DueDate = task.DueDate;

        _db.Tasks.Update(existing);
        await _unitOfWork.SaveChangesAsync();

        return Ok(existing);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var task = await _db.Tasks.FindAsync(new object[] { id });
        if (task == null)
            return NotFound(new { detail = "Tarea no encontrada." });

        _db.Tasks.Remove(task);
        await _unitOfWork.SaveChangesAsync();

        return Ok(new { success = true });
    }
}
