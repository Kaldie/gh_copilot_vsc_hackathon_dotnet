using ContosoUniversity.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ContosoUniversity.Api.Infrastructure.Data;

public class SchoolContext : DbContext
{
    public SchoolContext(DbContextOptions<SchoolContext> options) : base(options)
    {
    }

    public DbSet<Student> Students => Set<Student>();
    public DbSet<Instructor> Instructors => Set<Instructor>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();
    public DbSet<OfficeAssignment> OfficeAssignments => Set<OfficeAssignment>();
    public DbSet<CourseAssignment> CourseAssignments => Set<CourseAssignment>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<ScheduledInstance> ScheduledInstances => Set<ScheduledInstance>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // TPH inheritance for Person hierarchy
        modelBuilder.Entity<Person>()
            .HasDiscriminator<string>("Discriminator")
            .HasValue<Student>("Student")
            .HasValue<Instructor>("Instructor");

        // CourseAssignment: composite PK
        modelBuilder.Entity<CourseAssignment>()
            .HasKey(ca => new { ca.InstructorId, ca.CourseId });

        // OfficeAssignment: shared PK with Instructor (1:1)
        modelBuilder.Entity<OfficeAssignment>()
            .HasKey(oa => oa.InstructorId);

        modelBuilder.Entity<OfficeAssignment>()
            .HasOne(oa => oa.Instructor)
            .WithOne(i => i.OfficeAssignment)
            .HasForeignKey<OfficeAssignment>(oa => oa.InstructorId);

        // Course: user-assigned PK (no auto-generate)
        modelBuilder.Entity<Course>()
            .Property(c => c.CourseId)
            .ValueGeneratedNever();

        // Department: Guid concurrency token
        modelBuilder.Entity<Department>()
            .Property(d => d.RowVersion)
            .IsConcurrencyToken();

        // Department → Course: restrict delete
        modelBuilder.Entity<Course>()
            .HasOne(c => c.Department)
            .WithMany(d => d.Courses)
            .HasForeignKey(c => c.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        // Enrollment: unique constraint on (StudentId, CourseId)
        modelBuilder.Entity<Enrollment>()
            .HasIndex(e => new { e.StudentId, e.CourseId })
            .IsUnique();

        // Department → Administrator (optional FK)
        modelBuilder.Entity<Department>()
            .HasOne(d => d.Administrator)
            .WithMany()
            .HasForeignKey(d => d.InstructorId)
            .OnDelete(DeleteBehavior.SetNull);

        // Department.Color max length
        modelBuilder.Entity<Department>()
            .Property(d => d.Color)
            .HasMaxLength(7);

        // ScheduledInstance → Course FK
        modelBuilder.Entity<ScheduledInstance>()
            .HasOne(si => si.Course)
            .WithMany(c => c.ScheduledInstances)
            .HasForeignKey(si => si.CourseId)
            .OnDelete(DeleteBehavior.Cascade);

        // ScheduledInstance: unique index on (CourseId, DayOfWeek, StartTime)
        modelBuilder.Entity<ScheduledInstance>()
            .HasIndex(si => new { si.CourseId, si.DayOfWeek, si.StartTime })
            .IsUnique();

        // ScheduledInstance: default duration
        modelBuilder.Entity<ScheduledInstance>()
            .Property(si => si.DurationMinutes)
            .HasDefaultValue(60);
    }
}
