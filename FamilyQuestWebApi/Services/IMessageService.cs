namespace FamilyQuestWebApi.Services
{
    public interface IMessageService
    {
        Task<IEnumerable<MessageResponse>> GetMessagesAsync();

        Task<MessageResponse?> GetMessageAsync(int id);

        Task<ServiceResult<MessageResponse>> CreateMessageAsync(CreateMessageRequest request);
    }
}
