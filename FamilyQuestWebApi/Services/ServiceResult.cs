namespace FamilyQuestWebApi.Services
{
    public enum ServiceErrorType
    {
        NotFound,
        BadRequest,
        Conflict,
        Forbidden
    }

    public class ServiceResult<T>
    {
        private ServiceResult(T? value, ServiceErrorType? errorType, string? errorMessage)
        {
            Value = value;
            ErrorType = errorType;
            ErrorMessage = errorMessage;
        }

        public T? Value { get; }

        public ServiceErrorType? ErrorType { get; }

        public string? ErrorMessage { get; }

        public bool IsSuccess => ErrorType == null;

        public static ServiceResult<T> Success(T value)
        {
            return new ServiceResult<T>(value, null, null);
        }

        public static ServiceResult<T> Failure(ServiceErrorType errorType, string? errorMessage = null)
        {
            return new ServiceResult<T>(default, errorType, errorMessage);
        }
    }
}
