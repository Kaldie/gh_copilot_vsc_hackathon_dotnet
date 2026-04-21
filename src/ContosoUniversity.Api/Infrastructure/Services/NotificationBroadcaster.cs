using System.Threading.Channels;
using ContosoUniversity.Api.Domain.Entities;

namespace ContosoUniversity.Api.Infrastructure.Services;

public class NotificationBroadcaster
{
    private readonly object _lock = new();
    private readonly Dictionary<string, Channel<Notification>> _subscribers = new();

    public (string ClientId, ChannelReader<Notification> Reader) Subscribe()
    {
        var clientId = Guid.NewGuid().ToString();
        var channel = Channel.CreateBounded<Notification>(new BoundedChannelOptions(100)
        {
            FullMode = BoundedChannelFullMode.DropOldest,
        });

        lock (_lock)
        {
            _subscribers[clientId] = channel;
        }

        return (clientId, channel.Reader);
    }

    public void Unsubscribe(string clientId)
    {
        lock (_lock)
        {
            if (_subscribers.Remove(clientId, out var channel))
            {
                channel.Writer.TryComplete();
            }
        }
    }

    public void Publish(Notification notification)
    {
        List<Channel<Notification>> snapshot;
        lock (_lock)
        {
            snapshot = _subscribers.Values.ToList();
        }

        foreach (var channel in snapshot)
        {
            channel.Writer.TryWrite(notification);
        }
    }
}
