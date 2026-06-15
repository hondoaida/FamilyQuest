using System.ComponentModel.DataAnnotations;
using FamilyQuestWebApi.Models.Entities;

namespace FamilyQuestWebApi.Services
{
    public class LoginRequest
    {
        [Required]
        [MaxLength(100)]
        public string Email { get; set; } = null!;

        [Required]
        public string Password { get; set; } = null!;
    }

    public record LoginResponse(
        string Token,
        DateTime ExpiresAt,
        AuthUserResponse User);

    public record AuthUserResponse(
        int Id,
        string Name,
        string? Email,
        UserRole Role,
        DateTime CreatedAt,
        bool IsActive,
        string AvatarKey);

    public record TokenResponse(
        string Token,
        DateTime ExpiresAt);
}

