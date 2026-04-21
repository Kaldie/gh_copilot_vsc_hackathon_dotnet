using System;
using System.Collections.Concurrent;
using System.Configuration;
using ContosoUniversity.Models;
using Newtonsoft.Json;

namespace ContosoUniversity.Services
{
    /// <summary>
    /// Notification service that uses MSMQ when available, falling back to an
    /// in-memory queue when MSMQ is not installed. This is the legacy on-prem
    /// implementation — the MSMQ dependency is a key migration target.
    /// </summary>
    public class NotificationService
    {
        private readonly string _queuePath;
        private readonly bool _useMsmq;

        // MSMQ queue (only set when MSMQ is available)
        private readonly System.Messaging.MessageQueue _queue;

        // In-memory fallback queue for environments without MSMQ
        private static readonly ConcurrentQueue<string> _inMemoryQueue = new ConcurrentQueue<string>();

        public NotificationService()
        {
            // Get queue path from configuration or use default
            _queuePath = ConfigurationManager.AppSettings["NotificationQueuePath"] ?? @".\Private$\ContosoUniversityNotifications";

            // Try to use MSMQ; fall back to in-memory if not installed
            try
            {
                if (!System.Messaging.MessageQueue.Exists(_queuePath))
                {
                    _queue = System.Messaging.MessageQueue.Create(_queuePath);
                    _queue.SetPermissions("Everyone", System.Messaging.MessageQueueAccessRights.FullControl);
                }
                else
                {
                    _queue = new System.Messaging.MessageQueue(_queuePath);
                }
                _queue.Formatter = new System.Messaging.XmlMessageFormatter(new Type[] { typeof(string) });
                _useMsmq = true;
            }
            catch (Exception ex)
            {
                // MSMQ not available — use in-memory fallback
                System.Diagnostics.Debug.WriteLine($"MSMQ not available, using in-memory queue: {ex.Message}");
                _useMsmq = false;
            }
        }

        public void SendNotification(string entityType, string entityId, EntityOperation operation, string userName = null)
        {
            SendNotification(entityType, entityId, null, operation, userName);
        }

        public void SendNotification(string entityType, string entityId, string entityDisplayName, EntityOperation operation, string userName = null)
        {
            try
            {
                var notification = new Notification
                {
                    EntityType = entityType,
                    EntityId = entityId,
                    Operation = operation.ToString(),
                    Message = GenerateMessage(entityType, entityId, entityDisplayName, operation),
                    CreatedAt = DateTime.Now,
                    CreatedBy = userName ?? "System",
                    IsRead = false
                };

                var jsonMessage = JsonConvert.SerializeObject(notification);

                if (_useMsmq)
                {
                    var message = new System.Messaging.Message(jsonMessage)
                    {
                        Label = $"{entityType} {operation}",
                        Priority = System.Messaging.MessagePriority.Normal
                    };
                    _queue.Send(message);
                }
                else
                {
                    // In-memory fallback
                    _inMemoryQueue.Enqueue(jsonMessage);
                }
            }
            catch (Exception ex)
            {
                // Log error but don't break the main operation
                System.Diagnostics.Debug.WriteLine($"Failed to send notification: {ex.Message}");
            }
        }

        public Notification ReceiveNotification()
        {
            try
            {
                if (_useMsmq)
                {
                    var message = _queue.Receive(TimeSpan.FromSeconds(1));
                    var jsonContent = message.Body.ToString();
                    return JsonConvert.DeserializeObject<Notification>(jsonContent);
                }
                else
                {
                    // In-memory fallback
                    if (_inMemoryQueue.TryDequeue(out var jsonContent))
                    {
                        return JsonConvert.DeserializeObject<Notification>(jsonContent);
                    }
                    return null;
                }
            }
            catch (System.Messaging.MessageQueueException ex) when (ex.MessageQueueErrorCode == System.Messaging.MessageQueueErrorCode.IOTimeout)
            {
                // No messages available
                return null;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Failed to receive notification: {ex.Message}");
                return null;
            }
        }

        public void MarkAsRead(int notificationId)
        {
            // In a real implementation, you might want to store notifications in database as well
            // for persistence and tracking read status
        }

        private string GenerateMessage(string entityType, string entityId, string entityDisplayName, EntityOperation operation)
        {
            var displayText = !string.IsNullOrWhiteSpace(entityDisplayName) 
                ? $"{entityType} '{entityDisplayName}'" 
                : $"{entityType} (ID: {entityId})";

            switch (operation)
            {
                case EntityOperation.CREATE:
                    return $"New {displayText} has been created";
                case EntityOperation.UPDATE:
                    return $"{displayText} has been updated";
                case EntityOperation.DELETE:
                    return $"{displayText} has been deleted";
                default:
                    return $"{displayText} operation: {operation}";
            }
        }

        public void Dispose()
        {
            _queue?.Dispose();
        }
    }
}
