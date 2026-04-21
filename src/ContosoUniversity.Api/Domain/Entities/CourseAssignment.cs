namespace ContosoUniversity.Api.Domain.Entities;

public class CourseAssignment
{
    public int InstructorId { get; set; }

    public int CourseId { get; set; }

    public Instructor Instructor { get; set; } = null!;

    public Course Course { get; set; } = null!;
}
