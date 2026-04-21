using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ContosoUniversity.Api.Domain.Entities;

public class Course
{
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public int CourseId { get; set; }

    [Required]
    [StringLength(50, MinimumLength = 3)]
    public string Title { get; set; } = string.Empty;

    [Range(0, 5)]
    public int Credits { get; set; }

    public int DepartmentId { get; set; }

    public string? ImagePath { get; set; }

    public Department Department { get; set; } = null!;

    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();

    public ICollection<CourseAssignment> CourseAssignments { get; set; } = new List<CourseAssignment>();
}
