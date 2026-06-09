using FamilyQuestWebApi.Models.Entities;

namespace FamilyQuestWebApi.Services
{
    public interface ITokenService
    {
        TokenResponse CreateToken(User user);
    }
}
