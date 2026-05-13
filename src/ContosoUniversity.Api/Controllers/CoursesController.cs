using ContosoUniversity.Api.Services;
using ContosoUniversity.Data;
using ContosoUniversity.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ContosoUniversity.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CoursesController(
    SchoolContext context,
    INotificationService notifications,
    IStorageService storageService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetCourses([FromQuery] int? departmentId, CancellationToken cancellationToken = default)
    {
        var query = context.Courses
            .AsNoTracking()
            .Include(c => c.Department)
            .AsQueryable();

        if (departmentId.HasValue)
        {
            query = query.Where(c => c.DepartmentID == departmentId.Value);
        }

        var courses = await query.OrderBy(c => c.CourseID).ToListAsync(cancellationToken);
        return Ok(courses);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetCourse(int id, CancellationToken cancellationToken = default)
    {
        var course = await context.Courses
            .AsNoTracking()
            .Include(c => c.Department)
            .Include(c => c.CourseAssignments)
            .ThenInclude(ca => ca.Instructor)
            .SingleOrDefaultAsync(c => c.CourseID == id, cancellationToken);

        return course is null ? NotFound() : Ok(course);
    }

    [HttpPost]
    public async Task<IActionResult> CreateCourse([FromBody] Course input, CancellationToken cancellationToken = default)
    {
        var course = new Course
        {
            CourseID = input.CourseID,
            Title = input.Title,
            Credits = input.Credits,
            DepartmentID = input.DepartmentID,
            TeachingMaterialImagePath = input.TeachingMaterialImagePath,
        };

        context.Courses.Add(course);
        await context.SaveChangesAsync(cancellationToken);

        await notifications.PublishAsync("Course", course.CourseID.ToString(), course.Title, EntityOperation.CREATE, cancellationToken: cancellationToken);

        return CreatedAtAction(nameof(GetCourse), new { id = course.CourseID }, course);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateCourse(int id, [FromBody] Course input, CancellationToken cancellationToken = default)
    {
        var course = await context.Courses.SingleOrDefaultAsync(c => c.CourseID == id, cancellationToken);
        if (course is null)
        {
            return NotFound();
        }

        course.Title = input.Title;
        course.Credits = input.Credits;
        course.DepartmentID = input.DepartmentID;

        await context.SaveChangesAsync(cancellationToken);

        await notifications.PublishAsync("Course", course.CourseID.ToString(), course.Title, EntityOperation.UPDATE, cancellationToken: cancellationToken);

        return Ok(course);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteCourse(int id, CancellationToken cancellationToken = default)
    {
        var course = await context.Courses.SingleOrDefaultAsync(c => c.CourseID == id, cancellationToken);
        if (course is null)
        {
            return NotFound();
        }

        var courseTitle = course.Title;
        if (!string.IsNullOrWhiteSpace(course.TeachingMaterialImagePath))
        {
            await storageService.DeleteIfExistsAsync(course.TeachingMaterialImagePath, cancellationToken);
        }

        context.Courses.Remove(course);
        await context.SaveChangesAsync(cancellationToken);

        await notifications.PublishAsync("Course", id.ToString(), courseTitle, EntityOperation.DELETE, cancellationToken: cancellationToken);

        return NoContent();
    }

    [HttpPost("{id:int}/teaching-material")]
    public async Task<IActionResult> UploadTeachingMaterial(int id, IFormFile file, CancellationToken cancellationToken = default)
    {
        var course = await context.Courses.SingleOrDefaultAsync(c => c.CourseID == id, cancellationToken);
        if (course is null)
        {
            return NotFound();
        }

        if (!string.IsNullOrWhiteSpace(course.TeachingMaterialImagePath))
        {
            await storageService.DeleteIfExistsAsync(course.TeachingMaterialImagePath, cancellationToken);
        }
        course.TeachingMaterialImagePath = await storageService.SaveAsync(file, $"course_{id}", cancellationToken);

        await context.SaveChangesAsync(cancellationToken);

        await notifications.PublishAsync("Course", id.ToString(), course.Title, EntityOperation.UPDATE, cancellationToken: cancellationToken);

        return Ok(new { course.CourseID, course.TeachingMaterialImagePath });
    }

    [HttpGet("{id:int}/teaching-material")]
    public async Task<IActionResult> DownloadTeachingMaterial(int id, CancellationToken cancellationToken = default)
    {
        var course = await context.Courses.AsNoTracking().SingleOrDefaultAsync(c => c.CourseID == id, cancellationToken);
        if (course is null)
        {
            return NotFound();
        }

        if (string.IsNullOrWhiteSpace(course.TeachingMaterialImagePath))
        {
            return NotFound();
        }

        var file = await storageService.OpenReadAsync(course.TeachingMaterialImagePath, cancellationToken);
        if (file is null)
        {
            return NotFound();
        }

        return File(file.Value.Stream, file.Value.ContentType, file.Value.FileName);
    }
}
