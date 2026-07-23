namespace Javaline.Commercial.Application.DTOs;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public T? Data { get; set; }
    public List<string> Errors { get; set; } = new();

    public static ApiResponse<T> Ok(T data, string? msg = null) => new()
    {
        Success = true,
        Data = data,
        Message = msg
    };

    public static ApiResponse<T> Fail(string error) => new()
    {
        Success = false,
        Errors = new() { error }
    };

    public static ApiResponse<T> Fail(List<string> errors) => new()
    {
        Success = false,
        Errors = errors
    };
}

public class ApiResponse
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public List<string> Errors { get; set; } = new();

    public static ApiResponse Ok(string? msg = null) => new() { Success = true, Message = msg };
    public static ApiResponse Fail(string error) => new() { Success = false, Errors = new() { error } };
}
