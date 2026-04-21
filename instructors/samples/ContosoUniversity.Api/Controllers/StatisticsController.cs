using ContosoUniversity.Api.Application.DTOs;
using ContosoUniversity.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ContosoUniversity.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatisticsController(SchoolContext context) : ControllerBase
{
    [HttpGet("enrollments")]
    public async Task<ActionResult<List<EnrollmentStatDto>>> GetEnrollmentStatistics(CancellationToken cancellationToken)
    {
        var stats = await context.Students
            .GroupBy(s => s.EnrollmentDate)
            .Select(g => new EnrollmentStatDto(g.Key, g.Count()))
            .OrderBy(s => s.EnrollmentDate)
            .ToListAsync(cancellationToken);

        return Ok(stats);
    }
}
