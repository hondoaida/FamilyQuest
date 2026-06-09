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

        [Required]
        [EnumDataType(typeof(UserRole))]
        public UserRole Role { get; set; }
    }

    public record UserResponse(
        int Id,
        string Name,
        string? Email,
        UserRole Role,
        DateTime CreatedAt,
        bool IsActive);
}
