namespace ContosoUniversity.Api.Application.Interfaces;

public interface INotificationService
{
    Task NotifyAsync(string entityType, int entityId, string operation, string message, CancellationToken cancellationToken = default);
}
