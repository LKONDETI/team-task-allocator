// See docs/adr/001-database-schema.md — Decision 3: Repository pattern.

using TeamTaskAllocator.DTOs;
using TeamTaskAllocator.Models;
using TeamTaskAllocator.Repositories;

namespace TeamTaskAllocator.Services;

public class TaskService : ITaskService
{
    private readonly ITaskRepository _taskRepository;
    private readonly IUserRepository _userRepository;

    public TaskService(ITaskRepository taskRepository, IUserRepository userRepository)
    {
        _taskRepository = taskRepository;
        _userRepository = userRepository;
    }

    public async Task<TaskResponseDto> CreateAsync(CreateTaskDto dto, int managerId)
    {
        // Validate that the assignee exists and is an employee
        var assignee = await _userRepository.GetByIdAsync(dto.AssigneeId);
        if (assignee is null || assignee.Role != "employee")
            throw new ArgumentException($"AssigneeId {dto.AssigneeId} does not refer to a valid employee.");

        var manager = await _userRepository.GetByIdAsync(managerId);
        if (manager is null)
            throw new ArgumentException($"Manager with id {managerId} not found.");

        var task = new TaskEntity
        {
            Title = dto.Title,
            Description = dto.Description,
            AssigneeId = dto.AssigneeId,
            // ManagerId always comes from the JWT claim, never from the request body
            ManagerId = managerId,
            Deadline = dto.Deadline.ToUniversalTime(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var created = await _taskRepository.CreateAsync(task);

        return MapToDto(created, assignee.Name, manager.Name);
    }

    public async Task<IEnumerable<TaskResponseDto>> GetByAssigneeAsync(int assigneeId)
    {
        var tasks = await _taskRepository.GetByAssigneeIdAsync(assigneeId);

        return tasks.Select(t => MapToDto(t, t.Assignee?.Name ?? string.Empty, t.Manager?.Name ?? string.Empty));
    }

    public async Task<IEnumerable<TaskResponseDto>> GetByManagerAsync(int managerId)
    {
        var tasks = await _taskRepository.GetByManagerIdAsync(managerId);

        return tasks.Select(t => MapToDto(t, t.Assignee?.Name ?? string.Empty, t.Manager?.Name ?? string.Empty));
    }

    private static TaskResponseDto MapToDto(TaskEntity task, string assigneeName, string managerName) =>
        new()
        {
            Id = task.Id,
            Title = task.Title,
            Description = task.Description,
            AssigneeId = task.AssigneeId,
            AssigneeName = assigneeName,
            ManagerId = task.ManagerId,
            ManagerName = managerName,
            Deadline = task.Deadline,
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt
        };
}
