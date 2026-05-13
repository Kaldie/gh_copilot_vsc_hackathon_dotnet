using ContosoUniversity.Api.Controllers;
using ContosoUniversity.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace ContosoUniversity.Api.Tests;

public sealed class InstructorsControllerTests
{
    [Fact]
    public async Task UpdateInstructor_AddingOfficeAssignment_UpdatesExistingInstructorOnly()
    {
        await using var context = TestHelpers.CreateContext(nameof(UpdateInstructor_AddingOfficeAssignment_UpdatesExistingInstructorOnly));
        context.Instructors.Add(new Instructor
        {
            ID = 42,
            FirstMidName = "Kim",
            LastName = "Abercrombie",
            HireDate = new DateTime(1995, 3, 11),
        });
        await context.SaveChangesAsync();

        var notifications = new FakeNotificationService();
        var controller = new InstructorsController(context, notifications);

        var result = await controller.UpdateInstructor(42, new(
            "Kim",
            "Abercrombie",
            new DateTime(1995, 3, 11),
            "Room 42",
            []));

        Assert.IsType<OkObjectResult>(result);

        var instructors = await context.Instructors.AsNoTracking().ToListAsync();
        var offices = await context.OfficeAssignments.AsNoTracking().ToListAsync();

        Assert.Single(instructors);
        Assert.Single(offices);
        Assert.Equal(42, offices[0].InstructorID);
        Assert.Equal("Room 42", offices[0].Location);
        Assert.Single(notifications.Published);
    }

    [Fact]
    public async Task CreateInstructor_BlankNames_ReturnsValidationProblem()
    {
        await using var context = TestHelpers.CreateContext(nameof(CreateInstructor_BlankNames_ReturnsValidationProblem));
        var notifications = new FakeNotificationService();
        var controller = new InstructorsController(context, notifications);

        var result = await controller.CreateInstructor(new(
            "",
            "",
            new DateTime(2026, 5, 13),
            "Office 1",
            []));

        Assert.IsType<ObjectResult>(result);
        Assert.Empty(await context.Instructors.ToListAsync());
        Assert.Empty(notifications.Published);
    }
}