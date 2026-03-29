// See docs/adr/001-database-schema.md for all architectural decisions referenced here.

using Microsoft.EntityFrameworkCore;
using TeamTaskAllocator.Models;

namespace TeamTaskAllocator.Data.Context;

public class TaskAllocatorContext : DbContext
{
    public TaskAllocatorContext(DbContextOptions<TaskAllocatorContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<TaskEntity> Tasks => Set<TaskEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── User ────────────────────────────────────────────────────────────────
        modelBuilder.Entity<User>(builder =>
        {
            // Unique index on Email.
            builder.HasIndex(u => u.Email).IsUnique();

            // See docs/adr/001-database-schema.md — Decision 1: Skills storage.
            // PostgreSQL native TEXT[] column with empty-array default.
            builder.Property(u => u.Skills)
                .HasColumnType("text[]")
                .HasDefaultValueSql("'{}'");

            builder.Property(u => u.CreatedAt)
                .HasDefaultValueSql("now() AT TIME ZONE 'utc'");
        });

        // ── TaskEntity ──────────────────────────────────────────────────────────
        modelBuilder.Entity<TaskEntity>(builder =>
        {
            // See docs/adr/001-database-schema.md — Decision 3: Repository pattern.
            // Both FKs point to the Users table; must be configured explicitly so EF
            // does not error on ambiguous relationship detection.
            builder.HasOne(t => t.Assignee)
                .WithMany()
                .HasForeignKey(t => t.AssigneeId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(t => t.Manager)
                .WithMany()
                .HasForeignKey(t => t.ManagerId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Property(t => t.CreatedAt)
                .HasDefaultValueSql("now() AT TIME ZONE 'utc'");

            builder.Property(t => t.UpdatedAt)
                .HasDefaultValueSql("now() AT TIME ZONE 'utc'");
        });
    }

    public override async Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default)
    {
        // Auto-set UpdatedAt on every save for modified TaskEntity entries.
        var modifiedTasks = ChangeTracker.Entries<TaskEntity>()
            .Where(e => e.State == EntityState.Modified);

        foreach (var entry in modifiedTasks)
        {
            entry.Entity.UpdatedAt = DateTime.UtcNow;
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
