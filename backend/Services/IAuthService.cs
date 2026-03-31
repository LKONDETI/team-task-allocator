using TeamTaskAllocator.DTOs;

namespace TeamTaskAllocator.Services;

public interface IAuthService
{
    Task<LoginResponseDto> LoginAsync(LoginRequestDto dto);
}
