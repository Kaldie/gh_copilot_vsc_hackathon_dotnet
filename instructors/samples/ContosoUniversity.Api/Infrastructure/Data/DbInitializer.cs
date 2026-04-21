using ContosoUniversity.Api.Domain.Entities;
using ContosoUniversity.Api.Domain.Enums;

namespace ContosoUniversity.Api.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(SchoolContext context)
    {
        if (context.Students.Any())
        {
            return; // Already seeded
        }

        // Instructors
        var instructors = new Instructor[]
        {
            new() { LastName = "Abercrombie", FirstMidName = "Kim", HireDate = DateTime.Parse("1995-03-11") },
            new() { LastName = "Fakhouri", FirstMidName = "Fadi", HireDate = DateTime.Parse("2002-07-06") },
            new() { LastName = "Harui", FirstMidName = "Roger", HireDate = DateTime.Parse("1998-07-01") },
            new() { LastName = "Kapoor", FirstMidName = "Candace", HireDate = DateTime.Parse("2001-01-15") },
            new() { LastName = "Zheng", FirstMidName = "Roger", HireDate = DateTime.Parse("2004-02-12") },
        };
        context.Instructors.AddRange(instructors);
        await context.SaveChangesAsync();

        // Office assignments
        var officeAssignments = new OfficeAssignment[]
        {
            new() { InstructorId = instructors[0].Id, Location = "Smith 17" },
            new() { InstructorId = instructors[1].Id, Location = "Gowan 27" },
            new() { InstructorId = instructors[2].Id, Location = "Thompson 304" },
        };
        context.OfficeAssignments.AddRange(officeAssignments);

        // Departments
        var departments = new Department[]
        {
            new() { Name = "English", Budget = 350000m, StartDate = DateTime.Parse("2007-09-01"), InstructorId = instructors[0].Id, RowVersion = Guid.NewGuid() },
            new() { Name = "Mathematics", Budget = 100000m, StartDate = DateTime.Parse("2007-09-01"), InstructorId = instructors[1].Id, RowVersion = Guid.NewGuid() },
            new() { Name = "Engineering", Budget = 350000m, StartDate = DateTime.Parse("2007-09-01"), InstructorId = instructors[2].Id, RowVersion = Guid.NewGuid() },
            new() { Name = "Economics", Budget = 100000m, StartDate = DateTime.Parse("2007-09-01"), InstructorId = instructors[3].Id, RowVersion = Guid.NewGuid() },
        };
        context.Departments.AddRange(departments);
        await context.SaveChangesAsync();

        // Courses
        var courses = new Course[]
        {
            new() { CourseId = 1050, Title = "Chemistry", Credits = 3, DepartmentId = departments[2].DepartmentId },
            new() { CourseId = 4022, Title = "Microeconomics", Credits = 3, DepartmentId = departments[3].DepartmentId },
            new() { CourseId = 4041, Title = "Macroeconomics", Credits = 3, DepartmentId = departments[3].DepartmentId },
            new() { CourseId = 1045, Title = "Calculus", Credits = 4, DepartmentId = departments[1].DepartmentId },
            new() { CourseId = 3141, Title = "Trigonometry", Credits = 4, DepartmentId = departments[1].DepartmentId },
            new() { CourseId = 2021, Title = "Composition", Credits = 3, DepartmentId = departments[0].DepartmentId },
            new() { CourseId = 2042, Title = "Literature", Credits = 4, DepartmentId = departments[0].DepartmentId },
            new() { CourseId = 1021, Title = "Physics", Credits = 4, DepartmentId = departments[2].DepartmentId },
            new() { CourseId = 2001, Title = "Poetry", Credits = 3, DepartmentId = departments[0].DepartmentId },
            new() { CourseId = 3042, Title = "Statistics", Credits = 3, DepartmentId = departments[1].DepartmentId },
        };
        context.Courses.AddRange(courses);
        await context.SaveChangesAsync();

        // Course assignments
        var courseAssignments = new CourseAssignment[]
        {
            new() { InstructorId = instructors[0].Id, CourseId = 1050 },
            new() { InstructorId = instructors[0].Id, CourseId = 4022 },
            new() { InstructorId = instructors[1].Id, CourseId = 3141 },
            new() { InstructorId = instructors[1].Id, CourseId = 1045 },
            new() { InstructorId = instructors[2].Id, CourseId = 2021 },
            new() { InstructorId = instructors[2].Id, CourseId = 2042 },
            new() { InstructorId = instructors[3].Id, CourseId = 4041 },
            new() { InstructorId = instructors[3].Id, CourseId = 1021 },
            new() { InstructorId = instructors[4].Id, CourseId = 2001 },
            new() { InstructorId = instructors[4].Id, CourseId = 3042 },
        };
        context.CourseAssignments.AddRange(courseAssignments);

        // Students
        var students = new Student[]
        {
            new() { LastName = "Alexander", FirstMidName = "Carson", EnrollmentDate = DateTime.Parse("2019-09-01") },
            new() { LastName = "Alonso", FirstMidName = "Meredith", EnrollmentDate = DateTime.Parse("2017-09-01") },
            new() { LastName = "Anand", FirstMidName = "Arturo", EnrollmentDate = DateTime.Parse("2018-09-01") },
            new() { LastName = "Barzdukas", FirstMidName = "Gytis", EnrollmentDate = DateTime.Parse("2017-09-01") },
            new() { LastName = "Li", FirstMidName = "Yan", EnrollmentDate = DateTime.Parse("2017-09-01") },
            new() { LastName = "Justice", FirstMidName = "Peggy", EnrollmentDate = DateTime.Parse("2016-09-01") },
            new() { LastName = "Norman", FirstMidName = "Laura", EnrollmentDate = DateTime.Parse("2018-09-01") },
            new() { LastName = "Olivetto", FirstMidName = "Nino", EnrollmentDate = DateTime.Parse("2019-09-01") },
        };
        context.Students.AddRange(students);
        await context.SaveChangesAsync();

        // Enrollments
        var enrollments = new Enrollment[]
        {
            new() { StudentId = students[0].Id, CourseId = 1050, Grade = Grade.A },
            new() { StudentId = students[0].Id, CourseId = 4022, Grade = Grade.C },
            new() { StudentId = students[0].Id, CourseId = 4041, Grade = Grade.B },
            new() { StudentId = students[1].Id, CourseId = 1045, Grade = Grade.B },
            new() { StudentId = students[1].Id, CourseId = 3141, Grade = Grade.F },
            new() { StudentId = students[1].Id, CourseId = 2021, Grade = Grade.F },
            new() { StudentId = students[2].Id, CourseId = 1050 },
            new() { StudentId = students[2].Id, CourseId = 1021 },
            new() { StudentId = students[3].Id, CourseId = 1050 },
            new() { StudentId = students[3].Id, CourseId = 2042, Grade = Grade.F },
            new() { StudentId = students[4].Id, CourseId = 2021 },
            new() { StudentId = students[4].Id, CourseId = 2042, Grade = Grade.B },
            new() { StudentId = students[5].Id, CourseId = 1045 },
            new() { StudentId = students[5].Id, CourseId = 4022, Grade = Grade.B },
            new() { StudentId = students[5].Id, CourseId = 3042, Grade = Grade.B },
            new() { StudentId = students[6].Id, CourseId = 3141, Grade = Grade.A },
            new() { StudentId = students[6].Id, CourseId = 1021 },
            new() { StudentId = students[6].Id, CourseId = 2001, Grade = Grade.C },
            new() { StudentId = students[7].Id, CourseId = 1050, Grade = Grade.A },
            new() { StudentId = students[7].Id, CourseId = 4041, Grade = Grade.D },
            new() { StudentId = students[7].Id, CourseId = 2042 },
        };
        context.Enrollments.AddRange(enrollments);
        await context.SaveChangesAsync();
    }
}
