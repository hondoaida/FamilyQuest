using FamilyQuestWebApi.Data;
using FamilyQuestWebApi.Hubs;
using FamilyQuestWebApi.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;

namespace FamilyQuestWebApi.Services
{
    public class MessageService : IMessageService
    {
        private readonly FamilyQuestDbContext _dbContext;
        private readonly ICurrentUserService _currentUserService;
        private readonly IHubContext<ChatHub> _chatHubContext;

        public MessageService(
            FamilyQuestDbContext dbContext,
            ICurrentUserService currentUserService,
            IHubContext<ChatHub> chatHubContext)
        {
            _dbContext = dbContext;
            _currentUserService = currentUserService;
            _chatHubContext = chatHubContext;
        }

        public async Task<IEnumerable<MessageResponse>> GetMessagesAsync()
        {
            var query = _dbContext.Messages.AsQueryable();

            if (_currentUserService.Role != UserRole.Admin)
            {
                query = query.Where(message => message.SenderId == _currentUserService.UserId || message.ReceiverId == _currentUserService.UserId);
            }

            return await query
                .Select(message => new MessageResponse(
                    message.Id,
                    message.SenderId,
                    message.ReceiverId,
                    message.Content,
                    message.SentAt))
                .ToListAsync();
        }

        public async Task<MessageResponse?> GetMessageAsync(int id)
        {
            var message = await _dbContext.Messages.FindAsync(id);

            if (message == null)
            {
                return null;
            }

            if (_currentUserService.Role != UserRole.Admin && message.SenderId != _currentUserService.UserId && message.ReceiverId != _currentUserService.UserId)
            {
                return null;
            }

            return ToResponse(message);
        }

        public async Task<ServiceResult<MessageResponse>> CreateMessageAsync(CreateMessageRequest request)
        {
            var receiver = await _dbContext.Users.FindAsync(request.ReceiverId);

            if (receiver == null)
            {
                return ServiceResult<MessageResponse>.Failure(ServiceErrorType.BadRequest, "Receiver user does not exist.");
            }

            if (_currentUserService.Role != UserRole.Admin && !await AreFamilyMembersAsync(_currentUserService.UserId, request.ReceiverId))
            {
                return ServiceResult<MessageResponse>.Failure(ServiceErrorType.Forbidden, "You can send messages only to connected family members.");
            }

            var message = new global::Message
            {
                SenderId = _currentUserService.UserId,
                ReceiverId = request.ReceiverId,
                Content = request.Content,
                SentAt = DateTime.Now
            };

            _dbContext.Messages.Add(message);
            await _dbContext.SaveChangesAsync();

            var response = ToResponse(message);

            await _chatHubContext.Clients
                .Group(ChatHub.GetUserGroupName(message.ReceiverId))
                .SendAsync("MessageReceived", response);

            return ServiceResult<MessageResponse>.Success(response);
        }

        private async Task<bool> AreFamilyMembersAsync(int firstUserId, int secondUserId)
        {
            return await _dbContext.ParentChildren.AnyAsync(parentChild =>
                (parentChild.ParentId == firstUserId && parentChild.ChildId == secondUserId)
                || (parentChild.ParentId == secondUserId && parentChild.ChildId == firstUserId));
        }

        private static MessageResponse ToResponse(global::Message message)
        {
            return new MessageResponse(message.Id, message.SenderId, message.ReceiverId, message.Content, message.SentAt);
        }
    }
}
