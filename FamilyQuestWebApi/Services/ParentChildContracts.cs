using System.ComponentModel.DataAnnotations;

namespace FamilyQuestWebApi.Services
{
    public class CreateParentChildRequest
    {
        public int? ParentId { get; set; }

        [Required]
        public int ChildId { get; set; }
    }

    public record ParentChildResponse(
        int Id,
        int ParentId,
        int ChildId,
        string ChildName,
        string? ChildEmail,
        string ChildAvatarKey);
}
