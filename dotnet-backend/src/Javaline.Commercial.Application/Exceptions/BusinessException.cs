namespace Javaline.Commercial.Application.Exceptions;

public class BusinessException : Exception
{
    public string Code { get; }
    public int StatusCode { get; }

    public BusinessException(string code, string message, int statusCode = 400) : base(message)
    {
        Code = code;
        StatusCode = statusCode;
    }
}

public class NotFoundException : BusinessException
{
    public NotFoundException(string entity, string id)
        : base("NOT_FOUND", $"{entity} with ID {id} was not found.", 444)
    {
    }
}
