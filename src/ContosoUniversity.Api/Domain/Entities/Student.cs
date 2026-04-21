namespace ContosoUniversity.Api.Domain.Entities;

public class Student : Person
{
    public DateTime EnrollmentDate { get; set; }

    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
}
