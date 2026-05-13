using ContosoUniversity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ContosoUniversity.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HomeController(SchoolContext context) : ControllerBase
{
    [HttpGet("enrollment-stats")]
    public async Task<IActionResult> GetEnrollmentStats(CancellationToken cancellationToken = default)
    {
        var data = await context.Students
            .AsNoTracking()
            .GroupBy(s => s.EnrollmentDate)
            .Select(g => new
            {
                enrollmentDate = g.Key,
                studentCount = g.Count(),
            })
            .OrderBy(x => x.enrollmentDate)
            .ToListAsync(cancellationToken);

        return Ok(data);
    }
}
