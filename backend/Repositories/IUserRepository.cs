// See docs/adr/001-database-schema.md — Decision 3: Repository pattern.

using TeamTaskAllocator.Models;

namespace TeamTaskAllocator.Repositories;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(int id);
    Task<User?> GetByEmailAsync(string email);
    Task<IEnumerable<User>> GetAllEmployeesAsync();

    // See docs/adr/001-database-schema.md — Decision 2: Search strategy.
    // Matches by name (case-insensitive substring) OR exact skill value.
    Task<IEnumerable<User>> SearchByNameOrSkillAsync(string query);

    Task<User> CreateAsync(User user);
}
