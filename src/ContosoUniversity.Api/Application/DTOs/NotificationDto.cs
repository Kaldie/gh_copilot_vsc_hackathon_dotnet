namespace ContosoUniversity.Api.Application.DTOs;

public record NotificationDto(
    int NotificationId,
    string EntityType,
    int EntityId,
    string Operation,
    string Message,
    DateTime CreatedAt,
    string CreatedBy,
    bool IsRead,
    DateTime? ReadAt
);
