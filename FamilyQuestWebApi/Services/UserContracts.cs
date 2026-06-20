using System.ComponentModel.DataAnnotations;
using FamilyQuestWebApi.Models.Entities;

namespace FamilyQuestWebApi.Services
{
    public class CreateUserRequest
    {
        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = null!;

        [MaxLength(100)]
        public string? Email { get; set; }

        [Required]
        public string Password { get; set; } = null!;

        [MaxLength(50)]
        public string? AvatarKey { get; set; }

        [Required]
        [EnumDataType(typeof(UserRole))]
        public UserRole Role { get; set; }
    }

    public class UpdateCurrentUserRequest
    {
        [MaxLength(100)]
        public string? Email { get; set; }

        [MaxLength(50)]
        public string? AvatarKey { get; set; }

        public string? CurrentPassword { get; set; }

        public string? NewPassword { get; set; }
    }

    public record UserResponse(
        int Id,
        string Name,
        string? Email,
        UserRole Role,
        DateTime CreatedAt,
        bool IsActive,
        string AvatarKey);
}

