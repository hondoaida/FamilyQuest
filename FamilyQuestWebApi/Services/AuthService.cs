using FamilyQuestWebApi.Data;
using Microsoft.EntityFrameworkCore;

namespace FamilyQuestWebApi.Services
{
    public class AuthService : IAuthService
    {
        private readonly FamilyQuestDbContext _dbContext;
        private readonly IPasswordHasher _passwordHasher;
        private readonly ITokenService _tokenService;

        public AuthService(FamilyQuestDbContext dbContext, IPasswordHasher passwordHasher, ITokenService tokenService)
        {
            _dbContext = dbContext;
            _passwordHasher = passwordHasher;
            _tokenService = tokenService;
        }

        public async Task<LoginResponse?> LoginAsync(LoginRequest request)
        {
            var user = await _dbContext.Users
                .FirstOrDefaultAsync(user => user.Email == request.Email && user.IsActive);

            if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
            {
                return null;
            }

            var token = _tokenService.CreateToken(user);

            return new LoginResponse(
                token.Token,
                token.ExpiresAt,
                new AuthUserResponse(
                    user.Id,
                    user.Name,
                    user.Email,
                    user.Role,
                    user.CreatedAt,
                    user.IsActive,
                    user.AvatarKey));
        }
    }
}

