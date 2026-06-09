using System.ComponentModel.DataAnnotations;

namespace FamilyQuestWebApi.Services
{
    public class CreateRewardRequestRequest
    {
        [Required]
        public int RewardId { get; set; }
    }

    public class UpdateRewardRequestStatusRequest
    {
        [Required]
        [EnumDataType(typeof(global::RewardRequestStatus))]
        public global::RewardRequestStatus Status { get; set; }
    }

    public record RewardRequestResponse(
        int Id,
        int RewardId,
        int ChildId,
        global::RewardRequestStatus Status,
        DateTime RequestDate);
}
