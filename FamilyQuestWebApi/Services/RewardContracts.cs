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

        [Required]
        public int RequiredPoints { get; set; }

        [Required]
        public int ChildId { get; set; }
    }

    public class UpdateRewardActiveStatusRequest
    {
        [Required]
        public bool IsActive { get; set; }
    }

    public record RewardResponse(
        int Id,
        string Name,
        string? Description,
        int RequiredPoints,
        bool IsActive,
        int ChildId);
}
