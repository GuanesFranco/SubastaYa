using Microsoft.EntityFrameworkCore;
using SubastaYa.Application.DTOs.Auctions;
using SubastaYa.Application.Interfaces.Persistence;
using SubastaYa.Domain.Entities;
using SubastaYa.Domain.Enums;

namespace SubastaYa.Infrastructure.Persistence.Repositories;

public class SubastaRepository : ISubastaRepository
{
    private readonly SubastaYaDbContext _context;

    public SubastaRepository(SubastaYaDbContext context)
    {
        _context = context;
    }

    public async Task AgregarAsync(Subasta subasta, CancellationToken cancellationToken = default)
    {
        await _context.Subastas.AddAsync(subasta, cancellationToken);
    }

    public async Task<bool> ExisteCategoriaAsync(int categoriaId, CancellationToken cancellationToken = default)
    {
        return await _context.Categorias.AnyAsync(c => c.Id == categoriaId, cancellationToken);
    }

    public async Task<(IEnumerable<SubastaResumenDto> Items, int Total)> ObtenerFiltradasAsync(
        int? categoriaId, EstadoSubasta? estado, decimal? precioMin, decimal? precioMax,
        string? orderBy, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _context.Subastas.AsNoTracking().AsQueryable();

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

        int total = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new SubastaResumenDto(
                s.Id,
                s.Titulo,
                s.UrlImagen,
                s.PrecioActual,
                s.FechaFin,
                s.Estado,
                s.Categoria.Nombre,
                s.Pujas.Count))
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public async Task<Subasta?> ObtenerDetalleAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Subastas
            .Include(s => s.Categoria)
            .Include(s => s.Vendedor)
            .Include(s => s.PujaLider)
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task<(IEnumerable<Puja> Items, int Total)> ObtenerPujasAsync(
        int subastaId, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _context.Pujas
            .AsNoTracking()
            .Where(p => p.SubastaId == subastaId);

        int total = await query.CountAsync(cancellationToken);

        var items = await query
            .Include(p => p.Comprador)
            .OrderByDescending(p => p.FechaPuja)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public async Task<(IEnumerable<SubastaResumenDto> Items, int Total)> ObtenerSubastasPorVendedorAsync(
        int vendedorId, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _context.Subastas
            .AsNoTracking()
            .Where(s => s.VendedorId == vendedorId);

        int total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(s => s.FechaInicio)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new SubastaResumenDto(
                s.Id,
                s.Titulo,
                s.UrlImagen,
                s.PrecioActual,
                s.FechaFin,
                s.Estado,
                s.Categoria.Nombre,
                s.Pujas.Count))
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public async Task<Subasta?> ObtenerParaPujarAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Subastas
            .Include(s => s.PujaLider)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task AgregarPujaAsync(Puja puja, CancellationToken cancellationToken = default)
    {
        await _context.Pujas.AddAsync(puja, cancellationToken);
    }

    public async Task<(IEnumerable<MisPujasDto> Items, int Total)> ObtenerSubastasDondeParticipoAsync(
        int compradorId, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _context.Subastas
            .AsNoTracking()
            .Where(s => s.Pujas.Any(p => p.CompradorId == compradorId));

        int total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(s => s.FechaFin)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new MisPujasDto(
                s.Id,
                s.Titulo,
                s.UrlImagen,
                s.PrecioActual,
                s.Estado,
                s.Estado == EstadoSubasta.Finalizada && s.GanadorUsuarioId == compradorId,
                s.FechaFin))
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public async Task<IEnumerable<int>> ObtenerIdsPendientesDeActivacionAsync(
        DateTime ahoraUtc, CancellationToken cancellationToken = default)
    {
        return await _context.Subastas
            .Where(s => s.Estado == EstadoSubasta.Programada && s.FechaInicio <= ahoraUtc)
            .Select(s => s.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<int>> ObtenerIdsPendientesDeCierreAsync(
        DateTime ahoraUtc, CancellationToken cancellationToken = default)
    {
        return await _context.Subastas
            .Where(s => s.Estado == EstadoSubasta.Activa && s.FechaFin <= ahoraUtc)
            .Select(s => s.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<Subasta?> ObtenerParaLiquidacionAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Subastas
            .Include(s => s.PujaLider)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }
}
