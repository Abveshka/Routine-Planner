namespace RoutinePlanner.Api.DTOs;

public record CreateGoalItemRequest(
    string Title,
    decimal Cost);