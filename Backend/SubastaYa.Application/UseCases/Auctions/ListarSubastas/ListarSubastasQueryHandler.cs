using Microsoft.Extensions.Logging;
using SubastaYa.Application.Common;
using SubastaYa.Application.Common.Time;
using SubastaYa.Application.DTOs.Auctions;
using SubastaYa.Application.DTOs.Common;
using SubastaYa.Application.Interfaces.Persistence;
using SubastaYa.Application.Interfaces.Services;

namespace SubastaYa.Application.UseCases.Auctions.ListarSubastas;

public class ListarSubastasQueryHandler : IQueryHandler<ListarSubastasQuery, PaginatedResult<SubastaResumenDto>>
{
    private readonly ILogger<ListarSubastasQueryHandler> _logger;
    private readonly ISubastaRepository _subastaRepository;

    public ListarSubastasQueryHandler(ISubastaRepository subastaRepository, ILogger<ListarSubastasQueryHandler> logger)
    {
        _logger = logger;
        _subastaRepository = subastaRepository;
    }

    public async Task<PaginatedResult<SubastaResumenDto>> Handle(
        ListarSubastasQuery query, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Ejecutando ListarSubastasQueryHandler...");

        var f = query.Filtro;
        var (page, pageSize) = Paginacion.Normalizar(f.Page, f.PageSize);

        var (items, total) = await _subastaRepository.ObtenerFiltradasAsync(
            f.CategoriaId, f.Estado, f.PrecioMin, f.PrecioMax, f.OrderBy, page, pageSize, cancellationToken);

        return new PaginatedResult<SubastaResumenDto>
        {
            Items = items.Select(d => d with { FechaFin = FechaArgentina.ComoUtc(d.FechaFin) }).ToList(),
            TotalItems = total,
            Page = page,
            PageSize = pageSize
        };
    }
}
