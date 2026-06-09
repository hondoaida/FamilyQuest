using FamilyQuestWebApi.Data;
using FamilyQuestWebApi.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace FamilyQuestWebApi.Services
{
    public class MeService : IMeService
    {
        private readonly FamilyQuestDbContext _dbContext;
        private readonly ICurrentUserService _currentUserService;
        private readonly ITaskService _taskService;
        private readonly IRewardService _rewardService;
        private readonly IMessageService _messageService;
        private readonly IParentChildService _parentChildService;

        public MeService(
            FamilyQuestDbContext dbContext,
            ICurrentUserService currentUserService,
            ITaskService taskService,
            IRewardService rewardService,
            IMessageService messageService,
            IParentChildService parentChildService)
        {
            _dbContext = dbContext;
            _currentUserService = currentUserService;
            _taskService = taskService;
            _rewardService = rewardService;
            _messageService = messageService;
            _parentChildService = parentChildService;
        }

        public async Task<UserResponse?> GetCurrentUserAsync()
        {
            return await _dbContext.Users
                .Where(user => user.Id == _currentUserService.UserId && user.IsActive)
                .Select(user => new UserResponse(
                    user.Id,
                    user.Name,
                    user.Email,
                    user.Role,
                    user.CreatedAt,
                    user.IsActive))
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<TaskResponse>> GetTasksAsync()
        {
            return await _taskService.GetTasksAsync();
        }

        public async Task<IEnumerable<RewardResponse>> GetRewardsAsync()
        {
            return await _rewardService.GetRewardsAsync();
        }

        public async Task<IEnumerable<MessageResponse>> GetMessagesAsync()
        {
            return await _messageService.GetMessagesAsync();
        }

        public async Task<IEnumerable<ParentChildResponse>> GetChildrenAsync()
        {
            if (_currentUserService.Role == UserRole.Child)
            {
                return [];
            }

            return await _parentChildService.GetParentChildrenAsync();
        }
    }
}
