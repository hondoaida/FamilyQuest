namespace FamilyQuestWebApi.Services
{
    public interface ITaskService
    {
        Task<IEnumerable<TaskResponse>> GetTasksAsync();

        Task<ServiceResult<TaskResponse>> GetTaskAsync(int id);

        Task<ServiceResult<TaskResponse>> CreateTaskAsync(CreateTaskRequest request);

        Task<ServiceResult<bool>> UpdateTaskStatusAsync(int id, UpdateTaskStatusRequest request);
    }
}
