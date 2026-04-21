namespace ContosoUniversity.Api.Application.DTOs;

public record InstructorListDto(
    int Id,
    string LastName,
    string FirstMidName,
    DateTime HireDate,
    string? OfficeLocation
);

public record InstructorDetailDto(
    int Id,
    string LastName,
    string FirstMidName,
    DateTime HireDate,
    string? OfficeLocation,
    List<CourseListDto> Courses
);

public record CreateInstructorDto(
    string LastName,
    string FirstMidName,
    DateTime HireDate,
    string? OfficeLocation,
    List<int>? CourseIds
);

public record UpdateInstructorDto(
    string LastName,
    string FirstMidName,
    DateTime HireDate,
    string? OfficeLocation,
    List<int>? CourseIds
);

public record AssignCourseDto(int CourseId);
