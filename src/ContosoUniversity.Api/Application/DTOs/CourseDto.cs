namespace ContosoUniversity.Api.Application.DTOs;

public record CourseListDto(
    int CourseId,
    string Title,
    int Credits,
    string DepartmentName
);

public record CourseDetailDto(
    int CourseId,
    string Title,
    int Credits,
    int DepartmentId,
    string DepartmentName,
    string? ImagePath
);
