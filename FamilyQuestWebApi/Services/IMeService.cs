namespace FamilyQuestWebApi.Services
{
    public interface IMeService
    {
        Task<UserResponse?> GetCurrentUserAsync();

        Task<ServiceResult<UserResponse>> UpdateCurrentUserAsync(UpdateCurrentUserRequest request);

        Task<ServiceResult<ParentChildResponse>> UpdateChildProfileAsync(int childId, UpdateChildProfileRequest request);

        Task<IEnumerable<TaskResponse>> GetTasksAsync();

        Task<IEnumerable<RewardResponse>> GetRewardsAsync();

        Task<ServiceResult<bool>> SuggestRewardAsync(SuggestRewardRequest request);

        Task<IEnumerable<MessageResponse>> GetMessagesAsync();

        Task<IEnumerable<ParentChildResponse>> GetChildrenAsync();
    }
}
