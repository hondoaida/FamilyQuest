using FamilyQuestWebApi.Data;
using FamilyQuestWebApi.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace FamilyQuestWebApi.Services
{
    public class RewardService : IRewardService
    {
        private readonly FamilyQuestDbContext _dbContext;
        private readonly ICurrentUserService _currentUserService;

        public RewardService(FamilyQuestDbContext dbContext, ICurrentUserService currentUserService)
        {
            _dbContext = dbContext;
            _currentUserService = currentUserService;
        }

        public async Task<IEnumerable<RewardResponse>> GetRewardsAsync()
        {
            var query = _dbContext.Rewards.AsQueryable();

            if (_currentUserService.Role == UserRole.Parent)
            {
                var childIds = _dbContext.ParentChildren
                    .Where(parentChild => parentChild.ParentId == _currentUserService.UserId)
                    .Select(parentChild => parentChild.ChildId);

                query = query.Where(reward => childIds.Contains(reward.ChildId));
            }
            else if (_currentUserService.Role == UserRole.Child)
            {
                query = query.Where(reward => reward.ChildId == _currentUserService.UserId && reward.IsActive);
            }

            return await query
                .Select(reward => new RewardResponse(
                    reward.Id,
                    reward.Name,
                    reward.Description,
                    reward.RequiredPoints,
                    reward.IsActive,
                    reward.ChildId))
                .ToListAsync();
        }

        public async Task<ServiceResult<RewardResponse>> GetRewardAsync(int id)
        {
            var reward = await _dbContext.Rewards.FindAsync(id);

            if (reward == null)
            {
                return ServiceResult<RewardResponse>.Failure(ServiceErrorType.NotFound);
            }

            if (!await CanAccessChildAsync(reward.ChildId))
            {
                return ServiceResult<RewardResponse>.Failure(ServiceErrorType.Forbidden, "You do not have access to this reward.");
            }

            if (_currentUserService.Role == UserRole.Child && !reward.IsActive)
            {
                return ServiceResult<RewardResponse>.Failure(ServiceErrorType.NotFound);
            }

            return ServiceResult<RewardResponse>.Success(ToResponse(reward));
        }

        public async Task<ServiceResult<RewardResponse>> CreateRewardAsync(CreateRewardRequest request)
        {
            if (_currentUserService.Role != UserRole.Parent && _currentUserService.Role != UserRole.Admin)
            {
                return ServiceResult<RewardResponse>.Failure(ServiceErrorType.Forbidden, "Only parents can create rewards.");
            }

            var child = await _dbContext.Users.FindAsync(request.ChildId);

            if (child == null)
            {
                return ServiceResult<RewardResponse>.Failure(ServiceErrorType.BadRequest, "Child user does not exist.");
            }

            if (child.Role != UserRole.Child)
            {
                return ServiceResult<RewardResponse>.Failure(ServiceErrorType.BadRequest, "Reward can only be assigned to a child user.");
            }

            if (_currentUserService.Role == UserRole.Parent && !await IsParentOfChildAsync(_currentUserService.UserId, request.ChildId))
            {
                return ServiceResult<RewardResponse>.Failure(ServiceErrorType.Forbidden, "You can create rewards only for your own child.");
            }

            var reward = new Reward
            {
                Name = request.Name,
                Description = request.Description,
                RequiredPoints = request.RequiredPoints,
                ChildId = request.ChildId
            };

            _dbContext.Rewards.Add(reward);
            await _dbContext.SaveChangesAsync();

            return ServiceResult<RewardResponse>.Success(ToResponse(reward));
        }

        public async Task<ServiceResult<bool>> UpdateRewardActiveStatusAsync(int id, UpdateRewardActiveStatusRequest request)
        {
            var reward = await _dbContext.Rewards.FindAsync(id);

            if (reward == null)
            {
                return ServiceResult<bool>.Failure(ServiceErrorType.NotFound);
            }

            if (_currentUserService.Role == UserRole.Parent && !await IsParentOfChildAsync(_currentUserService.UserId, reward.ChildId))
            {
                return ServiceResult<bool>.Failure(ServiceErrorType.Forbidden, "You can update only rewards assigned to your own child.");
            }

            if (_currentUserService.Role == UserRole.Child)
            {
                return ServiceResult<bool>.Failure(ServiceErrorType.Forbidden, "Child cannot activate or deactivate rewards.");
            }

            reward.IsActive = request.IsActive;
            await _dbContext.SaveChangesAsync();

            return ServiceResult<bool>.Success(true);
        }

        private async Task<bool> CanAccessChildAsync(int childId)
        {
            return _currentUserService.Role == UserRole.Admin
                || (_currentUserService.Role == UserRole.Child && _currentUserService.UserId == childId)
                || (_currentUserService.Role == UserRole.Parent && await IsParentOfChildAsync(_currentUserService.UserId, childId));
        }

        private async Task<bool> IsParentOfChildAsync(int parentId, int childId)
        {
            return await _dbContext.ParentChildren
                .AnyAsync(parentChild => parentChild.ParentId == parentId && parentChild.ChildId == childId);
        }

        private static RewardResponse ToResponse(Reward reward)
        {
            return new RewardResponse(reward.Id, reward.Name, reward.Description, reward.RequiredPoints, reward.IsActive, reward.ChildId);
        }
    }
}
