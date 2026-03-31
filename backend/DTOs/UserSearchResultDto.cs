namespace TeamTaskAllocator.DTOs;

public class UserSearchResultDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string[] Skills { get; set; } = [];
}
