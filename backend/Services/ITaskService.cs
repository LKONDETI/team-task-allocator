using TeamTaskAllocator.DTOs;

namespace TeamTaskAllocator.Services;

public interface ITaskService
{
    Task<TaskResponseDto> CreateAsync(CreateTaskDto dto, int managerId);
    Task<IEnumerable<TaskResponseDto>> GetByAssigneeAsync(int assigneeId);
    Task<IEnumerable<TaskResponseDto>> GetByManagerAsync(int managerId);
}
