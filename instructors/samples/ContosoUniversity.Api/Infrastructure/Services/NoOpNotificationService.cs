using ContosoUniversity.Api.Application.Interfaces;

namespace ContosoUniversity.Api.Infrastructure.Services;

/// <summary>
/// No-op notification service used until SSE broadcasting is implemented in Phase 8.
/// </summary>
public class NoOpNotificationService : INotificationService
{
    public Task NotifyAsync(string entityType, int entityId, string operation, string message, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
}
