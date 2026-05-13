using System.Collections.Concurrent;
using System.Runtime.CompilerServices;
using System.Threading.Channels;
using ContosoUniversity.Data;
using ContosoUniversity.Models;
using Microsoft.EntityFrameworkCore;

namespace ContosoUniversity.Api.Services;

public sealed class NotificationService(IServiceScopeFactory scopeFactory) : INotificationService
{
    private readonly ConcurrentDictionary<Guid, Channel<Notification>> _subscribers = new();

    public async Task<Notification> PublishAsync(
        string entityType,
        string entityId,
        string? entityDisplayName,
        EntityOperation operation,
        string createdBy = "System",
        CancellationToken cancellationToken = default)
    {
        var notification = new Notification
        {
            EntityType = entityType,
            EntityId = entityId,
            Operation = operation.ToString(),
            Message = BuildMessage(entityType, entityId, entityDisplayName, operation),
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy,
            IsRead = false,
        };

        await using (var scope = scopeFactory.CreateAsyncScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<SchoolContext>();
            context.Notifications.Add(notification);
            await context.SaveChangesAsync(cancellationToken);
        }

        foreach (var subscriber in _subscribers.Values)
        {
            await subscriber.Writer.WriteAsync(notification, cancellationToken);
        }

        return notification;
    }

    public async Task<IReadOnlyList<Notification>> GetUnreadAsync(int limit = 10, CancellationToken cancellationToken = default)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<SchoolContext>();

        return await context.Notifications
            .AsNoTracking()
            .Where(n => !n.IsRead)
            .OrderByDescending(n => n.CreatedAt)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> MarkAsReadAsync(int id, CancellationToken cancellationToken = default)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<SchoolContext>();

        var notification = await context.Notifications.SingleOrDefaultAsync(n => n.Id == id, cancellationToken);
        if (notification is null)
        {
            return false;
        }

        notification.IsRead = true;
        notification.ReadAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async IAsyncEnumerable<Notification> StreamAsync([EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var channel = Channel.CreateUnbounded<Notification>();
        var subscriberId = Guid.NewGuid();
        _subscribers[subscriberId] = channel;

        try
        {
            await foreach (var notification in channel.Reader.ReadAllAsync(cancellationToken))
            {
                yield return notification;
            }
        }
        finally
        {
            _subscribers.TryRemove(subscriberId, out _);
        }
    }

    private static string BuildMessage(string entityType, string entityId, string? entityDisplayName, EntityOperation operation)
    {
        var displayText = string.IsNullOrWhiteSpace(entityDisplayName)
            ? $"{entityType} (ID: {entityId})"
            : $"{entityType} '{entityDisplayName}'";

        return operation switch
        {
            EntityOperation.CREATE => $"New {displayText} has been created",
            EntityOperation.UPDATE => $"{displayText} has been updated",
            EntityOperation.DELETE => $"{displayText} has been deleted",
            _ => $"{displayText} operation: {operation}",
        };
    }
}
