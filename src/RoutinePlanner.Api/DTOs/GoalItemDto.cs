namespace RoutinePlanner.Api.DTOs;

public record GoalItemDto(
    int Id,
    string Title,
    decimal Cost,
    bool IsCompleted,
    DateTime CreatedAt);