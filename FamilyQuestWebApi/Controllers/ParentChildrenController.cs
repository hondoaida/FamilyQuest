using FamilyQuestWebApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FamilyQuestWebApi.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class ParentChildrenController : ControllerBase
    {
        private readonly IParentChildService _parentChildService;

        public ParentChildrenController(IParentChildService parentChildService)
        {
            _parentChildService = parentChildService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ParentChildResponse>>> GetParentChildren()
        {
            var parentChildren = await _parentChildService.GetParentChildrenAsync();
            return Ok(parentChildren);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<ParentChildResponse>> GetParentChild(int id)
        {
            var result = await _parentChildService.GetParentChildAsync(id);
            return ToActionResult(result);
        }

        [HttpPost]
        [Authorize(Roles = "Parent,Admin")]
        public async Task<ActionResult<ParentChildResponse>> CreateParentChild(CreateParentChildRequest request)
        {
            var result = await _parentChildService.CreateParentChildAsync(request);

            if (!result.IsSuccess)
            {
                return ToActionResult(result);
            }

            return Created($"/api/parentchildren/{result.Value!.Id}", result.Value);
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
