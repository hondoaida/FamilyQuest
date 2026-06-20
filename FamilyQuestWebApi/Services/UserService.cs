using FamilyQuestWebApi.Data;
using FamilyQuestWebApi.Models.Entities;

namespace FamilyQuestWebApi.Services
{
    public class UserService : IUserService
    {
        private readonly FamilyQuestDbContext _dbContext;
        private readonly IPasswordHasher _passwordHasher;

        public UserService(FamilyQuestDbContext dbContext, IPasswordHasher passwordHasher)
        {
            _dbContext = dbContext;
            _passwordHasher = passwordHasher;
        }

        public async Task<UserResponse> CreateUserAsync(CreateUserRequest request)
        {
            var user = new User
            {
                Name = request.Name,
                Email = request.Email,
                PasswordHash = _passwordHasher.HashPassword(request.Password),
                Role = request.Role,
                AvatarKey = string.IsNullOrWhiteSpace(request.AvatarKey)
                    ? request.Role == UserRole.Child ? "boy-one" : "mum-one"
                    : request.AvatarKey.Trim()
            };

            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            return new UserResponse(
                user.Id,
                user.Name,
                user.Email,
                user.Role,
                user.CreatedAt,
                user.IsActive,
                user.AvatarKey);
        }
    }
}

