using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using RoutinePlanner.Api.Models;

namespace RoutinePlanner.Api.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Goal> Goals { get; set; }
    public DbSet<GoalItem> GoalItems { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Goal>()
            .HasMany(g => g.Items)
            .WithOne(i => i.Goal)
            .HasForeignKey(i => i.GoalId)
            .OnDelete(DeleteBehavior.Cascade);

        // TotalCost — вычисляемое свойство, не хранится в базе
        builder.Entity<Goal>()
            .Ignore(g => g.TotalCost);
    }
}