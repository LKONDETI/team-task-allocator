// See docs/adr/001-database-schema.md — Decision 2: Search strategy.

using TeamTaskAllocator.DTOs;
using TeamTaskAllocator.Repositories;

namespace TeamTaskAllocator.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;

    public UserService(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<IEnumerable<UserSearchResultDto>> SearchAsync(string query)
    {
        var users = await _userRepository.SearchByNameOrSkillAsync(query);

        return users.Select(u => new UserSearchResultDto
        {
            Id = u.Id,
            Name = u.Name,
            Email = u.Email,
            Skills = u.Skills
        });
    }
}
