using System.Text.Json;
using ContosoUniversity.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace ContosoUniversity.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotificationsController(INotificationService notificationService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetNotifications([FromQuery] int limit = 10, CancellationToken cancellationToken = default)
    {
        var notifications = await notificationService.GetUnreadAsync(Math.Clamp(limit, 1, 100), cancellationToken);
        return Ok(new
        {
            success = true,
            notifications,
            count = notifications.Count,
        });
    }

    [HttpPost("mark-read/{id:int}")]
    public async Task<IActionResult> MarkAsRead(int id, CancellationToken cancellationToken = default)
    {
        var updated = await notificationService.MarkAsReadAsync(id, cancellationToken);
        return updated ? Ok(new { success = true }) : NotFound(new { success = false, message = "Notification not found" });
    }

    [HttpGet("stream")]
    public async Task Stream(CancellationToken cancellationToken)
    {
        Response.Headers.ContentType = "text/event-stream";
        Response.Headers.CacheControl = "no-cache";
        Response.Headers.Connection = "keep-alive";

        await foreach (var notification in notificationService.StreamAsync(cancellationToken))
        {
            var payload = JsonSerializer.Serialize(notification);
            await Response.WriteAsync($"event: notification\n", cancellationToken);
            await Response.WriteAsync($"data: {payload}\n\n", cancellationToken);
            await Response.Body.FlushAsync(cancellationToken);
        }
    }
}
