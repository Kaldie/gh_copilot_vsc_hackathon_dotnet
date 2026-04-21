namespace ContosoUniversity.Api.Application.DTOs;

public record StudentListDto(
    int Id,
    string LastName,
    string FirstMidName,
    DateTime EnrollmentDate
);

public record StudentDetailDto(
    int Id,
    string LastName,
    string FirstMidName,
    DateTime EnrollmentDate,
    List<EnrollmentDto> Enrollments
);

public record CreateStudentDto(
    string LastName,
    string FirstMidName,
    DateTime EnrollmentDate
);

public record UpdateStudentDto(
    string LastName,
    string FirstMidName,
    DateTime EnrollmentDate
);
