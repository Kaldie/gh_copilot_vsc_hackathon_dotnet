namespace ContosoUniversity.Api.Application.DTOs;

public record EnrollmentStatDto(
    DateTime EnrollmentDate,
    int StudentCount
);
