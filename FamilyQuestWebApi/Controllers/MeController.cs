using FamilyQuestWebApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FamilyQuestWebApi.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
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
