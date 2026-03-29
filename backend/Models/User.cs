// See docs/adr/001-database-schema.md — Decision 1: Skills stored as PostgreSQL native TEXT[].

namespace TeamTaskAllocator.Models;

public class User
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    // Unique index configured in TaskAllocatorContext.OnModelCreating.
    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    // "manager" or "employee" — see CLAUDE.md Roles section.
    public string Role { get; set; } = string.Empty;

    // See docs/adr/001-database-schema.md — Decision 1: Skills storage.
    // Column type text[] and default '{}' are configured via Fluent API, not attributes.
    public string[] Skills { get; set; } = [];

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
