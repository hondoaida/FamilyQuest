using FamilyQuestWebApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FamilyQuestWebApi.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class RewardSuggestionsController : ControllerBase
    {
        private readonly IRewardSuggestionService _rewardSuggestionService;

        public RewardSuggestionsController(IRewardSuggestionService rewardSuggestionService)
        {
            _rewardSuggestionService = rewardSuggestionService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<RewardSuggestionResponse>>> GetRewardSuggestions()
        {
            var suggestions = await _rewardSuggestionService.GetRewardSuggestionsAsync();
            return Ok(suggestions);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<RewardSuggestionResponse>> GetRewardSuggestion(int id)
        {
            var result = await _rewardSuggestionService.GetRewardSuggestionAsync(id);
            return ToActionResult(result);
        }

        [HttpPut("{id:int}/status")]
        [Authorize(Roles = "Parent,Admin")]
        public async Task<ActionResult<RewardSuggestionResponse>> UpdateRewardSuggestionStatus(int id, UpdateRewardSuggestionStatusRequest request)
        {
            var result = await _rewardSuggestionService.UpdateRewardSuggestionStatusAsync(id, request);
            return ToActionResult(result);
        }

        private ActionResult<T> ToActionResult<T>(ServiceResult<T> result)
        {
            if (result.IsSuccess)
            {
                return Ok(result.Value);
            }

            return result.ErrorType switch
            {
                ServiceErrorType.NotFound => NotFound(),
                ServiceErrorType.Forbidden => Forbid(),
                ServiceErrorType.Conflict => Conflict(result.ErrorMessage),
                _ => BadRequest(result.ErrorMessage)
            };
        }
    }
}
