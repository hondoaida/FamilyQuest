using FamilyQuestWebApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FamilyQuestWebApi.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/me")]
    public class MeController : ControllerBase
    {
        private readonly IMeService _meService;

        public MeController(IMeService meService)
        {
            _meService = meService;
        }

        [HttpGet]
        public async Task<ActionResult<UserResponse>> GetMe()
        {
            var user = await _meService.GetCurrentUserAsync();
            return user == null ? NotFound() : Ok(user);
        }

        [HttpPatch]
        public async Task<ActionResult<UserResponse>> UpdateMe(UpdateCurrentUserRequest request)
        {
            var result = await _meService.UpdateCurrentUserAsync(request);

            if (result.IsSuccess)
            {
                return Ok(result.Value);
            }

            return result.ErrorType switch
            {
                ServiceErrorType.NotFound => NotFound(result.ErrorMessage),
                ServiceErrorType.Conflict => Conflict(result.ErrorMessage),
                _ => BadRequest(result.ErrorMessage)
            };
        }

        [HttpPatch("children/{childId:int}")]
        public async Task<ActionResult<ParentChildResponse>> UpdateChildProfile(int childId, UpdateChildProfileRequest request)
        {
            var result = await _meService.UpdateChildProfileAsync(childId, request);

            if (result.IsSuccess)
            {
                return Ok(result.Value);
            }

            return result.ErrorType switch
            {
                ServiceErrorType.NotFound => NotFound(result.ErrorMessage),
                ServiceErrorType.Forbidden => StatusCode(StatusCodes.Status403Forbidden, result.ErrorMessage),
                _ => BadRequest(result.ErrorMessage)
            };
        }

        [HttpGet("tasks")]
        public async Task<ActionResult<IEnumerable<TaskResponse>>> GetMyTasks()
        {
            var tasks = await _meService.GetTasksAsync();
            return Ok(tasks);
        }

        [HttpGet("rewards")]
        public async Task<ActionResult<IEnumerable<RewardResponse>>> GetMyRewards()
        {
            var rewards = await _meService.GetRewardsAsync();
            return Ok(rewards);
        }

        [HttpPost("reward-suggestions")]
        public async Task<IActionResult> SuggestReward(SuggestRewardRequest request)
        {
            var result = await _meService.SuggestRewardAsync(request);

            if (result.IsSuccess)
            {
                return NoContent();
            }

            return result.ErrorType switch
            {
                ServiceErrorType.NotFound => NotFound(result.ErrorMessage),
                ServiceErrorType.Forbidden => StatusCode(StatusCodes.Status403Forbidden, result.ErrorMessage),
                ServiceErrorType.Conflict => Conflict(result.ErrorMessage),
                _ => BadRequest(result.ErrorMessage)
            };
        }

        [HttpGet("messages")]
        public async Task<ActionResult<IEnumerable<MessageResponse>>> GetMyMessages()
        {
            var messages = await _meService.GetMessagesAsync();
            return Ok(messages);
        }

        [HttpGet("children")]
        public async Task<ActionResult<IEnumerable<ParentChildResponse>>> GetMyChildren()
        {
            var children = await _meService.GetChildrenAsync();
            return Ok(children);
        }
    }
}
