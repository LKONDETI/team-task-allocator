// Seed data for Development environment only.
// Credentials are intentionally weak — never use in production.
// 2 managers, 3 employees with sample skills.

using Microsoft.EntityFrameworkCore;
using TeamTaskAllocator.Data.Context;
using TeamTaskAllocator.Models;

namespace TeamTaskAllocator.Models;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<TaskAllocatorContext>();

        // Only seed if no users exist yet
        if (await context.Users.AnyAsync())
            return;

        var users = new List<User>
        {
            new()
            {
                Name = "Alice Manager",
                Email = "alice.manager@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
                Role = "manager",
                Skills = [],
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Name = "Bob Manager",
                Email = "bob.manager@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
                Role = "manager",
                Skills = [],
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Name = "Carol Employee",
                Email = "carol@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
                Role = "employee",
                Skills = ["React", "TypeScript", "CSS"],
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Name = "David Employee",
                Email = "david@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
                Role = "employee",
                Skills = [".NET", "C#", "PostgreSQL"],
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Name = "Eve Employee",
                Email = "eve@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
                Role = "employee",
                Skills = ["React", ".NET", "Docker"],
                CreatedAt = DateTime.UtcNow
            }
        };

        context.Users.AddRange(users);
        await context.SaveChangesAsync();
    }
}
