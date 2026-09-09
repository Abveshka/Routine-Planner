using Microsoft.AspNetCore.Identity;            
using Microsoft.AspNetCore.Mvc;
using RoutinePlanner.Api.Models;                 
using RoutinePlanner.Api.Services;                    
using RoutinePlanner.Api.DTOs;                           

namespace RoutinePlanner.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly TokenService _tokenService;

    public AuthController(UserManager<ApplicationUser> userManager, TokenService tokenService)
    {
        _userManager = userManager;
        _tokenService = tokenService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var user = new ApplicationUser { UserName = request.Email, Email = request.Email };
        var result = await _userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
            return ValidationProblem(new ValidationProblemDetails(
                result.Errors.ToDictionary(e => e.Code, e => new[] { e.Description })));

        var token = _tokenService.GenerateToken(user);
        return Ok(new { token });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null || !await _userManager.CheckPasswordAsync(user, request.Password))
            return Unauthorized(new { message = "Неверный email или пароль" });

        var token = _tokenService.GenerateToken(user);
        return Ok(new { token });
    }
}