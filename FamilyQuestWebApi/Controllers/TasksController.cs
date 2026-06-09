using FamilyQuestWebApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FamilyQuestWebApi.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class TasksController : ControllerBase
    {
        private readonly ITaskService _taskService;

        public TasksController(ITaskService taskService)
        {
            _taskService = taskService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TaskResponse>>> GetTasks()
        {
            var tasks = await _taskService.GetTasksAsync();
            return Ok(tasks);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<TaskResponse>> GetTask(int id)
        {
            var result = await _taskService.GetTaskAsync(id);
            return ToActionResult(result);
        }

        [HttpPost]
        [Authorize(Roles = "Parent,Admin")]
        public async Task<ActionResult<TaskResponse>> CreateTask(CreateTaskRequest request)
        {
            var result = await _taskService.CreateTaskAsync(request);

            if (!result.IsSuccess)
            {
                return ToActionResult(result);
            }

            return Created($"/api/tasks/{result.Value!.Id}", result.Value);
        }

        [HttpPut("{id:int}/status")]
        public async Task<IActionResult> UpdateTaskStatus(int id, UpdateTaskStatusRequest request)
        {
            var result = await _taskService.UpdateTaskStatusAsync(id, request);
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
