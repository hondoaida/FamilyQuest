using FamilyQuestWebApi.Models.Entities;

namespace FamilyQuestWebApi.Services
{
    public interface ICurrentUserService
    {
        int UserId { get; }

        UserRole Role { get; }
    }
}
