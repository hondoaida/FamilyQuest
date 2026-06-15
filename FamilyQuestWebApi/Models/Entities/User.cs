using System.ComponentModel.DataAnnotations;

namespace FamilyQuestWebApi.Models.Entities
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = null!;

        [MaxLength(100)]
        public string? Email { get; set; }

        [Required]
        [MaxLength(100)]
        public string PasswordHash { get; set; } = null!;

        [Required]
        public UserRole Role { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public bool IsActive { get; set; } = true;

        [Required]
        [MaxLength(50)]
        public string AvatarKey { get; set; } = "mum-one";

        // Navigacijske kolekcije
        public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();

        public ICollection<Reward> Rewards { get; set; } = new List<Reward>();
    }

    public enum UserRole
    {
        Parent = 1,
        Child = 2,
        Admin = 3
    }
}
