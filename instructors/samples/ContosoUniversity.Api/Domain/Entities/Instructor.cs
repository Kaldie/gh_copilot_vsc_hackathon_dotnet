namespace ContosoUniversity.Api.Domain.Entities;

public class Instructor : Person
{
    public DateTime HireDate { get; set; }

    public ICollection<CourseAssignment> CourseAssignments { get; set; } = new List<CourseAssignment>();

    public OfficeAssignment? OfficeAssignment { get; set; }
}
