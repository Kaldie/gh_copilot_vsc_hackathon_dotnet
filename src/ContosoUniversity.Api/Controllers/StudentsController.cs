using ContosoUniversity.Api.Application.DTOs;
using ContosoUniversity.Api.Application.Interfaces;
using ContosoUniversity.Api.Domain.Entities;
using ContosoUniversity.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ContosoUniversity.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StudentsController(SchoolContext context, INotificationService notificationService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PaginatedList<StudentListDto>>> GetStudents(
        [FromQuery] string? searchString,
        [FromQuery] string? sortOrder,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var query = context.Students.AsQueryable();

        if (!string.IsNullOrWhiteSpace(searchString))
        {
            var search = searchString.Trim().ToLower();
            query = query.Where(s =>
                s.LastName.ToLower().Contains(search) || s.FirstMidName.ToLower().Contains(search));
        }

        query = sortOrder switch
        {
            "LastName_desc" => query.OrderByDescending(s => s.LastName),
            "FirstName" => query.OrderBy(s => s.FirstMidName),
            "FirstName_desc" => query.OrderByDescending(s => s.FirstMidName),
            "EnrollmentDate" => query.OrderBy(s => s.EnrollmentDate),
            "EnrollmentDate_desc" => query.OrderByDescending(s => s.EnrollmentDate),
            _ => query.OrderBy(s => s.LastName),
        };

        var projected = query.Select(s => new StudentListDto(
            s.Id, s.LastName, s.FirstMidName, s.EnrollmentDate));

        var result = await PaginatedList<StudentListDto>.CreateAsync(
            projected, pageIndex, pageSize, cancellationToken);

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<StudentDetailDto>> GetStudent(int id, CancellationToken cancellationToken)
    {
        var student = await context.Students
            .Include(s => s.Enrollments)
                .ThenInclude(e => e.Course)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

        if (student is null)
            return NotFound();

        return Ok(MapToDetail(student));
    }

    [HttpPost]
    public async Task<ActionResult<StudentDetailDto>> CreateStudent(
        CreateStudentDto dto, CancellationToken cancellationToken)
    {
        var student = new Student
        {
            LastName = dto.LastName,
            FirstMidName = dto.FirstMidName,
            EnrollmentDate = dto.EnrollmentDate,
        };

        context.Students.Add(student);
        await context.SaveChangesAsync(cancellationToken);

        await notificationService.NotifyAsync(
            "Student", student.Id, "Created",
            $"Student {student.FullName} was created.",
            cancellationToken);

        return CreatedAtAction(nameof(GetStudent), new { id = student.Id }, MapToDetail(student));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<StudentDetailDto>> UpdateStudent(
        int id, UpdateStudentDto dto, CancellationToken cancellationToken)
    {
        var student = await context.Students
            .Include(s => s.Enrollments)
                .ThenInclude(e => e.Course)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

        if (student is null)
            return NotFound();

        student.LastName = dto.LastName;
        student.FirstMidName = dto.FirstMidName;
        student.EnrollmentDate = dto.EnrollmentDate;

        await context.SaveChangesAsync(cancellationToken);

        await notificationService.NotifyAsync(
            "Student", student.Id, "Updated",
            $"Student {student.FullName} was updated.",
            cancellationToken);

        return Ok(MapToDetail(student));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteStudent(int id, CancellationToken cancellationToken)
    {
        var student = await context.Students
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

        if (student is null)
            return NotFound();

        var name = student.FullName;
        context.Students.Remove(student);
        await context.SaveChangesAsync(cancellationToken);

        await notificationService.NotifyAsync(
            "Student", id, "Deleted",
            $"Student {name} was deleted.",
            cancellationToken);

        return NoContent();
    }

    private static StudentDetailDto MapToDetail(Student student) => new(
        student.Id,
        student.LastName,
        student.FirstMidName,
        student.EnrollmentDate,
        student.Enrollments.Select(e => new EnrollmentDto(
            e.EnrollmentId,
            e.CourseId,
            e.Course?.Title ?? "",
            e.StudentId,
            null,
            e.Grade
        )).ToList()
    );
}
