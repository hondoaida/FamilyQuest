using FamilyQuestWebApi.Data;
using FamilyQuestWebApi.Hubs;
using FamilyQuestWebApi.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;

namespace FamilyQuestWebApi.Services
{
    public class RewardRequestService : IRewardRequestService
    {
        private readonly FamilyQuestDbContext _dbContext;
        private readonly ICurrentUserService _currentUserService;
        private readonly IHubContext<ChatHub> _chatHubContext;

        public RewardRequestService(
            FamilyQuestDbContext dbContext,
            ICurrentUserService currentUserService,
            IHubContext<ChatHub> chatHubContext)
        {
            _dbContext = dbContext;
            _currentUserService = currentUserService;
            _chatHubContext = chatHubContext;
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

            var availablePoints = await GetAvailablePointsAsync(_currentUserService.UserId);

            if (availablePoints < reward.RequiredPoints)
            {
                return ServiceResult<RewardRequestResponse>.Failure(ServiceErrorType.BadRequest, "You do not have enough points for this reward.");
            }

            var hasActiveRequest = await _dbContext.RewardRequests
                .AnyAsync(existingRequest =>
                    existingRequest.RewardId == reward.Id
                    && existingRequest.ChildId == _currentUserService.UserId
                    && (existingRequest.Status == global::RewardRequestStatus.Pending || existingRequest.Status == global::RewardRequestStatus.Approved));

            if (hasActiveRequest)
            {
                return ServiceResult<RewardRequestResponse>.Failure(ServiceErrorType.Conflict, "Reward has already been requested.");
            }

            var rewardRequest = new global::RewardRequest
            {
                RewardId = request.RewardId,
                ChildId = _currentUserService.UserId,
                Status = global::RewardRequestStatus.Pending
            };

            _dbContext.RewardRequests.Add(rewardRequest);
            await _dbContext.SaveChangesAsync();

            var response = ToResponse(rewardRequest);
            var parentIds = await _dbContext.ParentChildren
                .Where(parentChild => parentChild.ChildId == rewardRequest.ChildId)
                .Select(parentChild => parentChild.ParentId)
                .ToListAsync();

            foreach (var parentId in parentIds)
            {
                await _chatHubContext.Clients
                    .Group(ChatHub.GetUserGroupName(parentId))
                    .SendAsync("RewardRequestCreated", response);
            }

            return ServiceResult<RewardRequestResponse>.Success(response);
        }

        public async Task<ServiceResult<RewardRequestResponse>> UpdateRewardRequestStatusAsync(int id, UpdateRewardRequestStatusRequest request)
        {
            if (_currentUserService.Role == UserRole.Child)
            {
                return ServiceResult<RewardRequestResponse>.Failure(ServiceErrorType.Forbidden, "Child cannot approve or reject reward requests.");
            }

            var rewardRequest = await _dbContext.RewardRequests.FindAsync(id);

            if (rewardRequest == null)
            {
                return ServiceResult<RewardRequestResponse>.Failure(ServiceErrorType.NotFound);
            }

            if (_currentUserService.Role == UserRole.Parent && !await IsParentOfChildAsync(_currentUserService.UserId, rewardRequest.ChildId))
            {
                return ServiceResult<RewardRequestResponse>.Failure(ServiceErrorType.Forbidden, "You can update only reward requests from your own child.");
            }

            rewardRequest.Status = request.Status;
            await _dbContext.SaveChangesAsync();

            var response = ToResponse(rewardRequest);

            await _chatHubContext.Clients
                .Group(ChatHub.GetUserGroupName(rewardRequest.ChildId))
                .SendAsync("RewardRequestUpdated", response);

            return ServiceResult<RewardRequestResponse>.Success(response);
        }

        private async Task<int> GetAvailablePointsAsync(int childId)
        {
            var approvedPoints = await _dbContext.Tasks
                .Where(task => task.ChildId == childId && task.Status == FamilyQuestWebApi.Models.Entities.TaskStatus.Approved)
                .SumAsync(task => task.Points);

            var reservedOrSpentPoints = await _dbContext.RewardRequests
                .Where(request => request.ChildId == childId
                    && (request.Status == global::RewardRequestStatus.Pending || request.Status == global::RewardRequestStatus.Approved))
                .Join(
                    _dbContext.Rewards,
                    request => request.RewardId,
                    reward => reward.Id,
                    (request, reward) => reward.RequiredPoints)
                .SumAsync();

            return Math.Max(approvedPoints - reservedOrSpentPoints, 0);
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
