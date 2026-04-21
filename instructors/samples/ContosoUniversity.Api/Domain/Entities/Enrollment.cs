using ContosoUniversity.Api.Domain.Enums;

namespace ContosoUniversity.Api.Domain.Entities;

public class Enrollment
{
    public int EnrollmentId { get; set; }

    public int CourseId { get; set; }

    public int StudentId { get; set; }

    public Grade? Grade { get; set; }

    public Course Course { get; set; } = null!;

    public Student Student { get; set; } = null!;
}
