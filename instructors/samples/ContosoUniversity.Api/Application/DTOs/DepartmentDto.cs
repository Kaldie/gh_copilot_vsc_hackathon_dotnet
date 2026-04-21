namespace ContosoUniversity.Api.Application.DTOs;

public record DepartmentListDto(
    int DepartmentId,
    string Name,
    decimal Budget,
    DateTime StartDate,
    string? AdministratorName,
    string? Color
);

public record DepartmentDetailDto(
    int DepartmentId,
    string Name,
    decimal Budget,
    DateTime StartDate,
    int? InstructorId,
    string? AdministratorName,
    Guid RowVersion,
    string? Color,
    List<CourseListDto> Courses
);

public record CreateDepartmentDto(
    string Name,
    decimal Budget,
    DateTime StartDate,
    int? InstructorId,
    string? Color
);

public record UpdateDepartmentDto(
    string Name,
    decimal Budget,
    DateTime StartDate,
    int? InstructorId,
    Guid RowVersion,
    string? Color
);
