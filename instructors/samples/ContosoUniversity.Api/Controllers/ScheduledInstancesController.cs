using ContosoUniversity.Api.Application.DTOs;
using ContosoUniversity.Api.Domain.Entities;
using ContosoUniversity.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ContosoUniversity.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ScheduledInstancesController(SchoolContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ScheduledInstanceDto>>> GetAll(
        [FromQuery] int? studentId,
        [FromQuery] int? instructorId,
        CancellationToken cancellationToken)
    {
        if (studentId.HasValue && instructorId.HasValue)
            return BadRequest(new { title = "Validation Error", status = 400, errors = new { Filter = new[] { "Cannot filter by both studentId and instructorId." } } });

        var query = context.ScheduledInstances
            .Include(si => si.Course)
            .ThenInclude(c => c.Department)
            .AsQueryable();

        if (studentId.HasValue)
        {
            var enrolledCourseIds = context.Enrollments
                .Where(e => e.StudentId == studentId.Value)
                .Select(e => e.CourseId);
            query = query.Where(si => enrolledCourseIds.Contains(si.CourseId));
        }

        if (instructorId.HasValue)
        {
            var assignedCourseIds = context.CourseAssignments
                .Where(ca => ca.InstructorId == instructorId.Value)
                .Select(ca => ca.CourseId);
            query = query.Where(si => assignedCourseIds.Contains(si.CourseId));
        }

        var items = await query
            .OrderBy(si => si.DayOfWeek)
            .ThenBy(si => si.StartTime)
            .Select(si => new ScheduledInstanceDto(
                si.ScheduledInstanceId,
                si.CourseId,
                si.Course.Title,
                si.Course.DepartmentId,
                si.Course.Department.Name,
                si.Course.Department.Color,
                si.DayOfWeek,
                si.StartTime,
                si.DurationMinutes))
            .ToListAsync(cancellationToken);

        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ScheduledInstanceDto>> GetById(int id, CancellationToken cancellationToken)
    {
        var si = await context.ScheduledInstances
            .Include(s => s.Course)
            .ThenInclude(c => c.Department)
            .FirstOrDefaultAsync(s => s.ScheduledInstanceId == id, cancellationToken);

        if (si is null) return NotFound();

        return Ok(new ScheduledInstanceDto(
            si.ScheduledInstanceId,
            si.CourseId,
            si.Course.Title,
            si.Course.DepartmentId,
            si.Course.Department.Name,
            si.Course.Department.Color,
            si.DayOfWeek,
            si.StartTime,
            si.DurationMinutes));
    }

    [HttpPost]
    public async Task<ActionResult<ScheduledInstanceDto>> Create(
        [FromBody] CreateScheduledInstanceDto dto, CancellationToken cancellationToken)
    {
        var course = await context.Courses
            .Include(c => c.Department)
            .FirstOrDefaultAsync(c => c.CourseId == dto.CourseId, cancellationToken);

        if (course is null)
            return BadRequest(new { title = "Validation Error", status = 400, errors = new { CourseId = new[] { "Course not found." } } });

        if (dto.DayOfWeek < DayOfWeek.Monday || dto.DayOfWeek > DayOfWeek.Friday)
            return BadRequest(new { title = "Validation Error", status = 400, errors = new { DayOfWeek = new[] { "Day must be Monday through Friday." } } });

        var startHour = dto.StartTime.Hour + dto.StartTime.Minute / 60.0;
        if (startHour < 7 || startHour > 20)
            return BadRequest(new { title = "Validation Error", status = 400, errors = new { StartTime = new[] { "Start time must be between 07:00 and 20:00." } } });

        var duplicate = await context.ScheduledInstances
            .AnyAsync(si => si.CourseId == dto.CourseId && si.DayOfWeek == dto.DayOfWeek && si.StartTime == dto.StartTime, cancellationToken);

        if (duplicate)
            return Conflict(new { title = "Duplicate Entry", status = 409, errors = new { Schedule = new[] { "This course is already scheduled at this time." } } });

        var entity = new ScheduledInstance
        {
            CourseId = dto.CourseId,
            DayOfWeek = dto.DayOfWeek,
            StartTime = dto.StartTime,
            DurationMinutes = dto.DurationMinutes,
        };

        context.ScheduledInstances.Add(entity);
        await context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = entity.ScheduledInstanceId }, new ScheduledInstanceDto(
            entity.ScheduledInstanceId,
            entity.CourseId,
            course.Title,
            course.DepartmentId,
            course.Department.Name,
            course.Department.Color,
            entity.DayOfWeek,
            entity.StartTime,
            entity.DurationMinutes));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ScheduledInstanceDto>> Update(
        int id, [FromBody] UpdateScheduledInstanceDto dto, CancellationToken cancellationToken)
    {
        var entity = await context.ScheduledInstances
            .Include(si => si.Course)
            .ThenInclude(c => c.Department)
            .FirstOrDefaultAsync(si => si.ScheduledInstanceId == id, cancellationToken);

        if (entity is null) return NotFound();

        if (dto.DayOfWeek < DayOfWeek.Monday || dto.DayOfWeek > DayOfWeek.Friday)
            return BadRequest(new { title = "Validation Error", status = 400, errors = new { DayOfWeek = new[] { "Day must be Monday through Friday." } } });

        var startHour = dto.StartTime.Hour + dto.StartTime.Minute / 60.0;
        if (startHour < 7 || startHour > 20)
            return BadRequest(new { title = "Validation Error", status = 400, errors = new { StartTime = new[] { "Start time must be between 07:00 and 20:00." } } });

        var duplicate = await context.ScheduledInstances
            .AnyAsync(si => si.CourseId == entity.CourseId && si.DayOfWeek == dto.DayOfWeek && si.StartTime == dto.StartTime && si.ScheduledInstanceId != id, cancellationToken);

        if (duplicate)
            return Conflict(new { title = "Duplicate Entry", status = 409, errors = new { Schedule = new[] { "This course is already scheduled at this time." } } });

        entity.DayOfWeek = dto.DayOfWeek;
        entity.StartTime = dto.StartTime;
        entity.DurationMinutes = dto.DurationMinutes;

        await context.SaveChangesAsync(cancellationToken);

        return Ok(new ScheduledInstanceDto(
            entity.ScheduledInstanceId,
            entity.CourseId,
            entity.Course.Title,
            entity.Course.DepartmentId,
            entity.Course.Department.Name,
            entity.Course.Department.Color,
            entity.DayOfWeek,
            entity.StartTime,
            entity.DurationMinutes));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var entity = await context.ScheduledInstances
            .FirstOrDefaultAsync(si => si.ScheduledInstanceId == id, cancellationToken);

        if (entity is null) return NotFound();

        context.ScheduledInstances.Remove(entity);
        await context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpGet("conflicts")]
    public async Task<ActionResult<List<ConflictDto>>> GetConflicts(
        [FromQuery] int instructorId, CancellationToken cancellationToken)
    {
        var assignedCourseIds = await context.CourseAssignments
            .Where(ca => ca.InstructorId == instructorId)
            .Select(ca => ca.CourseId)
            .ToListAsync(cancellationToken);

        var instances = await context.ScheduledInstances
            .Where(si => assignedCourseIds.Contains(si.CourseId))
            .Include(si => si.Course)
            .ThenInclude(c => c.Department)
            .OrderBy(si => si.DayOfWeek)
            .ThenBy(si => si.StartTime)
            .ToListAsync(cancellationToken);

        var conflicts = new List<ConflictDto>();
        for (var i = 0; i < instances.Count; i++)
        {
            for (var j = i + 1; j < instances.Count; j++)
            {
                var a = instances[i];
                var b = instances[j];
                if (a.DayOfWeek != b.DayOfWeek || a.CourseId == b.CourseId)
                    continue;

                var aEnd = a.StartTime.AddMinutes(a.DurationMinutes);
                var bEnd = b.StartTime.AddMinutes(b.DurationMinutes);
                if (a.StartTime < bEnd && b.StartTime < aEnd)
                {
                    conflicts.Add(new ConflictDto(MapToDto(a), MapToDto(b)));
                }
            }
        }

        return Ok(conflicts);
    }

    private static ScheduledInstanceDto MapToDto(ScheduledInstance si) => new(
        si.ScheduledInstanceId,
        si.CourseId,
        si.Course.Title,
        si.Course.DepartmentId,
        si.Course.Department.Name,
        si.Course.Department.Color,
        si.DayOfWeek,
        si.StartTime,
        si.DurationMinutes);
}
