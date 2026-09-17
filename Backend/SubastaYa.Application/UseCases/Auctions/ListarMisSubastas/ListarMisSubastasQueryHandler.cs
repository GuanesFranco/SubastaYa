using Microsoft.Extensions.Logging;
using SubastaYa.Application.Common;
using SubastaYa.Application.DTOs.Auctions;
using SubastaYa.Application.Interfaces.Persistence;
using SubastaYa.Application.Interfaces.Services;

namespace SubastaYa.Application.UseCases.Auctions.ListarMisSubastas;

public class ListarMisSubastasQueryHandler : IQueryHandler<ListarMisSubastasQuery, MisSubastasResult>
{
    private readonly ILogger<ListarMisSubastasQueryHandler> _logger;
    private readonly ISubastaRepository _repository;

    public ListarMisSubastasQueryHandler(ISubastaRepository repository, ILogger<ListarMisSubastasQueryHandler> logger)
    {
        _logger = logger;
        _repository = repository;
    }

    public async Task<MisSubastasResult> Handle(
        ListarMisSubastasQuery query, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Ejecutando ListarMisSubastasQueryHandler...");

        var (page, pageSize) = Paginacion.Normalizar(query.Page, query.PageSize);
        var (items, total) = await _repository.ObtenerSubastasPorVendedorAsync(
            query.VendedorId, page, pageSize, cancellationToken);
        var metricas = await _repository.ObtenerMetricasVendedorAsync(query.VendedorId, cancellationToken);

        return new MisSubastasResult
        {
            Items = items.ToList(),
            TotalItems = total,
            Page = page,
            PageSize = pageSize,
            Metricas = metricas
        };
    }
}
