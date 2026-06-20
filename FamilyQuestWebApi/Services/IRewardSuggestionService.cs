using FamilyQuestWebApi.Models.Entities;

namespace FamilyQuestWebApi.Services
{
    public interface IRewardSuggestionService
    {
        Task<IEnumerable<RewardSuggestionResponse>> GetRewardSuggestionsAsync();

        Task<ServiceResult<RewardSuggestionResponse>> GetRewardSuggestionAsync(int id);

        Task<ServiceResult<RewardSuggestionResponse>> UpdateRewardSuggestionStatusAsync(int id, UpdateRewardSuggestionStatusRequest request);
    }
}
