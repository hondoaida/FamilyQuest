using System.ComponentModel.DataAnnotations;

namespace FamilyQuestWebApi.Models.Entities
{
    public class TaskItem
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = null!;

        [MaxLength(200)]
        public string? Description { get; set; }

        [Required]
        [MaxLength(50)]
        public string IconKey { get; set; } = "notebook";

        [Required]
        public int Points { get; set; }

        [Required]
        public DateTime DueDate { get; set; }

        [Required]
        public TaskStatus Status { get; set; }

        public string? CompletionImageDataUrl { get; set; }

        public DateTime? SubmittedAt { get; set; }

        // FK prema User (dijete)
        public int ChildId { get; set; }

        public User Child { get; set; } = null!;
    }

    public enum TaskStatus
    {
        Assigned = 1,
        PendingApproval = 2,
        Approved = 3,
        Rejected = 4
    }
}
