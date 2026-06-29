using FamilyQuestWebApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FamilyQuestWebApi.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class RewardRequestsController : ControllerBase
    {
        private readonly IRewardRequestService _rewardRequestService;

        public RewardRequestsController(IRewardRequestService rewardRequestService)
        {
            _rewardRequestService = rewardRequestService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<RewardRequestResponse>>> GetRewardRequests()
        {
            var rewardRequests = await _rewardRequestService.GetRewardRequestsAsync();
            return Ok(rewardRequests);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<RewardRequestResponse>> GetRewardRequest(int id)
        {
            var result = await _rewardRequestService.GetRewardRequestAsync(id);
            return ToActionResult(result);
        }

        [HttpPost]
        [Authorize(Roles = "Child")]
        public async Task<ActionResult<RewardRequestResponse>> CreateRewardRequest(CreateRewardRequestRequest request)
        {
            var result = await _rewardRequestService.CreateRewardRequestAsync(request);

            if (!result.IsSuccess)
            {
                return ToActionResult(result);
            }

            return Created($"/api/rewardrequests/{result.Value!.Id}", result.Value);
        }

        [HttpPut("{id:int}/status")]
        [Authorize(Roles = "Parent,Admin")]
        public async Task<ActionResult<RewardRequestResponse>> UpdateRewardRequestStatus(int id, UpdateRewardRequestStatusRequest request)
        {
            var result = await _rewardRequestService.UpdateRewardRequestStatusAsync(id, request);
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
