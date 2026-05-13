using ContosoUniversity.Api.Services;
using ContosoUniversity.Data;
using ContosoUniversity.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ContosoUniversity.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EnrollmentsController(SchoolContext context, INotificationService notifications) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetEnrollments(
        [FromQuery] int? studentId,
        [FromQuery] int? courseId,
        CancellationToken cancellationToken = default)
    {
        var query = context.Enrollments
            .AsNoTracking()
            .Include(e => e.Student)
            .Include(e => e.Course)
            .AsQueryable();

        if (studentId.HasValue)
        {
            query = query.Where(e => e.StudentID == studentId.Value);
        }

        if (courseId.HasValue)
        {
            query = query.Where(e => e.CourseID == courseId.Value);
        }

        var items = await query
            .OrderBy(e => e.EnrollmentID)
            .Select(e => new EnrollmentDto(
                e.EnrollmentID,
                e.StudentID,
                e.Student != null ? $"{e.Student.FirstMidName} {e.Student.LastName}" : $"Student {e.StudentID}",
                e.CourseID,
                e.Course != null ? e.Course.Title : $"Course {e.CourseID}",
                e.Grade.HasValue ? e.Grade.Value.ToString() : null))
            .ToListAsync(cancellationToken);

        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> CreateEnrollment([FromBody] UpsertEnrollmentRequest input, CancellationToken cancellationToken = default)
    {
        var student = await context.Students
            .AsNoTracking()
            .SingleOrDefaultAsync(s => s.ID == input.StudentID, cancellationToken);

        if (student is null)
        {
            return BadRequest(new { message = $"Student {input.StudentID} not found." });
        }

        var course = await context.Courses
            .AsNoTracking()
            .SingleOrDefaultAsync(c => c.CourseID == input.CourseID, cancellationToken);

        if (course is null)
        {
            return BadRequest(new { message = $"Course {input.CourseID} not found." });
        }

        var alreadyExists = await context.Enrollments.AnyAsync(
            e => e.StudentID == input.StudentID && e.CourseID == input.CourseID,
            cancellationToken);

        if (alreadyExists)
        {
            return Conflict(new { message = "Student is already enrolled in this course." });
        }

        Grade? parsedGrade;
        try
        {
            parsedGrade = ParseGrade(input.Grade);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }

        var enrollment = new Enrollment
        {
            StudentID = input.StudentID,
            CourseID = input.CourseID,
            Grade = parsedGrade,
        };

        context.Enrollments.Add(enrollment);
        await context.SaveChangesAsync(cancellationToken);

        await notifications.PublishAsync(
            "Enrollment",
            enrollment.EnrollmentID.ToString(),
            $"{student.FirstMidName} {student.LastName} -> {course.Title}",
            EntityOperation.CREATE,
            cancellationToken: cancellationToken);

        return CreatedAtAction(nameof(GetEnrollments), new { enrollmentId = enrollment.EnrollmentID }, enrollment);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateEnrollment(int id, [FromBody] UpsertEnrollmentRequest input, CancellationToken cancellationToken = default)
    {
        var enrollment = await context.Enrollments
            .Include(e => e.Student)
            .Include(e => e.Course)
            .SingleOrDefaultAsync(e => e.EnrollmentID == id, cancellationToken);

        if (enrollment is null)
        {
            return NotFound();
        }

        if (input.StudentID != enrollment.StudentID || input.CourseID != enrollment.CourseID)
        {
            var studentExists = await context.Students.AnyAsync(s => s.ID == input.StudentID, cancellationToken);
            var courseExists = await context.Courses.AnyAsync(c => c.CourseID == input.CourseID, cancellationToken);
            if (!studentExists || !courseExists)
            {
                return BadRequest(new { message = "Student or course was not found." });
            }

            var duplicate = await context.Enrollments.AnyAsync(
                e => e.EnrollmentID != id && e.StudentID == input.StudentID && e.CourseID == input.CourseID,
                cancellationToken);

            if (duplicate)
            {
                return Conflict(new { message = "Another enrollment already exists for this student and course." });
            }

            enrollment.StudentID = input.StudentID;
            enrollment.CourseID = input.CourseID;
        }

        try
        {
            enrollment.Grade = ParseGrade(input.Grade);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        await context.SaveChangesAsync(cancellationToken);

        await notifications.PublishAsync(
            "Enrollment",
            enrollment.EnrollmentID.ToString(),
            $"{enrollment.Student?.FirstMidName} {enrollment.Student?.LastName} -> {enrollment.Course?.Title}",
            EntityOperation.UPDATE,
            cancellationToken: cancellationToken);

        return Ok(enrollment);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteEnrollment(int id, CancellationToken cancellationToken = default)
    {
        var enrollment = await context.Enrollments
            .Include(e => e.Student)
            .Include(e => e.Course)
            .SingleOrDefaultAsync(e => e.EnrollmentID == id, cancellationToken);

        if (enrollment is null)
        {
            return NotFound();
        }

        context.Enrollments.Remove(enrollment);
        await context.SaveChangesAsync(cancellationToken);

        await notifications.PublishAsync(
            "Enrollment",
            id.ToString(),
            $"{enrollment.Student?.FirstMidName} {enrollment.Student?.LastName} -> {enrollment.Course?.Title}",
            EntityOperation.DELETE,
            cancellationToken: cancellationToken);

        return NoContent();
    }

    private static Grade? ParseGrade(string? grade)
    {
        if (string.IsNullOrWhiteSpace(grade))
        {
            return null;
        }

        return Enum.TryParse<Grade>(grade, true, out var parsed)
            ? parsed
            : throw new InvalidOperationException("Invalid grade. Use A, B, C, D, or F.");
    }

    public sealed record UpsertEnrollmentRequest(int StudentID, int CourseID, string? Grade);

    public sealed record EnrollmentDto(
        int EnrollmentID,
        int StudentID,
        string StudentName,
        int CourseID,
        string CourseTitle,
        string? Grade);
}
