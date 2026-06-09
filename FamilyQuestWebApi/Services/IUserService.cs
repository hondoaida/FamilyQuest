namespace FamilyQuestWebApi.Services
{
    public interface IUserService
    {
        Task<UserResponse> CreateUserAsync(CreateUserRequest request);
    }
}
