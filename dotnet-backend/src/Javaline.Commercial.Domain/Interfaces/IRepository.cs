using System.Linq.Expressions;
using Javaline.Commercial.Domain.Common;

namespace Javaline.Commercial.Domain.Interfaces;

public interface IRepository<T> where T : BaseEntity
{
    Task<T?> GetByIdAsync(string id);
    Task<IReadOnlyList<T>> GetAllAsync();
    Task<PagedResult<T>> GetPagedAsync(PagedRequest request);
    Task<T> AddAsync(T entity);
    Task UpdateAsync(T entity);
    Task DeleteAsync(string id);
    IQueryable<T> Query();
    IQueryable<T> Query(Expression<Func<T, bool>> predicate);
}
