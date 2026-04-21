using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ContosoUniversity.Api.Domain.Entities;

public abstract class Person
{
    public int Id { get; set; }

    [Required]
    [StringLength(50)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string FirstMidName { get; set; } = string.Empty;

    [NotMapped]
    public string FullName => $"{LastName}, {FirstMidName}";
}
