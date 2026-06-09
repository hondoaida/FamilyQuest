using FamilyQuestWebApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FamilyQuestWebApi.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class MessagesController : ControllerBase
    {
        private readonly IMessageService _messageService;

        public MessagesController(IMessageService messageService)
        {
            _messageService = messageService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MessageResponse>>> GetMessages()
        {
            var messages = await _messageService.GetMessagesAsync();
            return Ok(messages);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<MessageResponse>> GetMessage(int id)
        {
            var message = await _messageService.GetMessageAsync(id);
            return message == null ? NotFound() : Ok(message);
        }

        [HttpPost]
        public async Task<ActionResult<MessageResponse>> CreateMessage(CreateMessageRequest request)
        {
            var result = await _messageService.CreateMessageAsync(request);

            if (!result.IsSuccess)
            {
                return ToActionResult(result);
            }

            return Created($"/api/messages/{result.Value!.Id}", result.Value);
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
