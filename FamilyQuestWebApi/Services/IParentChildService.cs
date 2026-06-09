namespace FamilyQuestWebApi.Services
{
    public interface IParentChildService
    {
        Task<IEnumerable<ParentChildResponse>> GetParentChildrenAsync();

        Task<ServiceResult<ParentChildResponse>> GetParentChildAsync(int id);

        Task<ServiceResult<ParentChildResponse>> CreateParentChildAsync(CreateParentChildRequest request);
    }
}
