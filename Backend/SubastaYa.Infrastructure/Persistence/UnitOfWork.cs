using Microsoft.EntityFrameworkCore;
using SubastaYa.Application.Interfaces;
using SubastaYa.Domain.Exceptions;

namespace SubastaYa.Infrastructure.Persistence;

public class UnitOfWork : IUnitOfWork
{
    private readonly SubastaYaDbContext _ctx;

    public UnitOfWork(SubastaYaDbContext ctx)
    {
        _ctx = ctx;
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            return await _ctx.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            throw new ConflictoConcurrenciaException(
                "Conflicto de concurrencia al guardar los cambios.", ex);
        }
    }

    public void DescartarCambios()
    {
        _ctx.ChangeTracker.Clear();
    }
}
