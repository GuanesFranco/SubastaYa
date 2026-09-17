using Microsoft.EntityFrameworkCore;
using SubastaYa.Application.Interfaces.Persistence;
using SubastaYa.Domain.Entities;

namespace SubastaYa.Infrastructure.Persistence.Repositories;

public class BilleteraRepository : IBilleteraRepository
{
    private readonly SubastaYaDbContext _ctx;

    public BilleteraRepository(SubastaYaDbContext ctx)
    {
        _ctx = ctx;
    }

    public async Task<Billetera?> ObtenerPorUsuarioIdAsync(int usuarioId, CancellationToken cancellationToken = default)
    {
        return await _ctx.Billeteras.FirstOrDefaultAsync(b => b.UsuarioId == usuarioId, cancellationToken);
    }

    public async Task AgregarMovimientoAsync(TransaccionLedger movimiento, CancellationToken cancellationToken = default)
    {
        await _ctx.TransaccionesLedger.AddAsync(movimiento, cancellationToken);
    }

    public async Task<(IEnumerable<TransaccionLedger> Items, int Total)> ObtenerMovimientosPorUsuarioIdAsync(
        int usuarioId, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _ctx.TransaccionesLedger
            .AsNoTracking()
            .Where(t => t.Billetera.UsuarioId == usuarioId);

        int total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(t => t.Fecha)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }
}
