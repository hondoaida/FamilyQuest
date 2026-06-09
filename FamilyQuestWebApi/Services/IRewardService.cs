namespace FamilyQuestWebApi.Services
{
    public interface IRewardService
    {
        Task<IEnumerable<RewardResponse>> GetRewardsAsync();

        Task<ServiceResult<RewardResponse>> GetRewardAsync(int id);

        Task<ServiceResult<RewardResponse>> CreateRewardAsync(CreateRewardRequest request);

        Task<ServiceResult<bool>> UpdateRewardActiveStatusAsync(int id, UpdateRewardActiveStatusRequest request);
    }
}
