using SubastaYa.Application.Interfaces;
using SubastaYa.Infrastructure.Data;

namespace SubastaYa.Infrastructure.Persistence;

public class UnitOfWork : IUnitOfWork
{
    private readonly SubastaYaDbContext _ctx;

    public UnitOfWork(SubastaYaDbContext ctx)
    {
        _ctx = ctx;
    }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _ctx.SaveChangesAsync(cancellationToken);
    }
}
