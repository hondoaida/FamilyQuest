using System.ComponentModel.DataAnnotations;

namespace FamilyQuestWebApi.Models.Entities
{
    public class Reward
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = null!;

        [MaxLength(200)]
        public string? Description { get; set; }

        [Required]
        public int RequiredPoints { get; set; }

        public bool IsActive { get; set; } = true;

        // FK prema User (dijete)
        public int ChildId { get; set; }

        public User Child { get; set; } = null!;
    }
}

public enum RewardRequestStatus
{
    Pending = 1,
    Approved = 2,
    Rejected = 3
}