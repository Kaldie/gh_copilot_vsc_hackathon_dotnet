using System.Text.Json;
using ContosoUniversity.Api.Controllers;
using ContosoUniversity.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace ContosoUniversity.Api.Tests;

public sealed class EnrollmentsControllerTests
{
    [Fact]
    public async Task GetEnrollments_FiltersByStudent()
    {
        await using var context = TestHelpers.CreateContext(nameof(GetEnrollments_FiltersByStudent));
        await TestHelpers.SeedBasicDataAsync(context);
        context.Enrollments.AddRange(
            new Enrollment { StudentID = 1, CourseID = 100, Grade = Grade.A },
            new Enrollment { StudentID = 2, CourseID = 200, Grade = Grade.B }
        );
        await context.SaveChangesAsync();

        var notifications = new FakeNotificationService();
        var controller = new EnrollmentsController(context, notifications);

        var result = await controller.GetEnrollments(studentId: 1, courseId: null);

        var ok = Assert.IsType<OkObjectResult>(result);
        var json = JsonSerializer.Serialize(ok.Value);
        using var doc = JsonDocument.Parse(json);
        Assert.Single(doc.RootElement.EnumerateArray());
    }

    [Fact]
    public async Task CreateEnrollment_Duplicate_ReturnsConflict()
    {
        await using var context = TestHelpers.CreateContext(nameof(CreateEnrollment_Duplicate_ReturnsConflict));
        await TestHelpers.SeedBasicDataAsync(context);
        context.Enrollments.Add(new Enrollment { StudentID = 1, CourseID = 100, Grade = Grade.B });
        await context.SaveChangesAsync();

        var notifications = new FakeNotificationService();
        var controller = new EnrollmentsController(context, notifications);

        var result = await controller.CreateEnrollment(new(1, 100, "A"));

        Assert.IsType<ConflictObjectResult>(result);
        Assert.Single(await context.Enrollments.ToListAsync());
        Assert.Empty(notifications.Published);
    }

    [Fact]
    public async Task CreateEnrollment_InvalidGrade_ReturnsBadRequest()
    {
        await using var context = TestHelpers.CreateContext(nameof(CreateEnrollment_InvalidGrade_ReturnsBadRequest));
        await TestHelpers.SeedBasicDataAsync(context);

        var notifications = new FakeNotificationService();
        var controller = new EnrollmentsController(context, notifications);

        var result = await controller.CreateEnrollment(new(1, 100, "Z"));

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Empty(await context.Enrollments.ToListAsync());
    }

    [Fact]
    public async Task CreateEnrollment_Valid_PersistsAndPublishes()
    {
        await using var context = TestHelpers.CreateContext(nameof(CreateEnrollment_Valid_PersistsAndPublishes));
        await TestHelpers.SeedBasicDataAsync(context);

        var notifications = new FakeNotificationService();
        var controller = new EnrollmentsController(context, notifications);

        var result = await controller.CreateEnrollment(new(1, 100, "A"));

        Assert.IsType<CreatedAtActionResult>(result);
        Assert.Single(await context.Enrollments.ToListAsync());
        Assert.Single(notifications.Published);
    }

    [Fact]
    public async Task DeleteEnrollment_RemovesRecord()
    {
        await using var context = TestHelpers.CreateContext(nameof(DeleteEnrollment_RemovesRecord));
        await TestHelpers.SeedBasicDataAsync(context);
        context.Enrollments.Add(new Enrollment { StudentID = 1, CourseID = 100, Grade = Grade.C });
        await context.SaveChangesAsync();
        var id = (await context.Enrollments.SingleAsync()).EnrollmentID;

        var notifications = new FakeNotificationService();
        var controller = new EnrollmentsController(context, notifications);

        var result = await controller.DeleteEnrollment(id);

        Assert.IsType<NoContentResult>(result);
        Assert.Empty(await context.Enrollments.ToListAsync());
    }
}
