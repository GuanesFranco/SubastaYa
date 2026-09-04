using Microsoft.EntityFrameworkCore;
using SubastaYa.Domain.Entities;
using SubastaYa.Domain.Enums;
using SubastaYa.Application.Interfaces;

namespace SubastaYa.Infrastructure.Data.Repositories;

public class SubastaRepository : ISubastaRepository
{
    private readonly SubastaYaDbContext _context;

    public SubastaRepository(SubastaYaDbContext context)
    {
        _context = context;
    }

    public async Task AgregarAsync(Subasta subasta)
    {
        await _context.Subastas.AddAsync(subasta);
    }

    public async Task<bool> ExisteCategoriaAsync(int categoriaId)
    {
        return await _context.Categorias.AnyAsync(c => c.Id == categoriaId);
    }

    public async Task<(IEnumerable<Subasta> Items, int Total)> ObtenerFiltradasAsync(
        int? categoriaId, EstadoSubasta? estado, decimal? precioMin, decimal? precioMax, string? orderBy, int page, int pageSize)
    {
        var query = _context.Subastas
            .Include(s => s.Categoria)
            .Include(s => s.Pujas)
            .AsNoTracking()
            .AsQueryable();

        if (categoriaId.HasValue) query = query.Where(s => s.CategoriaId == categoriaId.Value);
        if (estado.HasValue) query = query.Where(s => s.Estado == estado.Value);
        if (precioMin.HasValue) query = query.Where(s => s.PrecioActual >= precioMin.Value);
        if (precioMax.HasValue) query = query.Where(s => s.PrecioActual <= precioMax.Value);

        query = orderBy?.ToLower() switch
        {
            "precio_asc" => query.OrderBy(s => s.PrecioActual),
            "precio_desc" => query.OrderByDescending(s => s.PrecioActual),
            "fecha_asc" => query.OrderBy(s => s.FechaFin),
            _ => query.OrderByDescending(s => s.FechaFin)
        };

        int total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return (items, total);
    }

    public async Task<Subasta?> ObtenerDetalleAsync(int id)
    {
        return await _context.Subastas
            .Include(s => s.Categoria)
            .Include(s => s.Vendedor)
            .Include(s => s.PujaLider)
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<IEnumerable<Puja>> ObtenerPujasAsync(int subastaId)
    {
        return await _context.Pujas
            .Include(p => p.Comprador)
            .Where(p => p.SubastaId == subastaId)
            .OrderByDescending(p => p.FechaPuja)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<IEnumerable<Subasta>> ObtenerSubastasPorVendedorAsync(int vendedorId)
    {
        return await _context.Subastas
            .Include(s => s.Categoria)
            .Include(s => s.Pujas)
            .Where(s => s.VendedorId == vendedorId)
            .OrderByDescending(s => s.FechaInicio)
            .AsNoTracking()
            .ToListAsync();
    }
}
