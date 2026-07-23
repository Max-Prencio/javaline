namespace Javaline.Commercial.Application.Interfaces;

public interface ICacheService
{
    Task<T?> GetOrCreateAsync<T>(string key, Func<Task<T>> factory, TimeSpan ttl);
    bool TryGet<T>(string key, out T? value);
    void Set<T>(string key, T value, TimeSpan ttl);
    void Remove(string key);
    void RemoveByPrefix(string prefix);
}
