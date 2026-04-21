using System.Text.Json;
using ContosoUniversity.Api.Application.DTOs;
using ContosoUniversity.Api.Infrastructure.Data;
using ContosoUniversity.Api.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ContosoUniversity.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotificationsController(SchoolContext context, NotificationBroadcaster broadcaster) : ControllerBase
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    [HttpGet("stream")]
    public async Task Stream(CancellationToken cancellationToken)
    {
        Response.Headers.ContentType = "text/event-stream";
        Response.Headers.CacheControl = "no-cache";
        Response.Headers.Connection = "keep-alive";

        var (clientId, reader) = broadcaster.Subscribe();

        try
        {
            await foreach (var notification in reader.ReadAllAsync(cancellationToken))
            {
                var dto = new NotificationDto(
                    notification.NotificationId,
                    notification.EntityType,
                    notification.EntityId,
                    notification.Operation,
                    notification.Message,
                    notification.CreatedAt,
                    notification.CreatedBy,
                    notification.IsRead,
                    notification.ReadAt);

                var json = JsonSerializer.Serialize(dto, JsonOptions);
                await Response.WriteAsync($"data: {json}\n\n", cancellationToken);
                await Response.Body.FlushAsync(cancellationToken);
            }
        }
        catch (OperationCanceledException)
        {
            // Client disconnected
        }
        finally
        {
            broadcaster.Unsubscribe(clientId);
        }
    }

    [HttpGet]
    public async Task<ActionResult<List<NotificationDto>>> GetNotifications(
        [FromQuery] bool? unreadOnly, CancellationToken cancellationToken)
    {
        var query = context.Notifications.AsQueryable();

        if (unreadOnly == true)
            query = query.Where(n => !n.IsRead);

        var notifications = await query
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new NotificationDto(
                n.NotificationId,
                n.EntityType,
                n.EntityId,
                n.Operation,
                n.Message,
                n.CreatedAt,
                n.CreatedBy,
                n.IsRead,
                n.ReadAt))
            .ToListAsync(cancellationToken);

        return Ok(notifications);
    }

    [HttpPut("{id}/read")]
    public async Task<ActionResult<NotificationDto>> MarkAsRead(int id, CancellationToken cancellationToken)
    {
        var notification = await context.Notifications.FindAsync([id], cancellationToken);
        if (notification is null)
            return NotFound();

        notification.IsRead = true;
        notification.ReadAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);

        return Ok(new NotificationDto(
            notification.NotificationId,
            notification.EntityType,
            notification.EntityId,
            notification.Operation,
            notification.Message,
            notification.CreatedAt,
            notification.CreatedBy,
            notification.IsRead,
            notification.ReadAt));
    }
}
