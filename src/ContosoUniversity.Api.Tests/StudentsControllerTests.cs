using System.Text.Json;
using ContosoUniversity.Api.Controllers;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace ContosoUniversity.Api.Tests;

public sealed class StudentsControllerTests
{
    [Fact]
    public async Task GetStudents_AppliesSearchSortAndPaging()
    {
        await using var context = TestHelpers.CreateContext(nameof(GetStudents_AppliesSearchSortAndPaging));
        await TestHelpers.SeedBasicDataAsync(context);
        var notifications = new FakeNotificationService();
        var controller = new StudentsController(context, notifications);

        var result = await controller.GetStudents(sortOrder: "name_desc", searchString: "e", page: 1, pageSize: 2);

        var ok = Assert.IsType<OkObjectResult>(result);
        var json = JsonSerializer.Serialize(ok.Value);
        using var doc = JsonDocument.Parse(json);

        var root = doc.RootElement;
        Assert.Equal(2, root.GetProperty("pageSize").GetInt32());
        Assert.Equal(2, root.GetProperty("items").GetArrayLength());
        Assert.Equal(3, root.GetProperty("totalCount").GetInt32());

        var firstLastName = root.GetProperty("items")[0].GetProperty("lastName").GetString();
        Assert.Equal("Zephyr", firstLastName);
    }

    [Fact]
    public async Task CreateStudent_InvalidDate_ReturnsValidationProblem()
    {
        await using var context = TestHelpers.CreateContext(nameof(CreateStudent_InvalidDate_ReturnsValidationProblem));
        var notifications = new FakeNotificationService();
        var controller = new StudentsController(context, notifications);

        var result = await controller.CreateStudent(new()
        {
            FirstMidName = "Test",
            LastName = "User",
            EnrollmentDate = new DateTime(1000, 1, 1),
        });

        Assert.IsType<ObjectResult>(result);
        Assert.Empty(notifications.Published);
    }

    [Fact]
    public async Task CreateStudent_Valid_PersistsAndPublishes()
    {
        await using var context = TestHelpers.CreateContext(nameof(CreateStudent_Valid_PersistsAndPublishes));
        var notifications = new FakeNotificationService();
        var controller = new StudentsController(context, notifications);

        var result = await controller.CreateStudent(new()
        {
            FirstMidName = "Jane",
            LastName = "Doe",
            EnrollmentDate = new DateTime(2024, 1, 15),
        });

        var created = Assert.IsType<CreatedAtActionResult>(result);
        Assert.Equal(nameof(StudentsController.GetStudent), created.ActionName);
        Assert.Single(context.Students);
        Assert.Single(notifications.Published);
    }
}
