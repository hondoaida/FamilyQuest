using FamilyQuestWebApi.Data;
using FamilyQuestWebApi.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace FamilyQuestWebApi.Services
{
    public class RewardSuggestionService : IRewardSuggestionService
    {
        private readonly FamilyQuestDbContext _dbContext;
        private readonly ICurrentUserService _currentUserService;

        public RewardSuggestionService(FamilyQuestDbContext dbContext, ICurrentUserService currentUserService)
        {
            _dbContext = dbContext;
            _currentUserService = currentUserService;
        }

        public async Task<IEnumerable<RewardSuggestionResponse>> GetRewardSuggestionsAsync()
        {
            var query = _dbContext.RewardSuggestions
                .Include(suggestion => suggestion.Child)
                .AsQueryable();

            if (_currentUserService.Role == UserRole.Parent)
            {
                query = query.Where(suggestion => suggestion.ParentId == _currentUserService.UserId);
            }
            else if (_currentUserService.Role == UserRole.Child)
            {
                query = query.Where(suggestion => suggestion.ChildId == _currentUserService.UserId);
            }

            var suggestions = await query
                .OrderByDescending(suggestion => suggestion.SuggestedAt)
                .ToListAsync();

            return suggestions.Select(ToResponse);
        }

        public async Task<ServiceResult<RewardSuggestionResponse>> GetRewardSuggestionAsync(int id)
        {
            var suggestion = await _dbContext.RewardSuggestions
                .Include(currentSuggestion => currentSuggestion.Child)
                .FirstOrDefaultAsync(currentSuggestion => currentSuggestion.Id == id);

            if (suggestion == null)
            {
                return ServiceResult<RewardSuggestionResponse>.Failure(ServiceErrorType.NotFound);
            }

            if (!CanAccessSuggestion(suggestion))
            {
                return ServiceResult<RewardSuggestionResponse>.Failure(ServiceErrorType.Forbidden, "Nemate pristup ovom prijedlogu nagrade.");
            }

            return ServiceResult<RewardSuggestionResponse>.Success(ToResponse(suggestion));
        }

        public async Task<ServiceResult<RewardSuggestionResponse>> UpdateRewardSuggestionStatusAsync(int id, UpdateRewardSuggestionStatusRequest request)
        {
            if (_currentUserService.Role != UserRole.Parent && _currentUserService.Role != UserRole.Admin)
            {
                return ServiceResult<RewardSuggestionResponse>.Failure(ServiceErrorType.Forbidden, "Samo roditelj moze odobriti ili odbiti prijedlog nagrade.");
            }

            var suggestion = await _dbContext.RewardSuggestions
                .Include(currentSuggestion => currentSuggestion.Child)
                .FirstOrDefaultAsync(currentSuggestion => currentSuggestion.Id == id);

            if (suggestion == null)
            {
                return ServiceResult<RewardSuggestionResponse>.Failure(ServiceErrorType.NotFound);
            }

            if (_currentUserService.Role == UserRole.Parent && suggestion.ParentId != _currentUserService.UserId)
            {
                return ServiceResult<RewardSuggestionResponse>.Failure(ServiceErrorType.Forbidden, "Mozete urediti samo prijedloge svoje djece.");
            }

            if (suggestion.Status != RewardSuggestionStatus.Pending)
            {
                return ServiceResult<RewardSuggestionResponse>.Failure(ServiceErrorType.Conflict, "Ovaj prijedlog je vec obradjen.");
            }

            if (request.Status != RewardSuggestionStatus.Approved && request.Status != RewardSuggestionStatus.Rejected)
            {
                return ServiceResult<RewardSuggestionResponse>.Failure(ServiceErrorType.BadRequest, "Status mora biti Approved ili Rejected.");
            }

            if (request.Status == RewardSuggestionStatus.Approved)
            {
                if (request.RequiredPoints is null or <= 0)
                {
                    return ServiceResult<RewardSuggestionResponse>.Failure(ServiceErrorType.BadRequest, "Unesite broj bodova za nagradu.");
                }

                var approvedDueDate = request.DueDate ?? suggestion.DueDate;

                var reward = new Reward
                {
                    Name = suggestion.Name,
                    IconKey = suggestion.IconKey,
                    RequiredPoints = request.RequiredPoints.Value,
                    DueDate = approvedDueDate,
                    ChildId = suggestion.ChildId,
                    IsActive = true
                };

                _dbContext.Rewards.Add(reward);
                await _dbContext.SaveChangesAsync();

                suggestion.RequiredPoints = request.RequiredPoints;
                suggestion.DueDate = approvedDueDate;
                suggestion.RewardId = reward.Id;
            }

            suggestion.Status = request.Status;
            suggestion.ReviewedAt = DateTime.Now;

            _dbContext.Messages.Add(new global::Message
            {
                SenderId = _currentUserService.UserId,
                ReceiverId = suggestion.ChildId,
                Content = request.Status == RewardSuggestionStatus.Approved
                    ? $"Tvoj prijedlog nagrade \"{suggestion.Name}\" je odobren za {suggestion.RequiredPoints} bodova."
                    : $"Tvoj prijedlog nagrade \"{suggestion.Name}\" je odbijen.",
                SentAt = DateTime.Now
            });

            await _dbContext.SaveChangesAsync();

            return ServiceResult<RewardSuggestionResponse>.Success(ToResponse(suggestion));
        }

        private bool CanAccessSuggestion(RewardSuggestion suggestion)
        {
            return _currentUserService.Role == UserRole.Admin
                || (_currentUserService.Role == UserRole.Parent && suggestion.ParentId == _currentUserService.UserId)
                || (_currentUserService.Role == UserRole.Child && suggestion.ChildId == _currentUserService.UserId);
        }

        private static RewardSuggestionResponse ToResponse(RewardSuggestion suggestion)
        {
            return new RewardSuggestionResponse(
                suggestion.Id,
                suggestion.Name,
                suggestion.IconKey,
                suggestion.DueDate,
                suggestion.RequiredPoints,
                suggestion.Status,
                suggestion.SuggestedAt,
                suggestion.ReviewedAt,
                suggestion.ChildId,
                suggestion.Child.Name,
                suggestion.Child.AvatarKey,
                suggestion.RewardId);
        }
    }
}
