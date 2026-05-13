using ContosoUniversity.Api.Services;
using ContosoUniversity.Data;
using ContosoUniversity.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ContosoUniversity.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StudentsController(SchoolContext context, INotificationService notifications) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetStudents(
        [FromQuery] string? sortOrder,
        [FromQuery] string? searchString,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = context.Students.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(searchString))
        {
            query = query.Where(s => s.LastName.Contains(searchString) || s.FirstMidName.Contains(searchString));
        }

        query = sortOrder switch
        {
            "name_desc" => query.OrderByDescending(s => s.LastName),
            "Date" => query.OrderBy(s => s.EnrollmentDate),
            "date_desc" => query.OrderByDescending(s => s.EnrollmentDate),
            _ => query.OrderBy(s => s.LastName),
        };

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return Ok(new
        {
            items,
            page,
            pageSize,
            totalCount,
            totalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
        });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetStudent(int id, CancellationToken cancellationToken = default)
    {
        var student = await context.Students
            .AsNoTracking()
            .Include(s => s.Enrollments)
            .ThenInclude(e => e.Course)
            .SingleOrDefaultAsync(s => s.ID == id, cancellationToken);

        return student is null ? NotFound() : Ok(student);
    }

    [HttpPost]
    public async Task<IActionResult> CreateStudent([FromBody] Student input, CancellationToken cancellationToken = default)
    {
        if (input.EnrollmentDate == default || input.EnrollmentDate < new DateTime(1753, 1, 1) || input.EnrollmentDate > new DateTime(9999, 12, 31))
        {
            ModelState.AddModelError("EnrollmentDate", "Enrollment date must be between 1753 and 9999.");
            return ValidationProblem(ModelState);
        }

        var student = new Student
        {
            FirstMidName = input.FirstMidName,
            LastName = input.LastName,
            EnrollmentDate = input.EnrollmentDate,
        };

        context.Students.Add(student);
        await context.SaveChangesAsync(cancellationToken);

        await notifications.PublishAsync("Student", student.ID.ToString(), $"{student.FirstMidName} {student.LastName}", EntityOperation.CREATE, cancellationToken: cancellationToken);

        return CreatedAtAction(nameof(GetStudent), new { id = student.ID }, student);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateStudent(int id, [FromBody] Student input, CancellationToken cancellationToken = default)
    {
        var student = await context.Students.SingleOrDefaultAsync(s => s.ID == id, cancellationToken);
        if (student is null)
        {
            return NotFound();
        }

        if (input.EnrollmentDate == default || input.EnrollmentDate < new DateTime(1753, 1, 1) || input.EnrollmentDate > new DateTime(9999, 12, 31))
        {
            ModelState.AddModelError("EnrollmentDate", "Enrollment date must be between 1753 and 9999.");
            return ValidationProblem(ModelState);
        }

        student.FirstMidName = input.FirstMidName;
        student.LastName = input.LastName;
        student.EnrollmentDate = input.EnrollmentDate;

        await context.SaveChangesAsync(cancellationToken);

        await notifications.PublishAsync("Student", student.ID.ToString(), $"{student.FirstMidName} {student.LastName}", EntityOperation.UPDATE, cancellationToken: cancellationToken);

        return Ok(student);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteStudent(int id, CancellationToken cancellationToken = default)
    {
        var student = await context.Students.SingleOrDefaultAsync(s => s.ID == id, cancellationToken);
        if (student is null)
        {
            return NotFound();
        }

        context.Students.Remove(student);
        await context.SaveChangesAsync(cancellationToken);

        await notifications.PublishAsync("Student", id.ToString(), $"{student.FirstMidName} {student.LastName}", EntityOperation.DELETE, cancellationToken: cancellationToken);

        return NoContent();
    }
}
