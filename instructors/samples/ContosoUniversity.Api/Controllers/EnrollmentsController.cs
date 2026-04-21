using ContosoUniversity.Api.Application.DTOs;
using ContosoUniversity.Api.Domain.Entities;
using ContosoUniversity.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ContosoUniversity.Api.Controllers;

[ApiController]
[Route("api/students/{studentId}/enrollments")]
public class EnrollmentsController(SchoolContext context) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<EnrollmentDto>> CreateEnrollment(
        int studentId, CreateEnrollmentDto dto, CancellationToken cancellationToken)
    {
        var student = await context.Students
            .FirstOrDefaultAsync(s => s.Id == studentId, cancellationToken);
        if (student is null)
            return NotFound(new { title = "Student not found", status = 404 });

        var course = await context.Courses
            .FirstOrDefaultAsync(c => c.CourseId == dto.CourseId, cancellationToken);
        if (course is null)
            return NotFound(new { title = "Course not found", status = 404 });

        var exists = await context.Enrollments
            .AnyAsync(e => e.StudentId == studentId && e.CourseId == dto.CourseId, cancellationToken);
        if (exists)
            return BadRequest(new { title = "Student is already enrolled in this course", status = 400 });

        var enrollment = new Enrollment
        {
            StudentId = studentId,
            CourseId = dto.CourseId,
        };

        context.Enrollments.Add(enrollment);
        await context.SaveChangesAsync(cancellationToken);

        var result = new EnrollmentDto(
            enrollment.EnrollmentId,
            enrollment.CourseId,
            course.Title,
            enrollment.StudentId,
            student.FullName,
            enrollment.Grade);

        return CreatedAtAction(nameof(CreateEnrollment), new { studentId, enrollmentId = enrollment.EnrollmentId }, result);
    }

    [HttpPut("{enrollmentId}")]
    public async Task<ActionResult<EnrollmentDto>> UpdateEnrollmentGrade(
        int studentId, int enrollmentId, UpdateEnrollmentGradeDto dto, CancellationToken cancellationToken)
    {
        var enrollment = await context.Enrollments
            .Include(e => e.Course)
            .Include(e => e.Student)
            .FirstOrDefaultAsync(e => e.EnrollmentId == enrollmentId && e.StudentId == studentId, cancellationToken);

        if (enrollment is null)
            return NotFound();

        enrollment.Grade = dto.Grade;
        await context.SaveChangesAsync(cancellationToken);

        return Ok(new EnrollmentDto(
            enrollment.EnrollmentId,
            enrollment.CourseId,
            enrollment.Course?.Title ?? "",
            enrollment.StudentId,
            enrollment.Student?.FullName,
            enrollment.Grade));
    }

    [HttpDelete("{enrollmentId}")]
    public async Task<IActionResult> DeleteEnrollment(
        int studentId, int enrollmentId, CancellationToken cancellationToken)
    {
        var enrollment = await context.Enrollments
            .FirstOrDefaultAsync(e => e.EnrollmentId == enrollmentId && e.StudentId == studentId, cancellationToken);

        if (enrollment is null)
            return NotFound();

        context.Enrollments.Remove(enrollment);
        await context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }
}
