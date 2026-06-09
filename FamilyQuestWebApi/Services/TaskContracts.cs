using System.ComponentModel.DataAnnotations;
using TaskStatus = FamilyQuestWebApi.Models.Entities.TaskStatus;

namespace FamilyQuestWebApi.Services
{
    public class CreateTaskRequest
    {
        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = null!;

        [MaxLength(200)]
        public string? Description { get; set; }

        [Required]
        public int Points { get; set; }

        [Required]
        public DateTime DueDate { get; set; }

        [Required]
        [EnumDataType(typeof(TaskStatus))]
        public TaskStatus Status { get; set; } = TaskStatus.Assigned;

        [Required]
        public int ChildId { get; set; }
    }

    public class UpdateTaskStatusRequest
    {
        [Required]
        [EnumDataType(typeof(TaskStatus))]
        public TaskStatus Status { get; set; }
    }

    public record TaskResponse(
        int Id,
        string Name,
        string? Description,
        int Points,
        DateTime DueDate,
        TaskStatus Status,
        int ChildId);
}
