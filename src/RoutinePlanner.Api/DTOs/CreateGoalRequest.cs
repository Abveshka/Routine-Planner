using RoutinePlanner.Api.Models;

namespace RoutinePlanner.Api.DTOs;

public record CreateGoalRequest(
    string Title,
    string? Description,
    int Year,
    Season Season,
    SubPeriod SubPeriod,
    decimal? ManualCost);