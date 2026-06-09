using FamilyQuestWebApi.Data;
using FamilyQuestWebApi.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace FamilyQuestWebApi.Services
{
    public class RewardRequestService : IRewardRequestService
    {
        private readonly FamilyQuestDbContext _dbContext;
        private readonly ICurrentUserService _currentUserService;

        public RewardRequestService(FamilyQuestDbContext dbContext, ICurrentUserService currentUserService)
        {
            _dbContext = dbContext;
            _currentUserService = currentUserService;
        }

        public async Task<IEnumerable<RewardRequestResponse>> GetRewardRequestsAsync()
        {
            var query = _dbContext.RewardRequests.AsQueryable();

            if (_currentUserService.Role == UserRole.Parent)
            {
                var childIds = _dbContext.ParentChildren
                    .Where(parentChild => parentChild.ParentId == _currentUserService.UserId)
                    .Select(parentChild => parentChild.ChildId);

                query = query.Where(request => childIds.Contains(request.ChildId));
            }
            else if (_currentUserService.Role == UserRole.Child)
            {
                query = query.Where(request => request.ChildId == _currentUserService.UserId);
            }

            return await query
                .Select(request => new RewardRequestResponse(
                    request.Id,
                    request.RewardId,
                    request.ChildId,
                    request.Status,
                    request.RequestDate))
                .ToListAsync();
        }

        public async Task<ServiceResult<RewardRequestResponse>> GetRewardRequestAsync(int id)
        {
            var rewardRequest = await _dbContext.RewardRequests.FindAsync(id);

            if (rewardRequest == null)
            {
                return ServiceResult<RewardRequestResponse>.Failure(ServiceErrorType.NotFound);
            }

            if (!await CanAccessChildAsync(rewardRequest.ChildId))
            {
                return ServiceResult<RewardRequestResponse>.Failure(ServiceErrorType.Forbidden, "You do not have access to this reward request.");
            }

            return ServiceResult<RewardRequestResponse>.Success(ToResponse(rewardRequest));
        }

        public async Task<ServiceResult<RewardRequestResponse>> CreateRewardRequestAsync(CreateRewardRequestRequest request)
        {
            if (_currentUserService.Role != UserRole.Child)
            {
                return ServiceResult<RewardRequestResponse>.Failure(ServiceErrorType.Forbidden, "Only children can request rewards.");
            }

            var reward = await _dbContext.Rewards.FindAsync(request.RewardId);

            if (reward == null || !reward.IsActive)
            {
                return ServiceResult<RewardRequestResponse>.Failure(ServiceErrorType.BadRequest, "Reward does not exist or is not active.");
            }

            if (reward.ChildId != _currentUserService.UserId)
            {
                return ServiceResult<RewardRequestResponse>.Failure(ServiceErrorType.Forbidden, "You can request only your own rewards.");
            }

            var rewardRequest = new global::RewardRequest
            {
                RewardId = request.RewardId,
                ChildId = _currentUserService.UserId,
                Status = global::RewardRequestStatus.Pending
            };

            _dbContext.RewardRequests.Add(rewardRequest);
            await _dbContext.SaveChangesAsync();

            return ServiceResult<RewardRequestResponse>.Success(ToResponse(rewardRequest));
        }

        public async Task<ServiceResult<bool>> UpdateRewardRequestStatusAsync(int id, UpdateRewardRequestStatusRequest request)
        {
            if (_currentUserService.Role == UserRole.Child)
            {
                return ServiceResult<bool>.Failure(ServiceErrorType.Forbidden, "Child cannot approve or reject reward requests.");
            }

            var rewardRequest = await _dbContext.RewardRequests.FindAsync(id);

            if (rewardRequest == null)
            {
                return ServiceResult<bool>.Failure(ServiceErrorType.NotFound);
            }

            if (_currentUserService.Role == UserRole.Parent && !await IsParentOfChildAsync(_currentUserService.UserId, rewardRequest.ChildId))
            {
                return ServiceResult<bool>.Failure(ServiceErrorType.Forbidden, "You can update only reward requests from your own child.");
            }

            rewardRequest.Status = request.Status;
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

        private static RewardRequestResponse ToResponse(global::RewardRequest request)
        {
            return new RewardRequestResponse(request.Id, request.RewardId, request.ChildId, request.Status, request.RequestDate);
        }
    }
}
