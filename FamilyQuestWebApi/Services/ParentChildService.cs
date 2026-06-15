using FamilyQuestWebApi.Data;
using FamilyQuestWebApi.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace FamilyQuestWebApi.Services
{
    public class ParentChildService : IParentChildService
    {
        private readonly FamilyQuestDbContext _dbContext;
        private readonly ICurrentUserService _currentUserService;

        public ParentChildService(FamilyQuestDbContext dbContext, ICurrentUserService currentUserService)
        {
            _dbContext = dbContext;
            _currentUserService = currentUserService;
        }

        public async Task<IEnumerable<ParentChildResponse>> GetParentChildrenAsync()
        {
            var query = _dbContext.ParentChildren.AsQueryable();

            if (_currentUserService.Role == UserRole.Parent)
            {
                query = query.Where(parentChild => parentChild.ParentId == _currentUserService.UserId);
            }
            else if (_currentUserService.Role == UserRole.Child)
            {
                query = query.Where(parentChild => parentChild.ChildId == _currentUserService.UserId);
            }

            return await query
                .Select(parentChild => new ParentChildResponse(
                    parentChild.Id,
                    parentChild.ParentId,
                    parentChild.ChildId,
                    parentChild.Child.Name,
                    parentChild.Child.Email))
                .ToListAsync();
        }

        public async Task<ServiceResult<ParentChildResponse>> GetParentChildAsync(int id)
        {
            var parentChild = await _dbContext.ParentChildren
                .Include(parentChild => parentChild.Child)
                .FirstOrDefaultAsync(parentChild => parentChild.Id == id);

            if (parentChild == null)
            {
                return ServiceResult<ParentChildResponse>.Failure(ServiceErrorType.NotFound);
            }

            if (!CanAccess(parentChild.ParentId, parentChild.ChildId))
            {
                return ServiceResult<ParentChildResponse>.Failure(ServiceErrorType.Forbidden, "You do not have access to this relationship.");
            }

            return ServiceResult<ParentChildResponse>.Success(ToResponse(parentChild));
        }

        public async Task<ServiceResult<ParentChildResponse>> CreateParentChildAsync(CreateParentChildRequest request)
        {
            if (_currentUserService.Role != UserRole.Parent && _currentUserService.Role != UserRole.Admin)
            {
                return ServiceResult<ParentChildResponse>.Failure(ServiceErrorType.Forbidden, "Only parents can create parent-child relationships.");
            }

            var parentId = _currentUserService.Role == UserRole.Admin
                ? request.ParentId ?? _currentUserService.UserId
                : _currentUserService.UserId;

            if (_currentUserService.Role == UserRole.Parent && request.ParentId.HasValue && request.ParentId.Value != _currentUserService.UserId)
            {
                return ServiceResult<ParentChildResponse>.Failure(ServiceErrorType.Forbidden, "Parent can create relationships only for themselves.");
            }

            var parent = await _dbContext.Users.FindAsync(parentId);
            var child = await _dbContext.Users.FindAsync(request.ChildId);

            if (parent == null)
            {
                return ServiceResult<ParentChildResponse>.Failure(ServiceErrorType.BadRequest, "Parent user does not exist.");
            }

            if (child == null)
            {
                return ServiceResult<ParentChildResponse>.Failure(ServiceErrorType.BadRequest, "Child user does not exist.");
            }

            if (parent.Role != UserRole.Parent)
            {
                return ServiceResult<ParentChildResponse>.Failure(ServiceErrorType.BadRequest, "Parent user must have the Parent role.");
            }

            if (child.Role != UserRole.Child)
            {
                return ServiceResult<ParentChildResponse>.Failure(ServiceErrorType.BadRequest, "Child user must have the Child role.");
            }

            var relationshipExists = await _dbContext.ParentChildren
                .AnyAsync(parentChild => parentChild.ParentId == parentId && parentChild.ChildId == request.ChildId);

            if (relationshipExists)
            {
                return ServiceResult<ParentChildResponse>.Failure(ServiceErrorType.Conflict, "Parent-child relationship already exists.");
            }

            var parentChildRelationship = new global::ParentChild
            {
                ParentId = parentId,
                ChildId = request.ChildId
            };

            _dbContext.ParentChildren.Add(parentChildRelationship);
            await _dbContext.SaveChangesAsync();

            return ServiceResult<ParentChildResponse>.Success(ToResponse(parentChildRelationship, child));
        }

        private bool CanAccess(int parentId, int childId)
        {
            return _currentUserService.Role == UserRole.Admin
                || (_currentUserService.Role == UserRole.Parent && _currentUserService.UserId == parentId)
                || (_currentUserService.Role == UserRole.Child && _currentUserService.UserId == childId);
        }

        private static ParentChildResponse ToResponse(global::ParentChild parentChild)
        {
            return new ParentChildResponse(parentChild.Id, parentChild.ParentId, parentChild.ChildId, parentChild.Child.Name, parentChild.Child.Email);
        }

        private static ParentChildResponse ToResponse(global::ParentChild parentChild, User child)
        {
            return new ParentChildResponse(parentChild.Id, parentChild.ParentId, parentChild.ChildId, child.Name, child.Email);
        }
    }
}

