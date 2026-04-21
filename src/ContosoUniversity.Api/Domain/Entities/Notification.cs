namespace ContosoUniversity.Api.Domain.Entities;

public class Notification
{
    public int NotificationId { get; set; }

    public string EntityType { get; set; } = string.Empty;

    public int EntityId { get; set; }

    public string Operation { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public string CreatedBy { get; set; } = "admin";

    public bool IsRead { get; set; }

    public DateTime? ReadAt { get; set; }
}
