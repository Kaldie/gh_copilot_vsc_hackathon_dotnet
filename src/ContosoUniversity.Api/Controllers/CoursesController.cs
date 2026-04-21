using ContosoUniversity.Api.Application.DTOs;
using ContosoUniversity.Api.Application.Interfaces;
using ContosoUniversity.Api.Domain.Entities;
using ContosoUniversity.Api.Infrastructure.Data;
using ContosoUniversity.Api.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ContosoUniversity.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CoursesController(
    SchoolContext context,
    IStorageService storageService,
    INotificationService notificationService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<CourseListDto>>> GetCourses(CancellationToken cancellationToken)
    {
        var courses = await context.Courses
            .Include(c => c.Department)
            .OrderBy(c => c.CourseId)
            .Select(c => new CourseListDto(
                c.CourseId,
                c.Title,
                c.Credits,
                c.Department!.Name))
            .ToListAsync(cancellationToken);

        return Ok(courses);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CourseDetailDto>> GetCourse(int id, CancellationToken cancellationToken)
    {
        var course = await context.Courses
            .Include(c => c.Department)
            .FirstOrDefaultAsync(c => c.CourseId == id, cancellationToken);

        if (course is null)
            return NotFound();

        return Ok(MapToDetail(course));
    }

    [HttpPost]
    public async Task<ActionResult<CourseDetailDto>> CreateCourse(
        [FromForm] int courseId,
        [FromForm] string title,
        [FromForm] int credits,
        [FromForm] int departmentId,
        IFormFile? image,
        CancellationToken cancellationToken)
    {
        var exists = await context.Courses.AnyAsync(c => c.CourseId == courseId, cancellationToken);
        if (exists)
            return BadRequest(new { title = "Validation Error", status = 400, errors = new { CourseId = new[] { "A course with this ID already exists." } } });

        if (title.Length < 3 || title.Length > 50)
            return BadRequest(new { title = "Validation Error", status = 400, errors = new { Title = new[] { "Title must be between 3 and 50 characters." } } });

        if (credits < 0 || credits > 5)
            return BadRequest(new { title = "Validation Error", status = 400, errors = new { Credits = new[] { "Credits must be between 0 and 5." } } });

        string? imagePath = null;
        if (image is not null)
        {
            var (valid, error) = ValidateImage(image);
            if (!valid)
                return BadRequest(new { title = "Validation Error", status = 400, errors = new { Image = new[] { error } } });

            using var stream = image.OpenReadStream();
            imagePath = await storageService.SaveAsync(stream, image.FileName, cancellationToken);
        }

        var course = new Course
        {
            CourseId = courseId,
            Title = title,
            Credits = credits,
            DepartmentId = departmentId,
            ImagePath = imagePath,
        };

        context.Courses.Add(course);
        await context.SaveChangesAsync(cancellationToken);

        await context.Entry(course).Reference(c => c.Department).LoadAsync(cancellationToken);

        await notificationService.NotifyAsync(
            "Course", course.CourseId, "Created",
            $"Course {course.Title} was created.",
            cancellationToken);

        return CreatedAtAction(nameof(GetCourse), new { id = course.CourseId }, MapToDetail(course));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CourseDetailDto>> UpdateCourse(
        int id,
        [FromForm] string title,
        [FromForm] int credits,
        [FromForm] int departmentId,
        IFormFile? image,
        CancellationToken cancellationToken)
    {
        var course = await context.Courses
            .Include(c => c.Department)
            .FirstOrDefaultAsync(c => c.CourseId == id, cancellationToken);

        if (course is null)
            return NotFound();

        if (title.Length < 3 || title.Length > 50)
            return BadRequest(new { title = "Validation Error", status = 400, errors = new { Title = new[] { "Title must be between 3 and 50 characters." } } });

        if (credits < 0 || credits > 5)
            return BadRequest(new { title = "Validation Error", status = 400, errors = new { Credits = new[] { "Credits must be between 0 and 5." } } });

        if (image is not null)
        {
            var (valid, error) = ValidateImage(image);
            if (!valid)
                return BadRequest(new { title = "Validation Error", status = 400, errors = new { Image = new[] { error } } });

            // Delete old image
            if (course.ImagePath is not null)
                await storageService.DeleteAsync(course.ImagePath, cancellationToken);

            using var stream = image.OpenReadStream();
            course.ImagePath = await storageService.SaveAsync(stream, image.FileName, cancellationToken);
        }

        course.Title = title;
        course.Credits = credits;
        course.DepartmentId = departmentId;

        await context.SaveChangesAsync(cancellationToken);

        await notificationService.NotifyAsync(
            "Course", course.CourseId, "Updated",
            $"Course {course.Title} was updated.",
            cancellationToken);

        return Ok(MapToDetail(course));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCourse(int id, CancellationToken cancellationToken)
    {
        var course = await context.Courses
            .FirstOrDefaultAsync(c => c.CourseId == id, cancellationToken);

        if (course is null)
            return NotFound();

        if (course.ImagePath is not null)
            await storageService.DeleteAsync(course.ImagePath, cancellationToken);

        var title = course.Title;
        context.Courses.Remove(course);
        await context.SaveChangesAsync(cancellationToken);

        await notificationService.NotifyAsync(
            "Course", id, "Deleted",
            $"Course {title} was deleted.",
            cancellationToken);

        return NoContent();
    }

    [HttpGet("{id}/image")]
    public async Task<IActionResult> GetImage(int id, CancellationToken cancellationToken)
    {
        var course = await context.Courses
            .FirstOrDefaultAsync(c => c.CourseId == id, cancellationToken);

        if (course?.ImagePath is null)
            return NotFound();

        var stream = await storageService.GetStreamAsync(course.ImagePath, cancellationToken);
        if (stream is null)
            return NotFound();

        var ext = Path.GetExtension(course.ImagePath).ToLowerInvariant();
        var contentType = ext switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".bmp" => "image/bmp",
            _ => "application/octet-stream",
        };

        return File(stream, contentType);
    }

    private static (bool Valid, string? Error) ValidateImage(IFormFile file)
    {
        if (!LocalStorageService.IsValidContentType(file.ContentType))
            return (false, "Only image files (jpg, jpeg, png, gif, bmp) are allowed.");

        if (!LocalStorageService.IsValidExtension(file.FileName))
            return (false, "Only image files (jpg, jpeg, png, gif, bmp) are allowed.");

        if (!LocalStorageService.IsValidSize(file.Length))
            return (false, "File size must not exceed 5 MB.");

        return (true, null);
    }

    private static CourseDetailDto MapToDetail(Course course) => new(
        course.CourseId,
        course.Title,
        course.Credits,
        course.DepartmentId,
        course.Department?.Name ?? "",
        course.ImagePath is not null ? $"/api/courses/{course.CourseId}/image" : null
    );
}
