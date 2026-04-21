using ContosoUniversity.Api.Domain.Enums;

namespace ContosoUniversity.Api.Application.DTOs;

public record EnrollmentDto(
    int EnrollmentId,
    int CourseId,
    string CourseTitle,
    int StudentId,
    string? StudentName,
    Grade? Grade
);

public record CreateEnrollmentDto(
    int CourseId
);

public record UpdateEnrollmentGradeDto(
    Grade Grade
);
