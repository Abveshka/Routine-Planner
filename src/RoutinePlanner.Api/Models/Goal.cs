using System;
using System.Collections.Generic;
using System.Linq;

namespace RoutinePlanner.Api.Models;

public class Goal
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Year { get; set; }
    public Season Season { get; set; }
    public SubPeriod SubPeriod { get; set; }
    // Если задано вручную — используется это значение вместо суммы по GoalItems
    public decimal? ManualCost { get; set; }
    public bool IsCompleted { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<GoalItem> Items { get; set; } = new();

    // Не хранится в базе — вычисляется на лету
    public decimal TotalCost => ManualCost ?? Items.Sum(i => i.Cost);
}