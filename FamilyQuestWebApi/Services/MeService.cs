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
        private readonly IPasswordHasher _passwordHasher;

        public MeService(
            FamilyQuestDbContext dbContext,
            ICurrentUserService currentUserService,
            ITaskService taskService,
            IRewardService rewardService,
            IMessageService messageService,
            IParentChildService parentChildService,
            IPasswordHasher passwordHasher)
        {
            _dbContext = dbContext;
            _currentUserService = currentUserService;
            _taskService = taskService;
            _rewardService = rewardService;
            _messageService = messageService;
            _parentChildService = parentChildService;
            _passwordHasher = passwordHasher;
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
                    user.IsActive,
                    user.AvatarKey))
                .FirstOrDefaultAsync();
        }

        public async Task<ServiceResult<UserResponse>> UpdateCurrentUserAsync(UpdateCurrentUserRequest request)
        {
            var user = await _dbContext.Users
                .FirstOrDefaultAsync(user => user.Id == _currentUserService.UserId && user.IsActive);

            if (user == null)
            {
                return ServiceResult<UserResponse>.Failure(ServiceErrorType.NotFound, "Korisnik nije pronađen.");
            }

            var trimmedEmail = request.Email?.Trim();

            if (!string.IsNullOrWhiteSpace(trimmedEmail))
            {
                var isEmailTaken = await _dbContext.Users
                    .AnyAsync(otherUser => otherUser.Id != user.Id && otherUser.Email == trimmedEmail && otherUser.IsActive);

                if (isEmailTaken)
                {
                    return ServiceResult<UserResponse>.Failure(ServiceErrorType.Conflict, "E-mail adresa je već zauzeta.");
                }

                user.Email = trimmedEmail;
            }

            if (!string.IsNullOrWhiteSpace(request.AvatarKey))
            {
                user.AvatarKey = request.AvatarKey.Trim();
            }

            if (!string.IsNullOrWhiteSpace(request.NewPassword))
            {
                if (string.IsNullOrWhiteSpace(request.CurrentPassword) || !_passwordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash))
                {
                    return ServiceResult<UserResponse>.Failure(ServiceErrorType.BadRequest, "Trenutna šifra nije tačna.");
                }

                user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
            }

            await _dbContext.SaveChangesAsync();

            return ServiceResult<UserResponse>.Success(new UserResponse(
                user.Id,
                user.Name,
                user.Email,
                user.Role,
                user.CreatedAt,
                user.IsActive,
                user.AvatarKey));
        }

        public async Task<IEnumerable<TaskResponse>> GetTasksAsync()
        {
            return await _taskService.GetTasksAsync();
        }

        public async Task<IEnumerable<RewardResponse>> GetRewardsAsync()
        {
            return await _rewardService.GetRewardsAsync();
        }

        public async Task<ServiceResult<bool>> SuggestRewardAsync(SuggestRewardRequest request)
        {
            if (_currentUserService.Role != UserRole.Child)
            {
                return ServiceResult<bool>.Failure(ServiceErrorType.Forbidden, "Samo dijete moze predloziti nagradu.");
            }

            var child = await _dbContext.Users
                .FirstOrDefaultAsync(user => user.Id == _currentUserService.UserId && user.IsActive);

            if (child == null)
            {
                return ServiceResult<bool>.Failure(ServiceErrorType.NotFound, "Dijete nije pronadjeno.");
            }

            var parentIds = await _dbContext.ParentChildren
                .Where(parentChild => parentChild.ChildId == _currentUserService.UserId)
                .Select(parentChild => parentChild.ParentId)
                .ToListAsync();

            if (parentIds.Count == 0)
            {
                return ServiceResult<bool>.Failure(ServiceErrorType.BadRequest, "Dijete nije povezano sa roditeljem.");
            }

            var rewardName = request.Name.Trim();
            var iconKey = string.IsNullOrWhiteSpace(request.IconKey) ? "gamepad" : request.IconKey.Trim();
            var dueDateText = request.DueDate.ToString("dd.MM.yyyy");

            foreach (var parentId in parentIds)
            {
                _dbContext.RewardSuggestions.Add(new RewardSuggestion
                {
                    Name = rewardName,
                    IconKey = iconKey,
                    DueDate = request.DueDate,
                    ChildId = child.Id,
                    ParentId = parentId,
                    Status = RewardSuggestionStatus.Pending,
                    SuggestedAt = DateTime.Now
                });

                _dbContext.Messages.Add(new global::Message
                {
                    SenderId = child.Id,
                    ReceiverId = parentId,
                    Content = $"{child.Name} predlaze nagradu \"{rewardName}\" do {dueDateText}.",
                    SentAt = DateTime.Now
                });
            }

            await _dbContext.SaveChangesAsync();

            return ServiceResult<bool>.Success(true);
        }

        public async Task<IEnumerable<MessageResponse>> GetMessagesAsync()
        {
            return await _messageService.GetMessagesAsync();
        }

        public async Task<IEnumerable<ParentChildResponse>> GetChildrenAsync()
        {
            if (_currentUserService.Role == UserRole.Child)
            {
                return await _dbContext.ParentChildren
                    .Where(parentChild => parentChild.ChildId == _currentUserService.UserId)
                    .Select(parentChild => new ParentChildResponse(
                        parentChild.Id,
                        parentChild.ParentId,
                        parentChild.ChildId,
                        parentChild.Child.Name,
                        parentChild.Child.Email,
                        parentChild.Child.AvatarKey))
                    .ToListAsync();
            }

            return await _parentChildService.GetParentChildrenAsync();
        }
    }
}

