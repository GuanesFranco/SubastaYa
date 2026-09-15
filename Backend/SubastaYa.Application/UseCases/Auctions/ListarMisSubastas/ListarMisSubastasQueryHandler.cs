using Microsoft.Extensions.Logging;
using SubastaYa.Application.Common;
using SubastaYa.Application.Common.Time;
using SubastaYa.Application.DTOs.Auctions;
using SubastaYa.Application.DTOs.Common;
using SubastaYa.Application.Interfaces.Persistence;
using SubastaYa.Application.Interfaces.Services;

namespace SubastaYa.Application.UseCases.Auctions.ListarMisSubastas;

public class ListarMisSubastasQueryHandler : IQueryHandler<ListarMisSubastasQuery, PaginatedResult<SubastaResumenDto>>
{
    private readonly ILogger<ListarMisSubastasQueryHandler> _logger;
    private readonly ISubastaRepository _repository;

    public ListarMisSubastasQueryHandler(ISubastaRepository repository, ILogger<ListarMisSubastasQueryHandler> logger)
    {
        _logger = logger;
        _repository = repository;
    }

    public async Task<PaginatedResult<SubastaResumenDto>> Handle(
        ListarMisSubastasQuery query, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Ejecutando ListarMisSubastasQueryHandler...");

        var (page, pageSize) = Paginacion.Normalizar(query.Page, query.PageSize);
        var (items, total) = await _repository.ObtenerSubastasPorVendedorAsync(
            query.VendedorId, page, pageSize, cancellationToken);

        return new PaginatedResult<SubastaResumenDto>
        {
            Items = items.Select(d => d with
            {
                FechaFin = FechaArgentina.ComoUtc(d.FechaFin),
                FechaUltimaPuja = d.FechaUltimaPuja.HasValue ? FechaArgentina.ComoUtc(d.FechaUltimaPuja.Value) : null
            }).ToList(),
            TotalItems = total,
            Page = page,
            PageSize = pageSize
        };
    }
}
