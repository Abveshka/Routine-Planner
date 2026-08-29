using RoutinePlanner.Api.Models;
namespace RoutinePlanner.Api.DTOs;

public record GoalDto(
    int Id,
    string Title,
    string? Description,
    int Year,
    Season Season,
    SubPeriod SubPeriod,
    decimal TotalCost,
    bool IsCompleted,
    DateTime CreatedAt,
    List<GoalItemDto> Items);