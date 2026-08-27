using System.Collections.Generic;
using Microsoft.AspNetCore.Identity;

namespace RoutinePlanner.Api.Models;

public class ApplicationUser : IdentityUser
{
    public List<Goal> Goals { get; set; } = new();
}