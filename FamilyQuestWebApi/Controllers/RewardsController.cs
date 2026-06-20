using FamilyQuestWebApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FamilyQuestWebApi.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class RewardsController : ControllerBase
    {
        private readonly IRewardService _rewardService;

        public RewardsController(IRewardService rewardService)
        {
            _rewardService = rewardService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<RewardResponse>>> GetRewards()
        {
            var rewards = await _rewardService.GetRewardsAsync();
            return Ok(rewards);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<RewardResponse>> GetReward(int id)
        {
            var result = await _rewardService.GetRewardAsync(id);
            return ToActionResult(result);
        }

        [HttpPost]
        [Authorize(Roles = "Parent,Admin")]
        public async Task<ActionResult<RewardResponse>> CreateReward(CreateRewardRequest request)
        {
            var result = await _rewardService.CreateRewardAsync(request);

            if (!result.IsSuccess)
            {
                return ToActionResult(result);
            }

            return Created($"/api/rewards/{result.Value!.Id}", result.Value);
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Parent,Admin")]
        public async Task<ActionResult<RewardResponse>> UpdateReward(int id, UpdateRewardRequest request)
        {
            var result = await _rewardService.UpdateRewardAsync(id, request);
            return ToActionResult(result);
        }

        [HttpPut("{id:int}/active")]
        [Authorize(Roles = "Parent,Admin")]
        public async Task<IActionResult> UpdateRewardActiveStatus(int id, UpdateRewardActiveStatusRequest request)
        {
            var result = await _rewardService.UpdateRewardActiveStatusAsync(id, request);
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

        private IActionResult ToActionResult(ServiceResult<bool> result)
        {
            if (result.IsSuccess)
            {
                return NoContent();
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
