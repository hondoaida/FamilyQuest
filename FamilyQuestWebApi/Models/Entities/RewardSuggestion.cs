using System.ComponentModel.DataAnnotations;

namespace FamilyQuestWebApi.Models.Entities
{
    public class RewardSuggestion
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = null!;

        [MaxLength(50)]
        public string IconKey { get; set; } = "gamepad";

        [Required]
        public DateTime DueDate { get; set; }

        public int? RequiredPoints { get; set; }

        public RewardSuggestionStatus Status { get; set; } = RewardSuggestionStatus.Pending;

        public DateTime SuggestedAt { get; set; } = DateTime.Now;

        public DateTime? ReviewedAt { get; set; }

        public int ChildId { get; set; }

        public User Child { get; set; } = null!;

        public int ParentId { get; set; }

        public User Parent { get; set; } = null!;

        public int? RewardId { get; set; }

        public Reward? Reward { get; set; }
    }

    public enum RewardSuggestionStatus
    {
        Pending = 1,
        Approved = 2,
        Rejected = 3
    }
}
