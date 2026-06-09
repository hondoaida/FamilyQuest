using System.ComponentModel.DataAnnotations;

namespace FamilyQuestWebApi.Services
{
    public class CreateMessageRequest
    {
        [Required]
        public int ReceiverId { get; set; }

        [Required]
        [MaxLength(1000)]
        public string Content { get; set; } = null!;
    }

    public record MessageResponse(
        int Id,
        int SenderId,
        int ReceiverId,
        string Content,
        DateTime SentAt);
}
