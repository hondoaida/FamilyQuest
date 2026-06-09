namespace FamilyQuestWebApi.Services
{
    public interface IRewardRequestService
    {
        Task<IEnumerable<RewardRequestResponse>> GetRewardRequestsAsync();

        Task<ServiceResult<RewardRequestResponse>> GetRewardRequestAsync(int id);

        Task<ServiceResult<RewardRequestResponse>> CreateRewardRequestAsync(CreateRewardRequestRequest request);

        Task<ServiceResult<bool>> UpdateRewardRequestStatusAsync(int id, UpdateRewardRequestStatusRequest request);
    }
}
