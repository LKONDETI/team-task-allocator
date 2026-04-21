using System.ComponentModel.DataAnnotations;
using TeamTaskAllocator.Models;

namespace TeamTaskAllocator.DTOs;

public class UpdateTaskStatusDto
{
    [Required]
    public WorkStatus Status { get; set; }
}
