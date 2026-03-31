using TeamTaskAllocator.DTOs;

namespace TeamTaskAllocator.Services;

public interface IUserService
{
    Task<IEnumerable<UserSearchResultDto>> SearchAsync(string query);
}
