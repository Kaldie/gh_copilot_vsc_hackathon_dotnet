using System.ComponentModel.DataAnnotations;

namespace ContosoUniversity.Api.Domain.Entities;

public class ScheduledInstance
{
    public int ScheduledInstanceId { get; set; }

    public int CourseId { get; set; }

    [Required]
    public DayOfWeek DayOfWeek { get; set; }

    [Required]
    public TimeOnly StartTime { get; set; }

    public int DurationMinutes { get; set; } = 60;

    public Course Course { get; set; } = null!;
}
