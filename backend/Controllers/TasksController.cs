using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeamTaskAllocator.DTOs;
using TeamTaskAllocator.Services;

namespace TeamTaskAllocator.Controllers;

[ApiController]
[Route("api/tasks")]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;

    public TasksController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    // POST /api/tasks — manager only
    [HttpPost]
    [Authorize(Roles = "manager")]
    public async Task<IActionResult> Create([FromBody] CreateTaskDto dto)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        if (!TryGetUserId(out var managerId))
            return Problem(detail: "Unable to identify the authenticated manager.", statusCode: 401);

        try
        {
            var task = await _taskService.CreateAsync(dto, managerId);
            return CreatedAtAction(nameof(GetMyTasks), new { }, task);
        }
        catch (ArgumentException ex)
        {
            return Problem(detail: ex.Message, statusCode: StatusCodes.Status400BadRequest, title: "Bad Request");
        }
    }

    // GET /api/tasks — manager sees tasks they created
    [HttpGet]
    [Authorize(Roles = "manager")]
    public async Task<IActionResult> GetManagerTasks()
    {
        if (!TryGetUserId(out var managerId))
            return Problem(detail: "Unable to identify the authenticated manager.", statusCode: 401);

        var tasks = await _taskService.GetByManagerAsync(managerId);
        return Ok(tasks);
    }

    // GET /api/tasks/my — employee sees their own tasks
    [HttpGet("my")]
    [Authorize]
    public async Task<IActionResult> GetMyTasks()
    {
        if (!TryGetUserId(out var userId))
            return Problem(detail: "Unable to identify the authenticated user.", statusCode: 401);

        var tasks = await _taskService.GetByAssigneeAsync(userId);
        return Ok(tasks);
    }

    // DELETE /api/tasks/{id} — only the manager who created the task can delete it
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "manager")]
    public async Task<IActionResult> Delete(int id)
    {
        if (!TryGetUserId(out var managerId))
            return Problem(detail: "Unable to identify the authenticated manager.", statusCode: 401);

        try
        {
            var deleted = await _taskService.DeleteAsync(id, managerId);
            if (!deleted)
                return Problem(detail: $"Task {id} not found.", statusCode: StatusCodes.Status404NotFound, title: "Not Found");

            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return Problem(detail: ex.Message, statusCode: StatusCodes.Status403Forbidden, title: "Forbidden");
        }
    }

    private bool TryGetUserId(out int userId)
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return int.TryParse(claim, out userId);
    }
}
