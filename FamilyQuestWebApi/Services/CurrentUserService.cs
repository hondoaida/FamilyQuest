using System.Security.Claims;
using FamilyQuestWebApi.Models.Entities;

namespace FamilyQuestWebApi.Services
{
    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public int UserId
        {
            get
            {
                var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (!int.TryParse(userId, out var parsedUserId))
                {
                    throw new InvalidOperationException("Current user id is not available.");
                }

                return parsedUserId;
            }
        }

        public UserRole Role
        {
            get
            {
                var role = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.Role);

                if (!Enum.TryParse<UserRole>(role, out var parsedRole))
                {
                    throw new InvalidOperationException("Current user role is not available.");
                }

                return parsedRole;
            }
        }
    }
}
