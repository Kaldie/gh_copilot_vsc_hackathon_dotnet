using ContosoUniversity.Api.Services;
using ContosoUniversity.Data;
using ContosoUniversity.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ContosoUniversity.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DepartmentsController(SchoolContext context, INotificationService notifications) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetDepartments(CancellationToken cancellationToken = default)
    {
        var departments = await context.Departments
            .AsNoTracking()
            .Include(d => d.Administrator)
            .OrderBy(d => d.Name)
            .ToListAsync(cancellationToken);

        return Ok(departments);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetDepartment(int id, CancellationToken cancellationToken = default)
    {
        var department = await context.Departments
            .AsNoTracking()
            .Include(d => d.Administrator)
            .SingleOrDefaultAsync(d => d.DepartmentID == id, cancellationToken);

        return department is null ? NotFound() : Ok(department);
    }

    [HttpPost]
    public async Task<IActionResult> CreateDepartment([FromBody] Department input, CancellationToken cancellationToken = default)
    {
        var department = new Department
        {
            Name = input.Name,
            Budget = input.Budget,
            StartDate = input.StartDate,
            InstructorID = input.InstructorID,
        };

        context.Departments.Add(department);
        await context.SaveChangesAsync(cancellationToken);

        await notifications.PublishAsync("Department", department.DepartmentID.ToString(), department.Name, EntityOperation.CREATE, cancellationToken: cancellationToken);

        return CreatedAtAction(nameof(GetDepartment), new { id = department.DepartmentID }, department);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateDepartment(int id, [FromBody] Department input, CancellationToken cancellationToken = default)
    {
        var department = await context.Departments.SingleOrDefaultAsync(d => d.DepartmentID == id, cancellationToken);
        if (department is null)
        {
            return NotFound();
        }

        if (input.RowVersion is null || input.RowVersion.Length == 0)
        {
            return BadRequest(new { message = "RowVersion is required for concurrency updates." });
        }

        context.Entry(department).Property(d => d.RowVersion).OriginalValue = input.RowVersion;

        department.Name = input.Name;
        department.Budget = input.Budget;
        department.StartDate = input.StartDate;
        department.InstructorID = input.InstructorID;

        try
        {
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            var currentValues = await context.Departments
                .AsNoTracking()
                .Include(d => d.Administrator)
                .SingleOrDefaultAsync(d => d.DepartmentID == id, cancellationToken);

            return Conflict(new
            {
                message = "Department was modified by another user.",
                currentValues,
            });
        }

        await notifications.PublishAsync("Department", department.DepartmentID.ToString(), department.Name, EntityOperation.UPDATE, cancellationToken: cancellationToken);

        return Ok(department);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteDepartment(int id, CancellationToken cancellationToken = default)
    {
        var department = await context.Departments.SingleOrDefaultAsync(d => d.DepartmentID == id, cancellationToken);
        if (department is null)
        {
            return NotFound();
        }

        var departmentName = department.Name;
        context.Departments.Remove(department);
        await context.SaveChangesAsync(cancellationToken);

        await notifications.PublishAsync("Department", id.ToString(), departmentName, EntityOperation.DELETE, cancellationToken: cancellationToken);

        return NoContent();
    }
}
