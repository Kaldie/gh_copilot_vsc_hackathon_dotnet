using ContosoUniversity.Api.Application.DTOs;
using ContosoUniversity.Api.Application.Interfaces;
using ContosoUniversity.Api.Domain.Entities;
using ContosoUniversity.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ContosoUniversity.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InstructorsController(
    SchoolContext context,
    INotificationService notificationService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<InstructorListDto>>> GetInstructors(CancellationToken cancellationToken)
    {
        var instructors = await context.Instructors
            .Include(i => i.OfficeAssignment)
            .OrderBy(i => i.LastName)
            .ThenBy(i => i.FirstMidName)
            .Select(i => new InstructorListDto(
                i.Id,
                i.LastName,
                i.FirstMidName,
                i.HireDate,
                i.OfficeAssignment != null ? i.OfficeAssignment.Location : null))
            .ToListAsync(cancellationToken);

        return Ok(instructors);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<InstructorDetailDto>> GetInstructor(int id, CancellationToken cancellationToken)
    {
        var instructor = await context.Instructors
            .Include(i => i.OfficeAssignment)
            .Include(i => i.CourseAssignments)
                .ThenInclude(ca => ca.Course)
                    .ThenInclude(c => c.Department)
            .FirstOrDefaultAsync(i => i.Id == id, cancellationToken);

        if (instructor is null)
            return NotFound();

        return Ok(MapToDetail(instructor));
    }

    [HttpGet("{id}/courses/{courseId}/enrollments")]
    public async Task<ActionResult<List<EnrollmentDto>>> GetCourseEnrollments(
        int id, int courseId, CancellationToken cancellationToken)
    {
        var hasAssignment = await context.CourseAssignments
            .AnyAsync(ca => ca.InstructorId == id && ca.CourseId == courseId, cancellationToken);

        if (!hasAssignment)
            return NotFound();

        var enrollments = await context.Enrollments
            .Include(e => e.Student)
            .Where(e => e.CourseId == courseId)
            .OrderBy(e => e.Student!.LastName)
            .ThenBy(e => e.Student!.FirstMidName)
            .Select(e => new EnrollmentDto(
                e.EnrollmentId,
                e.CourseId,
                e.Course!.Title,
                e.StudentId,
                e.Student!.LastName + ", " + e.Student.FirstMidName,
                e.Grade))
            .ToListAsync(cancellationToken);

        return Ok(enrollments);
    }

    [HttpPost]
    public async Task<ActionResult<InstructorDetailDto>> CreateInstructor(
        [FromBody] CreateInstructorDto dto, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.LastName) || dto.LastName.Length > 50)
            return BadRequest(new { title = "Validation Error", status = 400, errors = new { LastName = new[] { "Last name is required and must be at most 50 characters." } } });

        if (string.IsNullOrWhiteSpace(dto.FirstMidName) || dto.FirstMidName.Length > 50)
            return BadRequest(new { title = "Validation Error", status = 400, errors = new { FirstMidName = new[] { "First name is required and must be at most 50 characters." } } });

        var instructor = new Instructor
        {
            LastName = dto.LastName,
            FirstMidName = dto.FirstMidName,
            HireDate = dto.HireDate,
        };

        if (!string.IsNullOrWhiteSpace(dto.OfficeLocation))
        {
            instructor.OfficeAssignment = new OfficeAssignment
            {
                Location = dto.OfficeLocation,
            };
        }

        if (dto.CourseIds is { Count: > 0 })
        {
            foreach (var courseId in dto.CourseIds)
            {
                instructor.CourseAssignments.Add(new CourseAssignment { CourseId = courseId });
            }
        }

        context.Instructors.Add(instructor);
        await context.SaveChangesAsync(cancellationToken);

        // Reload navigation properties
        await context.Entry(instructor).Reference(i => i.OfficeAssignment).LoadAsync(cancellationToken);
        await context.Entry(instructor).Collection(i => i.CourseAssignments).LoadAsync(cancellationToken);
        foreach (var ca in instructor.CourseAssignments)
        {
            await context.Entry(ca).Reference(c => c.Course).LoadAsync(cancellationToken);
            await context.Entry(ca.Course!).Reference(c => c.Department).LoadAsync(cancellationToken);
        }

        await notificationService.NotifyAsync(
            "Instructor", instructor.Id, "Created",
            $"Instructor {instructor.FirstMidName} {instructor.LastName} was created.",
            cancellationToken);

        return CreatedAtAction(nameof(GetInstructor), new { id = instructor.Id }, MapToDetail(instructor));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<InstructorDetailDto>> UpdateInstructor(
        int id, [FromBody] UpdateInstructorDto dto, CancellationToken cancellationToken)
    {
        var instructor = await context.Instructors
            .Include(i => i.OfficeAssignment)
            .Include(i => i.CourseAssignments)
                .ThenInclude(ca => ca.Course)
                    .ThenInclude(c => c.Department)
            .FirstOrDefaultAsync(i => i.Id == id, cancellationToken);

        if (instructor is null)
            return NotFound();

        if (string.IsNullOrWhiteSpace(dto.LastName) || dto.LastName.Length > 50)
            return BadRequest(new { title = "Validation Error", status = 400, errors = new { LastName = new[] { "Last name is required and must be at most 50 characters." } } });

        if (string.IsNullOrWhiteSpace(dto.FirstMidName) || dto.FirstMidName.Length > 50)
            return BadRequest(new { title = "Validation Error", status = 400, errors = new { FirstMidName = new[] { "First name is required and must be at most 50 characters." } } });

        instructor.LastName = dto.LastName;
        instructor.FirstMidName = dto.FirstMidName;
        instructor.HireDate = dto.HireDate;

        // Update office assignment
        if (string.IsNullOrWhiteSpace(dto.OfficeLocation))
        {
            if (instructor.OfficeAssignment is not null)
            {
                context.OfficeAssignments.Remove(instructor.OfficeAssignment);
                instructor.OfficeAssignment = null;
            }
        }
        else
        {
            if (instructor.OfficeAssignment is null)
            {
                instructor.OfficeAssignment = new OfficeAssignment { Location = dto.OfficeLocation };
            }
            else
            {
                instructor.OfficeAssignment.Location = dto.OfficeLocation;
            }
        }

        // Diff course assignments
        var requestedCourseIds = dto.CourseIds ?? [];
        var currentCourseIds = instructor.CourseAssignments.Select(ca => ca.CourseId).ToHashSet();

        var toRemove = instructor.CourseAssignments
            .Where(ca => !requestedCourseIds.Contains(ca.CourseId))
            .ToList();
        foreach (var ca in toRemove)
            context.CourseAssignments.Remove(ca);

        var toAdd = requestedCourseIds.Where(cid => !currentCourseIds.Contains(cid));
        foreach (var courseId in toAdd)
            instructor.CourseAssignments.Add(new CourseAssignment { CourseId = courseId });

        await context.SaveChangesAsync(cancellationToken);

        // Reload for response
        await context.Entry(instructor).Collection(i => i.CourseAssignments).LoadAsync(cancellationToken);
        foreach (var ca in instructor.CourseAssignments)
        {
            await context.Entry(ca).Reference(c => c.Course).LoadAsync(cancellationToken);
            await context.Entry(ca.Course!).Reference(c => c.Department).LoadAsync(cancellationToken);
        }

        await notificationService.NotifyAsync(
            "Instructor", instructor.Id, "Updated",
            $"Instructor {instructor.FirstMidName} {instructor.LastName} was updated.",
            cancellationToken);

        return Ok(MapToDetail(instructor));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteInstructor(int id, CancellationToken cancellationToken)
    {
        var instructor = await context.Instructors
            .Include(i => i.OfficeAssignment)
            .Include(i => i.CourseAssignments)
            .FirstOrDefaultAsync(i => i.Id == id, cancellationToken);

        if (instructor is null)
            return NotFound();

        var name = $"{instructor.FirstMidName} {instructor.LastName}";

        // Null out any department administrator references
        var departments = await context.Departments
            .Where(d => d.InstructorId == id)
            .ToListAsync(cancellationToken);
        foreach (var dept in departments)
            dept.InstructorId = null;

        context.Instructors.Remove(instructor);
        await context.SaveChangesAsync(cancellationToken);

        await notificationService.NotifyAsync(
            "Instructor", id, "Deleted",
            $"Instructor {name} was deleted.",
            cancellationToken);

        return NoContent();
    }

    [HttpPost("{id}/courses")]
    public async Task<ActionResult<InstructorDetailDto>> AssignCourse(
        int id, [FromBody] AssignCourseDto dto, CancellationToken cancellationToken)
    {
        var instructor = await context.Instructors
            .Include(i => i.OfficeAssignment)
            .Include(i => i.CourseAssignments)
                .ThenInclude(ca => ca.Course)
                    .ThenInclude(c => c.Department)
            .FirstOrDefaultAsync(i => i.Id == id, cancellationToken);

        if (instructor is null)
            return NotFound();

        if (instructor.CourseAssignments.Any(ca => ca.CourseId == dto.CourseId))
            return BadRequest(new { title = "Validation Error", status = 400, errors = new { CourseId = new[] { "Course is already assigned." } } });

        var courseExists = await context.Courses.AnyAsync(c => c.CourseId == dto.CourseId, cancellationToken);
        if (!courseExists)
            return BadRequest(new { title = "Validation Error", status = 400, errors = new { CourseId = new[] { "Course not found." } } });

        instructor.CourseAssignments.Add(new CourseAssignment { CourseId = dto.CourseId });
        await context.SaveChangesAsync(cancellationToken);

        // Reload for response
        await context.Entry(instructor).Collection(i => i.CourseAssignments).LoadAsync(cancellationToken);
        foreach (var ca in instructor.CourseAssignments)
        {
            await context.Entry(ca).Reference(c => c.Course).LoadAsync(cancellationToken);
            await context.Entry(ca.Course!).Reference(c => c.Department).LoadAsync(cancellationToken);
        }

        return Ok(MapToDetail(instructor));
    }

    [HttpDelete("{id}/courses/{courseId}")]
    public async Task<ActionResult<InstructorDetailDto>> UnassignCourse(
        int id, int courseId, CancellationToken cancellationToken)
    {
        var instructor = await context.Instructors
            .Include(i => i.OfficeAssignment)
            .Include(i => i.CourseAssignments)
                .ThenInclude(ca => ca.Course)
                    .ThenInclude(c => c.Department)
            .FirstOrDefaultAsync(i => i.Id == id, cancellationToken);

        if (instructor is null)
            return NotFound();

        var assignment = instructor.CourseAssignments.FirstOrDefault(ca => ca.CourseId == courseId);
        if (assignment is null)
            return NotFound();

        context.CourseAssignments.Remove(assignment);
        await context.SaveChangesAsync(cancellationToken);

        return Ok(MapToDetail(instructor));
    }

    private static InstructorDetailDto MapToDetail(Instructor instructor) => new(
        instructor.Id,
        instructor.LastName,
        instructor.FirstMidName,
        instructor.HireDate,
        instructor.OfficeAssignment?.Location,
        instructor.CourseAssignments
            .Select(ca => new CourseListDto(
                ca.CourseId,
                ca.Course?.Title ?? "",
                ca.Course?.Credits ?? 0,
                ca.Course?.Department?.Name ?? ""))
            .ToList()
    );
}
