using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Javaline.Commercial.Infrastructure.Data;

// Used only by EF Core CLI tools (dotnet ef migrations add ...)
public class JavalineDbContextFactory : IDesignTimeDbContextFactory<JavalineDbContext>
{
    public JavalineDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL")
            ?? "Host=localhost;Database=javaline_dev;Username=postgres;Password=postgres";

        var options = new DbContextOptionsBuilder<JavalineDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new JavalineDbContext(options);
    }
}
