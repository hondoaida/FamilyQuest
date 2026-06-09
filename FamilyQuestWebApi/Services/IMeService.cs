namespace FamilyQuestWebApi.Services
{
    public interface IMeService
    {
        Task<UserResponse?> GetCurrentUserAsync();

        Task<IEnumerable<TaskResponse>> GetTasksAsync();

        Task<IEnumerable<RewardResponse>> GetRewardsAsync();

        Task<IEnumerable<MessageResponse>> GetMessagesAsync();

        Task<IEnumerable<ParentChildResponse>> GetChildrenAsync();
    }
}
