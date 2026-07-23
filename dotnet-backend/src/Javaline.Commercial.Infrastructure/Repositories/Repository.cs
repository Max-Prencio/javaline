using System.Linq.Expressions;
using Javaline.Commercial.Domain.Common;
using Javaline.Commercial.Domain.Interfaces;
using Javaline.Commercial.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Javaline.Commercial.Infrastructure.Repositories;

public class Repository<T> : IRepository<T> where T : BaseEntity
{
    protected readonly JavalineDbContext _db;
    protected readonly DbSet<T> _set;

    public Repository(JavalineDbContext db)
    {
        _db = db;
        _set = db.Set<T>();
    }

    public virtual async Task<T?> GetByIdAsync(string id)
        => await _set.FindAsync(new object[] { id });

    public virtual async Task<IReadOnlyList<T>> GetAllAsync()
        => await _set.AsNoTracking().ToListAsync();

    public virtual async Task<PagedResult<T>> GetPagedAsync(PagedRequest request)
    {
        IQueryable<T> query = _set;

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
            query = ApplySearch(query, request.SearchTerm);

        if (!string.IsNullOrWhiteSpace(request.SortBy))
            query = ApplySort(query, request.SortBy, request.SortDesc);

        var total = await query.CountAsync();
        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .AsNoTracking()
            .ToListAsync();

        return new PagedResult<T>
        {
            Items = items,
            TotalCount = total,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }

    public virtual async Task<T> AddAsync(T entity)
    {
        await _set.AddAsync(entity);
        return entity;
    }

    public virtual Task UpdateAsync(T entity)
    {
        _set.Update(entity);
        return Task.CompletedTask;
    }

    public virtual async Task DeleteAsync(string id)
    {
        var entity = await _set.FindAsync(new object[] { id });
        if (entity != null)
            _set.Remove(entity);
    }

    public virtual IQueryable<T> Query() => _set;

    public virtual IQueryable<T> Query(Expression<Func<T, bool>> predicate) => _set.Where(predicate);

    protected virtual IQueryable<T> ApplySearch(IQueryable<T> query, string term) => query;

    private static IQueryable<T> ApplySort(IQueryable<T> query, string sortBy, bool desc)
    {
        var param = Expression.Parameter(typeof(T), "x");
        var prop = Expression.Property(param, sortBy);
        var lambda = Expression.Lambda(prop, param);
        var method = desc ? "OrderByDescending" : "OrderBy";
        var expr = Expression.Call(
            typeof(Queryable), method,
            new[] { typeof(T), prop.Type },
            query.Expression, Expression.Quote(lambda));
        return query.Provider.CreateQuery<T>(expr);
    }
}
