using ContosoUniversity.Api.Services;
using ContosoUniversity.Data;
using ContosoUniversity.Models;
using Microsoft.EntityFrameworkCore;

namespace ContosoUniversity.Api.Tests;

internal static class TestHelpers
{
    internal static SchoolContext CreateContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<SchoolContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        var context = new SchoolContext(options);
        context.Database.EnsureCreated();
        return context;
    }

    internal static async Task SeedBasicDataAsync(SchoolContext context)
    {
        if (!await context.Students.AnyAsync())
        {
            var students = new[]
            {
                new Student { FirstMidName = "Alice", LastName = "Zephyr", EnrollmentDate = new DateTime(2020, 1, 1) },
                new Student { FirstMidName = "Bob", LastName = "Yellow", EnrollmentDate = new DateTime(2021, 1, 1) },
                new Student { FirstMidName = "Cara", LastName = "Xavier", EnrollmentDate = new DateTime(2022, 1, 1) },
            };

            context.Students.AddRange(students);
        }

        if (!await context.Departments.AnyAsync())
        {
            context.Departments.Add(new Department
            {
                DepartmentID = 1,
                Name = "Engineering",
                Budget = 100000,
                StartDate = new DateTime(2020, 1, 1),
            });
        }

        if (!await context.Courses.AnyAsync())
        {
            context.Courses.AddRange(
                new Course { CourseID = 100, Title = "Algorithms", Credits = 3, DepartmentID = 1 },
                new Course { CourseID = 200, Title = "Databases", Credits = 4, DepartmentID = 1 }
            );
        }

        await context.SaveChangesAsync();
    }
}

internal sealed class FakeNotificationService : INotificationService
{
    private readonly List<Notification> _published = [];

    public IReadOnlyList<Notification> Published => _published;

    public Task<Notification> PublishAsync(string entityType, string entityId, string? entityDisplayName, EntityOperation operation, string createdBy = "System", CancellationToken cancellationToken = default)
    {
        var notification = new Notification
        {
            EntityType = entityType,
            EntityId = entityId,
            Operation = operation.ToString(),
            Message = entityDisplayName ?? entityType,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy,
        };
        _published.Add(notification);
        return Task.FromResult(notification);
    }

    public Task<IReadOnlyList<Notification>> GetUnreadAsync(int limit = 10, CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<Notification>>(_published.Take(limit).ToList());

    public Task<bool> MarkAsReadAsync(int id, CancellationToken cancellationToken = default)
        => Task.FromResult(true);

    public async IAsyncEnumerable<Notification> StreamAsync([System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        await Task.CompletedTask;
        yield break;
    }
}
