namespace ContosoUniversity.Api.Application.DTOs;

public record ScheduledInstanceDto(
    int ScheduledInstanceId,
    int CourseId,
    string CourseTitle,
    int DepartmentId,
    string DepartmentName,
    string? DepartmentColor,
    DayOfWeek DayOfWeek,
    TimeOnly StartTime,
    int DurationMinutes
);

public record CreateScheduledInstanceDto(
    int CourseId,
    DayOfWeek DayOfWeek,
    TimeOnly StartTime,
    int DurationMinutes = 60
);

public record UpdateScheduledInstanceDto(
    DayOfWeek DayOfWeek,
    TimeOnly StartTime,
    int DurationMinutes
);

public record ConflictDto(
    ScheduledInstanceDto InstanceA,
    ScheduledInstanceDto InstanceB
);
