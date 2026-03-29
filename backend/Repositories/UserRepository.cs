// See docs/adr/001-database-schema.md — Decision 2: Search strategy.
// See docs/adr/001-database-schema.md — Decision 3: Repository pattern.

using Microsoft.EntityFrameworkCore;
using TeamTaskAllocator.Data.Context;
using TeamTaskAllocator.Models;

namespace TeamTaskAllocator.Repositories;

public class UserRepository : IUserRepository
{
    private readonly TaskAllocatorContext _context;

    public UserRepository(TaskAllocatorContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByIdAsync(int id)
    {
        return await _context.Users.FindAsync(id);
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<IEnumerable<User>> GetAllEmployeesAsync()
    {
        return await _context.Users
            .Where(u => u.Role == "employee")
            .ToListAsync();
    }

    // See docs/adr/001-database-schema.md — Decision 2: Search strategy.
    // ILike = case-insensitive LIKE on PostgreSQL (via Npgsql).
    // u.Skills.Contains(query) maps to: query = ANY(skills) in SQL.
    public async Task<IEnumerable<User>> SearchByNameOrSkillAsync(string query)
    {
        return await _context.Users
            .Where(u =>
                EF.Functions.ILike(u.Name, $"%{query}%") ||
                u.Skills.Contains(query))
            .ToListAsync();
    }

    public async Task<User> CreateAsync(User user)
    {
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }
}
