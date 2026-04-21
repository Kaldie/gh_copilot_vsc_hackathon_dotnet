namespace ContosoUniversity.Api.Application.DTOs;

public record DepartmentListDto(
    int DepartmentId,
    string Name,
    decimal Budget,
    DateTime StartDate,
    string? AdministratorName
);

public record DepartmentDetailDto(
    int DepartmentId,
    string Name,
    decimal Budget,
    DateTime StartDate,
    int? InstructorId,
    string? AdministratorName,
    Guid RowVersion,
    List<CourseListDto> Courses
);

public record CreateDepartmentDto(
    string Name,
    decimal Budget,
    DateTime StartDate,
    int? InstructorId
);

public record UpdateDepartmentDto(
    string Name,
    decimal Budget,
    DateTime StartDate,
    int? InstructorId,
    Guid RowVersion
);
