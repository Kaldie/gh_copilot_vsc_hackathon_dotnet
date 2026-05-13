using System.Threading;
using ContosoUniversity.Models;

namespace ContosoUniversity.Api.Services;

public interface INotificationService
{
    Task<Notification> PublishAsync(string entityType, string entityId, string? entityDisplayName, EntityOperation operation, string createdBy = "System", CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Notification>> GetUnreadAsync(int limit = 10, CancellationToken cancellationToken = default);
    Task<bool> MarkAsReadAsync(int id, CancellationToken cancellationToken = default);
    IAsyncEnumerable<Notification> StreamAsync(CancellationToken cancellationToken = default);
}
