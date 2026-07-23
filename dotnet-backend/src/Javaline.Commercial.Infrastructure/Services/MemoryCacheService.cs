using System.Collections.Concurrent;
using Javaline.Commercial.Application.Interfaces;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace Javaline.Commercial.Infrastructure.Services;

public class MemoryCacheService : ICacheService
{
    private readonly IMemoryCache _cache;
    private readonly ILogger<MemoryCacheService> _logger;
    private readonly ConcurrentDictionary<string, byte> _keys = new();

    public MemoryCacheService(IMemoryCache cache, ILogger<MemoryCacheService> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public async Task<T?> GetOrCreateAsync<T>(string key, Func<Task<T>> factory, TimeSpan ttl)
    {
        if (_cache.TryGetValue(key, out T? cached))
        {
            _logger.LogDebug("Cache HIT: {Key}", key);
            return cached;
        }

        _logger.LogDebug("Cache MISS: {Key}", key);
        var value = await factory();

        var options = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = ttl,
            Size = 1,
        };
        options.RegisterPostEvictionCallback((k, _, _, _) => _keys.TryRemove(k.ToString()!, out _));

        _cache.Set(key, value, options);
        _keys[key] = 0;

        return value;
    }

    public void Remove(string key)
    {
        _cache.Remove(key);
        _keys.TryRemove(key, out _);
        _logger.LogDebug("Cache REMOVE: {Key}", key);
    }

    public void RemoveByPrefix(string prefix)
    {
        var toRemove = _keys.Keys.Where(k => k.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)).ToList();
        foreach (var key in toRemove)
        {
            _cache.Remove(key);
            _keys.TryRemove(key, out _);
        }
        _logger.LogDebug("Cache INVALIDATE prefix '{Prefix}': {Count} keys removed", prefix, toRemove.Count);
    }
}
