using System;

namespace RoutinePlanner.Api.Models;

public class GoalItem
{
    public int Id { get; set; }
    public int GoalId { get; set; }
    public Goal? Goal { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal Cost { get; set; }
    public bool IsCompleted { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}