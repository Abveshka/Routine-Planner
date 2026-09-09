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
[Route("api/goals")]
public class GoalsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    
    private string CurrentUserId =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new UnauthorizedAccessException();

    public GoalsController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<GoalDto>>> GetAll()
    {
        var goals = await _db.Goals
            .Where(g => g.UserId == CurrentUserId)
            .Include(g => g.Items)
            .OrderBy(g => g.Year)
            .ThenBy(g => g.Season)
            .ThenBy(g => g.SubPeriod)
            .ToListAsync();

        return Ok(goals.Select(ToDto));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<GoalDto>> GetById(int id)
    {
        var goal = await _db.Goals
                       .Include(g => g.Items)
                       .FirstOrDefaultAsync(g => g.Id == id)
                   ?? throw NotFoundException.For<Goal>(id);

        if (goal.UserId != CurrentUserId)
            throw new ForbiddenException();

        return Ok(ToDto(goal));
    }

    [HttpPost]
    public async Task<ActionResult<GoalDto>> Create(CreateGoalRequest req)
    {
        var goal = new Goal
        {
            Title = req.Title,
            UserId = CurrentUserId,
            Description = req.Description,
            Year = req.Year,
            Season = req.Season,
            SubPeriod = req.SubPeriod,
            ManualCost = req.ManualCost
        };

        _db.Goals.Add(goal);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = goal.Id }, ToDto(goal));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, CreateGoalRequest req)
    {
        var goal = await _db.Goals.FindAsync(id)
            ?? throw NotFoundException.For<Goal>(id);
        
        if (goal.UserId != CurrentUserId)
            throw new ForbiddenException();
        
        goal.Title = req.Title;
        goal.Description = req.Description;
        goal.Year = req.Year;
        goal.Season = req.Season;
        goal.SubPeriod = req.SubPeriod;
        goal.ManualCost = req.ManualCost;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id}/toggle")]
    public async Task<IActionResult> ToggleCompleted(int id)
    {
        var goal = await _db.Goals.FindAsync(id)
            ?? throw NotFoundException.For<Goal>(id);

        if (goal.UserId != CurrentUserId)
            throw new ForbiddenException();
        
        goal.IsCompleted = !goal.IsCompleted;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var goal = await _db.Goals.FindAsync(id)
            ?? throw NotFoundException.For<Goal>(id);

        if (goal.UserId != CurrentUserId)
            throw new ForbiddenException();
        
        _db.Goals.Remove(goal);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static GoalDto ToDto(Goal g) => new(
        g.Id,
        g.Title,
        g.Description,
        g.Year,
        g.Season,
        g.SubPeriod,
        g.TotalCost,
        g.IsCompleted,
        g.CreatedAt,
        g.Items.Select(i => new GoalItemDto(i.Id, i.Title, i.Cost, i.IsCompleted, i.CreatedAt)).ToList());
}