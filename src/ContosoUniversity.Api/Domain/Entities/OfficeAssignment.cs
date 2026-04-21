using System.ComponentModel.DataAnnotations;

namespace ContosoUniversity.Api.Domain.Entities;

public class OfficeAssignment
{
    public int InstructorId { get; set; }

    [Required]
    [StringLength(50)]
    public string Location { get; set; } = string.Empty;

    public Instructor Instructor { get; set; } = null!;
}
