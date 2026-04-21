using System.Text.Json.Serialization;
using ContosoUniversity.Api.Application.Interfaces;
using ContosoUniversity.Api.Infrastructure.Data;
using ContosoUniversity.Api.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// EF Core SQLite
builder.Services.AddDbContext<SchoolContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("SchoolContext")));

// DI registrations
builder.Services.AddSingleton<IStorageService, LocalStorageService>();
builder.Services.AddSingleton<NotificationBroadcaster>();
builder.Services.AddScoped<INotificationService, NotificationService>();

// Controllers + JSON options
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// CORS (allow all for dev)
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Ensure database created + seed
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<SchoolContext>();
    await context.Database.EnsureCreatedAsync();
    await DbInitializer.SeedAsync(context);
}

app.UseCors();

app.UseHttpsRedirection();

app.UseAuthorization();

// Serve uploaded files
var uploadPath = builder.Configuration.GetValue<string>("Storage:UploadPath") ?? "Uploads";
Directory.CreateDirectory(uploadPath);

app.MapControllers();

app.Run();
