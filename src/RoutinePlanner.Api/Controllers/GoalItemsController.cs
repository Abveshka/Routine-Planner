using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RoutinePlanner.Api.Common.Exceptions;
using RoutinePlanner.Api.Data;
using RoutinePlanner.Api.DTOs;
using RoutinePlanner.Api.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace RoutinePlanner.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/goals/{goalId}/items")]
public class GoalItemsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    private string CurrentUserId =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new UnauthorizedAccessException();

    public GoalItemsController(ApplicationDbContext db)
    {
        _db = db;
    }

    // Проверяет, что цель существует и принадлежит текущему пользователю.
    private async Task<Goal> GetOwnedGoalAsync(int goalId)
    {
        var goal = await _db.Goals.FindAsync(goalId)
            ?? throw NotFoundException.For<Goal>(goalId);

        if (goal.UserId != CurrentUserId)
            throw new ForbiddenException();

        return goal;
    }

    [HttpPost]
    public async Task<ActionResult<GoalItemDto>> Add(int goalId, CreateGoalItemRequest req)
    {
        await GetOwnedGoalAsync(goalId);

        var item = new GoalItem
        {
            GoalId = goalId,
            Title = req.Title,
            Cost = req.Cost
        };

        _db.GoalItems.Add(item);
        await _db.SaveChangesAsync();

        return Ok(new GoalItemDto(item.Id, item.Title, item.Cost, item.IsCompleted, item.CreatedAt));
    }

    [HttpPut("{itemId}")]
    public async Task<IActionResult> Update(int goalId, int itemId, CreateGoalItemRequest req)
    {
        await GetOwnedGoalAsync(goalId);

        var item = await _db.GoalItems.FirstOrDefaultAsync(i => i.Id == itemId && i.GoalId == goalId)
            ?? throw NotFoundException.For<GoalItem>(itemId);

        item.Title = req.Title;
        item.Cost = req.Cost;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{itemId}/toggle")]
    public async Task<IActionResult> ToggleCompleted(int goalId, int itemId)
    {
        await GetOwnedGoalAsync(goalId);

        var item = await _db.GoalItems.FirstOrDefaultAsync(i => i.Id == itemId && i.GoalId == goalId)
            ?? throw NotFoundException.For<GoalItem>(itemId);

        item.IsCompleted = !item.IsCompleted;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{itemId}")]
    public async Task<IActionResult> Delete(int goalId, int itemId)
    {
        await GetOwnedGoalAsync(goalId);

        var item = await _db.GoalItems.FirstOrDefaultAsync(i => i.Id == itemId && i.GoalId == goalId)
            ?? throw NotFoundException.For<GoalItem>(itemId);

        _db.GoalItems.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}