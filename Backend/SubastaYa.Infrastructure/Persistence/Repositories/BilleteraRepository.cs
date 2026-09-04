using Microsoft.EntityFrameworkCore;
using SubastaYa.Application.Interfaces;
using SubastaYa.Domain.Entities;
using SubastaYa.Infrastructure.Data;

namespace SubastaYa.Infrastructure.Persistence.Repositories;

public class BilleteraRepository : IBilleteraRepository
{
    private readonly SubastaYaDbContext _ctx;

    public BilleteraRepository(SubastaYaDbContext ctx)
    {
        _ctx = ctx;
    }

    public async Task<Billetera?> ObtenerPorUsuarioIdAsync(int usuarioId)
    {
        return await _ctx.Billeteras.FirstOrDefaultAsync(b => b.UsuarioId == usuarioId);
    }

    public async Task AgregarMovimientoAsync(TransaccionLedger movimiento)
    {
        await _ctx.TransaccionesLedger.AddAsync(movimiento);
    }

    public async Task<List<TransaccionLedger>> ObtenerMovimientosPorUsuarioIdAsync(int usuarioId)
    {
        return await _ctx.TransaccionesLedger
            .AsNoTracking()
            .Where(t => t.Billetera.UsuarioId == usuarioId)
            .OrderByDescending(t => t.Fecha)
            .ToListAsync();
    }
}
