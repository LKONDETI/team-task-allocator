// See docs/adr/001-database-schema.md — Decision 3: Repository pattern.

using Microsoft.EntityFrameworkCore;
using TeamTaskAllocator.Data.Context;
using TeamTaskAllocator.Models;

namespace TeamTaskAllocator.Repositories;

public class TaskRepository : ITaskRepository
{
    private readonly TaskAllocatorContext _context;

    public TaskRepository(TaskAllocatorContext context)
    {
        _context = context;
    }

    public async Task<TaskEntity?> GetByIdAsync(int id)
    {
        return await _context.Tasks
            .Include(t => t.Assignee)
            .Include(t => t.Manager)
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<IEnumerable<TaskEntity>> GetByAssigneeIdAsync(int assigneeId)
    {
        return await _context.Tasks
            .Where(t => t.AssigneeId == assigneeId)
            .Include(t => t.Manager)
            .ToListAsync();
    }

    public async Task<TaskEntity> CreateAsync(TaskEntity task)
    {
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();
        return task;
    }

    public async Task<IEnumerable<TaskEntity>> GetByManagerIdAsync(int managerId)
    {
        return await _context.Tasks
            .Where(t => t.ManagerId == managerId)
            .Include(t => t.Assignee)
            .Include(t => t.Manager)
            .ToListAsync();
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task is null) return false;

        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<TaskEntity?> UpdateStatusAsync(int id, WorkStatus status)
    {
        var task = await _context.Tasks
            .Include(t => t.Assignee)
            .Include(t => t.Manager)
            .FirstOrDefaultAsync(t => t.Id == id);
        if (task is null) return null;

        task.Status = status;
        await _context.SaveChangesAsync();
        return task;
    }
}
