using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeamTaskAllocator.Services;

namespace TeamTaskAllocator.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    // GET /api/users/search?q={query}
    [HttpGet("search")]
    [Authorize(Roles = "manager")]
    public async Task<IActionResult> Search([FromQuery] string? q)
    {
        if (string.IsNullOrWhiteSpace(q))
            return Problem(
                detail: "Query parameter 'q' is required.",
                statusCode: StatusCodes.Status400BadRequest,
                title: "Bad Request"
            );

        var results = await _userService.SearchAsync(q);
        return Ok(results);
    }
}
