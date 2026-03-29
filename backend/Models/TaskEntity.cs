// Using TaskEntity (not Task) to avoid conflict with System.Threading.Tasks.Task.
// See docs/adr/001-database-schema.md — Decision 3: Repository pattern.

namespace TeamTaskAllocator.Models;

public class TaskEntity
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    // FK to Users — configured with OnDelete(Restrict) in TaskAllocatorContext.
    public int AssigneeId { get; set; }
    public User Assignee { get; set; } = null!;

    // FK to Users — configured with OnDelete(Restrict) in TaskAllocatorContext.
    public int ManagerId { get; set; }
    public User Manager { get; set; } = null!;

    public DateTime Deadline { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Auto-updated on every SaveChangesAsync via TaskAllocatorContext override.
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
