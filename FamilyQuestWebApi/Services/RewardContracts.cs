using System.ComponentModel.DataAnnotations;

namespace FamilyQuestWebApi.Services
{
    public class CreateRewardRequest
    {
        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = null!;

        [MaxLength(200)]
        public string? Description { get; set; }

        [MaxLength(50)]
        public string? IconKey { get; set; }

        [Required]
        public int RequiredPoints { get; set; }

        [Required]
        public DateTime DueDate { get; set; }

        [Required]
        public int ChildId { get; set; }
    }

    public class UpdateRewardActiveStatusRequest
    {
        [Required]
        public bool IsActive { get; set; }
    }

    public class UpdateRewardRequest
    {
        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = null!;

        [MaxLength(200)]
        public string? Description { get; set; }

        [MaxLength(50)]
        public string? IconKey { get; set; }

        [Required]
        public int RequiredPoints { get; set; }

        [Required]
        public DateTime DueDate { get; set; }

        [Required]
        public bool IsActive { get; set; }
    }

    public class SuggestRewardRequest
    {
        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = null!;

        [Required]
        public DateTime DueDate { get; set; }

        [MaxLength(50)]
        public string? IconKey { get; set; }
    }

    public class UpdateRewardSuggestionStatusRequest
    {
        [Required]
        public FamilyQuestWebApi.Models.Entities.RewardSuggestionStatus Status { get; set; }

        public int? RequiredPoints { get; set; }

        public DateTime? DueDate { get; set; }
    }

    public record RewardResponse(
        int Id,
        string Name,
        string? Description,
        string IconKey,
        int RequiredPoints,
        DateTime DueDate,
        bool IsActive,
        int ChildId);

    public record RewardSuggestionResponse(
        int Id,
        string Name,
        string IconKey,
        DateTime DueDate,
        int? RequiredPoints,
        FamilyQuestWebApi.Models.Entities.RewardSuggestionStatus Status,
        DateTime SuggestedAt,
        DateTime? ReviewedAt,
        int ChildId,
        string ChildName,
        string? ChildAvatarKey,
        int? RewardId);
}
