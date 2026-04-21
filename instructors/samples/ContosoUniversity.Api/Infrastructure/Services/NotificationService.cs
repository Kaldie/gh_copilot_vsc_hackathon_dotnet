using ContosoUniversity.Api.Application.Interfaces;
using ContosoUniversity.Api.Domain.Entities;
using ContosoUniversity.Api.Infrastructure.Data;

namespace ContosoUniversity.Api.Infrastructure.Services;

public class NotificationService(SchoolContext context, NotificationBroadcaster broadcaster) : INotificationService
{
    public async Task NotifyAsync(string entityType, int entityId, string operation, string message, CancellationToken cancellationToken = default)
    {
        var notification = new Notification
        {
            EntityType = entityType,
            EntityId = entityId,
            Operation = operation,
            Message = message,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "admin",
        };

        context.Notifications.Add(notification);
        await context.SaveChangesAsync(cancellationToken);

        broadcaster.Publish(notification);
    }
}
