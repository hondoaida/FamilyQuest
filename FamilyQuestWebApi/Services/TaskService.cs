using FamilyQuestWebApi.Data;
using FamilyQuestWebApi.Models.Entities;
using Microsoft.EntityFrameworkCore;
using TaskStatus = FamilyQuestWebApi.Models.Entities.TaskStatus;

namespace FamilyQuestWebApi.Services
{
    public class TaskService : ITaskService
    {
        private readonly FamilyQuestDbContext _dbContext;
        private readonly ICurrentUserService _currentUserService;

        public TaskService(FamilyQuestDbContext dbContext, ICurrentUserService currentUserService)
        {
            _dbContext = dbContext;
            _currentUserService = currentUserService;
        }

        public async Task<IEnumerable<TaskResponse>> GetTasksAsync()
        {
            var query = _dbContext.Tasks.AsQueryable();

            if (_currentUserService.Role == UserRole.Parent)
            {
                var childIds = _dbContext.ParentChildren
                    .Where(parentChild => parentChild.ParentId == _currentUserService.UserId)
                    .Select(parentChild => parentChild.ChildId);

                query = query.Where(task => childIds.Contains(task.ChildId));
            }
            else if (_currentUserService.Role == UserRole.Child)
            {
                query = query.Where(task => task.ChildId == _currentUserService.UserId);
            }

            return await query
                .Select(task => new TaskResponse(
                    task.Id,
                    task.Name,
                    task.Description,
                    task.Points,
                    task.DueDate,
                    task.Status,
                    task.ChildId))
                .ToListAsync();
        }

        public async Task<ServiceResult<TaskResponse>> GetTaskAsync(int id)
        {
            var task = await _dbContext.Tasks.FindAsync(id);

            if (task == null)
            {
                return ServiceResult<TaskResponse>.Failure(ServiceErrorType.NotFound);
            }

            if (!await CanAccessChildAsync(task.ChildId))
            {
                return ServiceResult<TaskResponse>.Failure(ServiceErrorType.Forbidden, "You do not have access to this task.");
            }

            return ServiceResult<TaskResponse>.Success(ToResponse(task));
        }

        public async Task<ServiceResult<TaskResponse>> CreateTaskAsync(CreateTaskRequest request)
        {
            if (_currentUserService.Role != UserRole.Parent && _currentUserService.Role != UserRole.Admin)
            {
                return ServiceResult<TaskResponse>.Failure(ServiceErrorType.Forbidden, "Only parents can create tasks.");
            }

            var child = await _dbContext.Users.FindAsync(request.ChildId);

            if (child == null)
            {
                return ServiceResult<TaskResponse>.Failure(ServiceErrorType.BadRequest, "Child user does not exist.");
            }

            if (child.Role != UserRole.Child)
            {
                return ServiceResult<TaskResponse>.Failure(ServiceErrorType.BadRequest, "Task can only be assigned to a child user.");
            }

            if (_currentUserService.Role == UserRole.Parent && !await IsParentOfChildAsync(_currentUserService.UserId, request.ChildId))
            {
                return ServiceResult<TaskResponse>.Failure(ServiceErrorType.Forbidden, "You can create tasks only for your own child.");
            }

            var task = new TaskItem
            {
                Name = request.Name,
                Description = request.Description,
                Points = request.Points,
                DueDate = request.DueDate,
                Status = TaskStatus.Assigned,
                ChildId = request.ChildId
            };

            _dbContext.Tasks.Add(task);
            await _dbContext.SaveChangesAsync();

            return ServiceResult<TaskResponse>.Success(ToResponse(task));
        }

        public async Task<ServiceResult<bool>> UpdateTaskStatusAsync(int id, UpdateTaskStatusRequest request)
        {
            var task = await _dbContext.Tasks.FindAsync(id);

            if (task == null)
            {
                return ServiceResult<bool>.Failure(ServiceErrorType.NotFound);
            }

            if (_currentUserService.Role == UserRole.Child)
            {
                if (task.ChildId != _currentUserService.UserId)
                {
                    return ServiceResult<bool>.Failure(ServiceErrorType.Forbidden, "You can update only your own task.");
                }

                if (request.Status != TaskStatus.PendingApproval)
                {
                    return ServiceResult<bool>.Failure(ServiceErrorType.BadRequest, "Child can only mark a task as pending approval.");
                }
            }
            else if (_currentUserService.Role == UserRole.Parent)
            {
                if (!await IsParentOfChildAsync(_currentUserService.UserId, task.ChildId))
                {
                    return ServiceResult<bool>.Failure(ServiceErrorType.Forbidden, "You can update only tasks assigned to your own child.");
                }

                if (request.Status != TaskStatus.Approved && request.Status != TaskStatus.Rejected)
                {
                    return ServiceResult<bool>.Failure(ServiceErrorType.BadRequest, "Parent can only approve or reject a task.");
                }
            }

            task.Status = request.Status;
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

        private static TaskResponse ToResponse(TaskItem task)
        {
            return new TaskResponse(task.Id, task.Name, task.Description, task.Points, task.DueDate, task.Status, task.ChildId);
        }
    }
}
