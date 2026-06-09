using FamilyQuestWebApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace FamilyQuestWebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;

        public UserController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpPost]
        public async Task<ActionResult<UserResponse>> CreateUser(CreateUserRequest request)
        {
            var response = await _userService.CreateUserAsync(request);
            return Created($"/api/user/{response.Id}", response);
        }
    }
}
