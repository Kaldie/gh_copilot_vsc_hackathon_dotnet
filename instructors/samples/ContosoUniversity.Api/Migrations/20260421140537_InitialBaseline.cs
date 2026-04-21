using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ContosoUniversity.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialBaseline : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Color",
                table: "Departments",
                type: "TEXT",
                maxLength: 7,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ScheduledInstances",
                columns: table => new
                {
                    ScheduledInstanceId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CourseId = table.Column<int>(type: "INTEGER", nullable: false),
                    DayOfWeek = table.Column<int>(type: "INTEGER", nullable: false),
                    StartTime = table.Column<TimeOnly>(type: "TEXT", nullable: false),
                    DurationMinutes = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 60)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScheduledInstances", x => x.ScheduledInstanceId);
                    table.ForeignKey(
                        name: "FK_ScheduledInstances_Courses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "Courses",
                        principalColumn: "CourseId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ScheduledInstances_CourseId_DayOfWeek_StartTime",
                table: "ScheduledInstances",
                columns: new[] { "CourseId", "DayOfWeek", "StartTime" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ScheduledInstances");

            migrationBuilder.DropColumn(
                name: "Color",
                table: "Departments");
        }
    }
}
