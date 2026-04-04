// See docs/adr/001-database-schema.md — Decision 3: Repository pattern.

using TeamTaskAllocator.Models;

namespace TeamTaskAllocator.Repositories;

public interface ITaskRepository
{
    Task<TaskEntity?> GetByIdAsync(int id);
    Task<IEnumerable<TaskEntity>> GetByAssigneeIdAsync(int assigneeId);
    Task<TaskEntity> CreateAsync(TaskEntity task);
    Task<IEnumerable<TaskEntity>> GetByManagerIdAsync(int managerId);
}
