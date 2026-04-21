using ContosoUniversity.Api.Application.DTOs;
using ContosoUniversity.Api.Application.Interfaces;
using ContosoUniversity.Api.Domain.Entities;
using ContosoUniversity.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ContosoUniversity.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DepartmentsController(
    SchoolContext context,
    INotificationService notificationService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<DepartmentListDto>>> GetDepartments(CancellationToken cancellationToken)
    {
        var departments = await context.Departments
            .Include(d => d.Administrator)
            .OrderBy(d => d.Name)
            .Select(d => new DepartmentListDto(
                d.DepartmentId,
                d.Name,
                d.Budget,
                d.StartDate,
                d.Administrator != null ? d.Administrator.LastName + ", " + d.Administrator.FirstMidName : null))
            .ToListAsync(cancellationToken);

        return Ok(departments);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DepartmentDetailDto>> GetDepartment(int id, CancellationToken cancellationToken)
    {
        var dept = await context.Departments
            .Include(d => d.Administrator)
            .Include(d => d.Courses)
            .FirstOrDefaultAsync(d => d.DepartmentId == id, cancellationToken);

        if (dept is null)
            return NotFound();

        return Ok(MapToDetail(dept));
    }

    [HttpPost]
    public async Task<ActionResult<DepartmentDetailDto>> CreateDepartment(
        [FromBody] CreateDepartmentDto dto, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) || dto.Name.Length < 3 || dto.Name.Length > 50)
            return BadRequest(new { title = "Validation Error", status = 400, errors = new { Name = new[] { "Name must be between 3 and 50 characters." } } });

        var dept = new Department
        {
            Name = dto.Name,
            Budget = dto.Budget,
            StartDate = dto.StartDate,
            InstructorId = dto.InstructorId,
            RowVersion = Guid.NewGuid(),
        };

        context.Departments.Add(dept);
        await context.SaveChangesAsync(cancellationToken);

        await context.Entry(dept).Reference(d => d.Administrator).LoadAsync(cancellationToken);
        await context.Entry(dept).Collection(d => d.Courses).LoadAsync(cancellationToken);

        await notificationService.NotifyAsync(
            "Department", dept.DepartmentId, "Created",
            $"Department {dept.Name} was created.",
            cancellationToken);

        return CreatedAtAction(nameof(GetDepartment), new { id = dept.DepartmentId }, MapToDetail(dept));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<DepartmentDetailDto>> UpdateDepartment(
        int id, [FromBody] UpdateDepartmentDto dto, CancellationToken cancellationToken)
    {
        var dept = await context.Departments
            .Include(d => d.Administrator)
            .Include(d => d.Courses)
            .FirstOrDefaultAsync(d => d.DepartmentId == id, cancellationToken);

        if (dept is null)
            return NotFound();

        if (string.IsNullOrWhiteSpace(dto.Name) || dto.Name.Length < 3 || dto.Name.Length > 50)
            return BadRequest(new { title = "Validation Error", status = 400, errors = new { Name = new[] { "Name must be between 3 and 50 characters." } } });

        // Concurrency check: compare submitted rowVersion with current
        if (dept.RowVersion != dto.RowVersion)
        {
            return Conflict(new
            {
                title = "Concurrency Conflict",
                status = 409,
                currentValues = new
                {
                    name = dept.Name,
                    budget = dept.Budget,
                    startDate = dept.StartDate,
                    instructorId = dept.InstructorId,
                    administratorName = dept.Administrator != null
                        ? dept.Administrator.LastName + ", " + dept.Administrator.FirstMidName
                        : (string?)null,
                    rowVersion = dept.RowVersion,
                },
                submittedValues = new
                {
                    name = dto.Name,
                    budget = dto.Budget,
                    startDate = dto.StartDate,
                    instructorId = dto.InstructorId,
                    rowVersion = dto.RowVersion,
                },
            });
        }

        dept.Name = dto.Name;
        dept.Budget = dto.Budget;
        dept.StartDate = dto.StartDate;
        dept.InstructorId = dto.InstructorId;
        dept.RowVersion = Guid.NewGuid();

        try
        {
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            // Reload and return conflict
            var current = await context.Departments
                .Include(d => d.Administrator)
                .AsNoTracking()
                .FirstOrDefaultAsync(d => d.DepartmentId == id, cancellationToken);

            if (current is null)
                return NotFound();

            return Conflict(new
            {
                title = "Concurrency Conflict",
                status = 409,
                currentValues = new
                {
                    name = current.Name,
                    budget = current.Budget,
                    startDate = current.StartDate,
                    instructorId = current.InstructorId,
                    administratorName = current.Administrator != null
                        ? current.Administrator.LastName + ", " + current.Administrator.FirstMidName
                        : (string?)null,
                    rowVersion = current.RowVersion,
                },
                submittedValues = new
                {
                    name = dto.Name,
                    budget = dto.Budget,
                    startDate = dto.StartDate,
                    instructorId = dto.InstructorId,
                    rowVersion = dto.RowVersion,
                },
            });
        }

        await context.Entry(dept).Reference(d => d.Administrator).LoadAsync(cancellationToken);

        await notificationService.NotifyAsync(
            "Department", dept.DepartmentId, "Updated",
            $"Department {dept.Name} was updated.",
            cancellationToken);

        return Ok(MapToDetail(dept));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDepartment(int id, CancellationToken cancellationToken)
    {
        var dept = await context.Departments
            .Include(d => d.Courses)
            .FirstOrDefaultAsync(d => d.DepartmentId == id, cancellationToken);

        if (dept is null)
            return NotFound();

        if (dept.Courses.Count > 0)
        {
            var courseList = dept.Courses.Select(c => new { c.CourseId, c.Title }).ToList();
            return BadRequest(new
            {
                title = "Cannot Delete",
                status = 400,
                message = "Department has associated courses. Remove them first.",
                courses = courseList,
            });
        }

        var name = dept.Name;
        context.Departments.Remove(dept);
        await context.SaveChangesAsync(cancellationToken);

        await notificationService.NotifyAsync(
            "Department", id, "Deleted",
            $"Department {name} was deleted.",
            cancellationToken);

        return NoContent();
    }

    private static DepartmentDetailDto MapToDetail(Department dept) => new(
        dept.DepartmentId,
        dept.Name,
        dept.Budget,
        dept.StartDate,
        dept.InstructorId,
        dept.Administrator != null
            ? dept.Administrator.LastName + ", " + dept.Administrator.FirstMidName
            : null,
        dept.RowVersion,
        dept.Courses.Select(c => new CourseListDto(c.CourseId, c.Title, c.Credits, "")).ToList()
    );
}
