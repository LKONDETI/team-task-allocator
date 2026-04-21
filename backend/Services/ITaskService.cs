using TeamTaskAllocator.DTOs;
using TeamTaskAllocator.Models;

namespace TeamTaskAllocator.Services;

public interface ITaskService
{
    Task<TaskResponseDto> CreateAsync(CreateTaskDto dto, int managerId);
    Task<IEnumerable<TaskResponseDto>> GetByAssigneeAsync(int assigneeId);
    Task<IEnumerable<TaskResponseDto>> GetByManagerAsync(int managerId);
    Task<bool> DeleteAsync(int taskId, int requestingManagerId);
    Task<TaskResponseDto?> UpdateStatusAsync(int taskId, int requestingUserId, WorkStatus newStatus);
}
