using ContosoUniversity.Api.Services;
using ContosoUniversity.Data;
using ContosoUniversity.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ContosoUniversity.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InstructorsController(SchoolContext context, INotificationService notifications) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetInstructors([FromQuery] int? id, [FromQuery] int? courseId, CancellationToken cancellationToken = default)
    {
        var instructors = await context.Instructors
            .AsNoTracking()
            .Include(i => i.OfficeAssignment)
            .Include(i => i.CourseAssignments)
            .ThenInclude(ca => ca.Course!)
            .ThenInclude(c => c.Department)
            .OrderBy(i => i.LastName)
            .ToListAsync(cancellationToken);

        var selectedCourses = id.HasValue
            ? instructors
                .Where(i => i.ID == id.Value)
                .SelectMany(i => i.CourseAssignments)
                .Where(ca => ca.Course is not null)
                .Select(ca => MapCourse(ca.Course!))
                .ToList()
            : [];

        var selectedEnrollments = courseId.HasValue
            ? await context.Enrollments
                .AsNoTracking()
                .Include(e => e.Student)
                .Where(e => e.CourseID == courseId.Value)
                .Select(e => new EnrollmentSummaryDto(
                    e.EnrollmentID,
                    e.Student != null ? new StudentSummaryDto(e.Student.FirstMidName, e.Student.LastName) : null,
                    e.CourseID,
                    e.Grade.HasValue ? e.Grade.Value.ToString() : null))
                .ToListAsync(cancellationToken)
            : [];

        return Ok(new
        {
            instructors = instructors.Select(MapInstructor).ToList(),
            selectedInstructorId = id,
            courses = selectedCourses,
            selectedCourseId = courseId,
            enrollments = selectedEnrollments,
        });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetInstructor(int id, CancellationToken cancellationToken = default)
    {
        var instructor = await context.Instructors
            .AsNoTracking()
            .Include(i => i.OfficeAssignment)
            .Include(i => i.CourseAssignments)
            .ThenInclude(ca => ca.Course)
            .ThenInclude(c => c!.Department)
            .SingleOrDefaultAsync(i => i.ID == id, cancellationToken);

        return instructor is null ? NotFound() : Ok(MapInstructor(instructor));
    }

    [HttpPost]
    public async Task<IActionResult> CreateInstructor([FromBody] CreateInstructorRequest input, CancellationToken cancellationToken = default)
    {
        if (!TryValidateInstructorInput(input.FirstMidName, input.LastName, input.HireDate))
        {
            return ValidationProblem(ModelState);
        }

        var instructor = new Instructor
        {
            FirstMidName = input.FirstMidName,
            LastName = input.LastName,
            HireDate = input.HireDate,
            OfficeAssignment = string.IsNullOrWhiteSpace(input.OfficeLocation)
                ? null
                : new OfficeAssignment { Location = input.OfficeLocation },
            CourseAssignments = input.CourseIds.Distinct().Select(courseId => new CourseAssignment { CourseID = courseId }).ToList(),
        };

        context.Instructors.Add(instructor);
        await context.SaveChangesAsync(cancellationToken);

        await context.Entry(instructor).Reference(i => i.OfficeAssignment).LoadAsync(cancellationToken);
        await context.Entry(instructor).Collection(i => i.CourseAssignments).LoadAsync(cancellationToken);
        foreach (var assignment in instructor.CourseAssignments)
        {
            await context.Entry(assignment).Reference(ca => ca.Course).LoadAsync(cancellationToken);
            if (assignment.Course is not null)
            {
                await context.Entry(assignment.Course).Reference(c => c.Department).LoadAsync(cancellationToken);
            }
        }

        await notifications.PublishAsync("Instructor", instructor.ID.ToString(), $"{instructor.FirstMidName} {instructor.LastName}", EntityOperation.CREATE, cancellationToken: cancellationToken);

        return CreatedAtAction(nameof(GetInstructor), new { id = instructor.ID }, MapInstructor(instructor));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateInstructor(int id, [FromBody] UpdateInstructorRequest input, CancellationToken cancellationToken = default)
    {
        if (!TryValidateInstructorInput(input.FirstMidName, input.LastName, input.HireDate))
        {
            return ValidationProblem(ModelState);
        }

        var instructor = await context.Instructors
            .Include(i => i.OfficeAssignment)
            .Include(i => i.CourseAssignments)
            .SingleOrDefaultAsync(i => i.ID == id, cancellationToken);

        if (instructor is null)
        {
            return NotFound();
        }

        instructor.FirstMidName = input.FirstMidName;
        instructor.LastName = input.LastName;
        instructor.HireDate = input.HireDate;

        if (string.IsNullOrWhiteSpace(input.OfficeLocation))
        {
            if (instructor.OfficeAssignment is not null)
            {
                context.OfficeAssignments.Remove(instructor.OfficeAssignment);
            }

            instructor.OfficeAssignment = null;
        }
        else if (instructor.OfficeAssignment is null)
        {
            instructor.OfficeAssignment = new OfficeAssignment { InstructorID = id, Location = input.OfficeLocation };
        }
        else
        {
            instructor.OfficeAssignment.Location = input.OfficeLocation;
        }

        var selected = input.CourseIds.Distinct().ToHashSet();
        var toRemove = instructor.CourseAssignments.Where(ca => !selected.Contains(ca.CourseID)).ToList();
        foreach (var assignment in toRemove)
        {
            instructor.CourseAssignments.Remove(assignment);
        }

        var existing = instructor.CourseAssignments.Select(ca => ca.CourseID).ToHashSet();
        foreach (var courseId in selected.Where(courseId => !existing.Contains(courseId)))
        {
            instructor.CourseAssignments.Add(new CourseAssignment { InstructorID = id, CourseID = courseId });
        }

        await context.SaveChangesAsync(cancellationToken);

        await context.Entry(instructor).Reference(i => i.OfficeAssignment).LoadAsync(cancellationToken);
        await context.Entry(instructor).Collection(i => i.CourseAssignments).LoadAsync(cancellationToken);
        foreach (var assignment in instructor.CourseAssignments)
        {
            await context.Entry(assignment).Reference(ca => ca.Course).LoadAsync(cancellationToken);
            if (assignment.Course is not null)
            {
                await context.Entry(assignment.Course).Reference(c => c.Department).LoadAsync(cancellationToken);
            }
        }

        await notifications.PublishAsync("Instructor", instructor.ID.ToString(), $"{instructor.FirstMidName} {instructor.LastName}", EntityOperation.UPDATE, cancellationToken: cancellationToken);

        return Ok(MapInstructor(instructor));
    }

    [HttpPut("{id:int}/courses")]
    public async Task<IActionResult> AssignCourses(int id, [FromBody] int[] courseIds, CancellationToken cancellationToken = default)
    {
        var instructor = await context.Instructors
            .Include(i => i.CourseAssignments)
            .SingleOrDefaultAsync(i => i.ID == id, cancellationToken);

        if (instructor is null)
        {
            return NotFound();
        }

        var selected = courseIds.ToHashSet();
        var toRemove = instructor.CourseAssignments.Where(ca => !selected.Contains(ca.CourseID)).ToList();
        foreach (var assignment in toRemove)
        {
            instructor.CourseAssignments.Remove(assignment);
        }

        var existing = instructor.CourseAssignments.Select(ca => ca.CourseID).ToHashSet();
        foreach (var courseId in selected.Where(courseId => !existing.Contains(courseId)))
        {
            instructor.CourseAssignments.Add(new CourseAssignment { InstructorID = id, CourseID = courseId });
        }

        await context.SaveChangesAsync(cancellationToken);

        await notifications.PublishAsync("Instructor", instructor.ID.ToString(), $"{instructor.FirstMidName} {instructor.LastName}", EntityOperation.UPDATE, cancellationToken: cancellationToken);

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteInstructor(int id, CancellationToken cancellationToken = default)
    {
        var instructor = await context.Instructors
            .Include(i => i.OfficeAssignment)
            .SingleOrDefaultAsync(i => i.ID == id, cancellationToken);

        if (instructor is null)
        {
            return NotFound();
        }

        var relatedDepartment = await context.Departments.SingleOrDefaultAsync(d => d.InstructorID == id, cancellationToken);
        if (relatedDepartment is not null)
        {
            relatedDepartment.InstructorID = null;
        }

        context.Instructors.Remove(instructor);
        await context.SaveChangesAsync(cancellationToken);

        await notifications.PublishAsync("Instructor", id.ToString(), $"{instructor.FirstMidName} {instructor.LastName}", EntityOperation.DELETE, cancellationToken: cancellationToken);

        return NoContent();
    }

    public sealed record CreateInstructorRequest(string FirstMidName, string LastName, DateTime HireDate, string? OfficeLocation, List<int> CourseIds);
    public sealed record UpdateInstructorRequest(string FirstMidName, string LastName, DateTime HireDate, string? OfficeLocation, List<int> CourseIds);

    private static InstructorDto MapInstructor(Instructor instructor) => new(
        instructor.ID,
        instructor.FirstMidName,
        instructor.LastName,
        instructor.FullName,
        instructor.HireDate,
        instructor.OfficeAssignment is null ? null : new OfficeAssignmentDto(instructor.OfficeAssignment.InstructorID, instructor.OfficeAssignment.Location),
        instructor.CourseAssignments.Select(ca => new CourseAssignmentDto(ca.InstructorID, ca.CourseID, ca.Course is null ? null : MapCourse(ca.Course))).ToList());

    private static CourseDto MapCourse(Course course) => new(
        course.CourseID,
        course.Title,
        course.Credits,
        course.DepartmentID,
        course.TeachingMaterialImagePath,
        course.Department is null ? null : new DepartmentSummaryDto(course.Department.DepartmentID, course.Department.Name));

    public sealed record InstructorDto(int Id, string FirstMidName, string LastName, string FullName, DateTime HireDate, OfficeAssignmentDto? OfficeAssignment, List<CourseAssignmentDto> CourseAssignments);
    public sealed record OfficeAssignmentDto(int InstructorID, string Location);
    public sealed record CourseAssignmentDto(int InstructorID, int CourseID, CourseDto? Course);
    public sealed record CourseDto(int CourseID, string Title, int Credits, int DepartmentID, string? TeachingMaterialImagePath, DepartmentSummaryDto? Department);
    public sealed record DepartmentSummaryDto(int DepartmentID, string Name);
    public sealed record StudentSummaryDto(string FirstMidName, string LastName);
    public sealed record EnrollmentSummaryDto(int EnrollmentID, StudentSummaryDto? Student, int CourseID, string? Grade);

    private bool TryValidateInstructorInput(string firstMidName, string lastName, DateTime hireDate)
    {
        if (string.IsNullOrWhiteSpace(firstMidName))
        {
            ModelState.AddModelError(nameof(CreateInstructorRequest.FirstMidName), "First name is required.");
        }

        if (string.IsNullOrWhiteSpace(lastName))
        {
            ModelState.AddModelError(nameof(CreateInstructorRequest.LastName), "Last name is required.");
        }

        if (hireDate == default || hireDate < new DateTime(1753, 1, 1) || hireDate > new DateTime(9999, 12, 31))
        {
            ModelState.AddModelError(nameof(CreateInstructorRequest.HireDate), "Hire date must be between 1753 and 9999.");
        }

        return ModelState.IsValid;
    }
}
