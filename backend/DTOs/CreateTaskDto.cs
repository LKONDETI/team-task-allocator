using System.ComponentModel.DataAnnotations;

namespace TeamTaskAllocator.DTOs;

public class CreateTaskDto
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    [Required]
    public int AssigneeId { get; set; }

    [Required]
    public DateTime Deadline { get; set; }
}
