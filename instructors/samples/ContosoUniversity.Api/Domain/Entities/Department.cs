using System.ComponentModel.DataAnnotations;

namespace ContosoUniversity.Api.Domain.Entities;

public class Department
{
    public int DepartmentId { get; set; }

    [Required]
    [StringLength(50, MinimumLength = 3)]
    public string Name { get; set; } = string.Empty;

    public decimal Budget { get; set; }

    public DateTime StartDate { get; set; }

    public int? InstructorId { get; set; }

    public Guid RowVersion { get; set; }

    [StringLength(7)]
    public string? Color { get; set; }

    public Instructor? Administrator { get; set; }

    public ICollection<Course> Courses { get; set; } = new List<Course>();
}
