using Microsoft.Extensions.Logging;
using SubastaYa.Application.Common;
using SubastaYa.Application.DTOs.Auctions;
using SubastaYa.Application.DTOs.Common;
using SubastaYa.Application.Interfaces.Persistence;
using SubastaYa.Application.Interfaces.Services;

namespace SubastaYa.Application.UseCases.Auctions.ListarPujas;

public class ListarPujasQueryHandler : IQueryHandler<ListarPujasQuery, PaginatedResult<PujaDto>>
{
    private readonly ILogger<ListarPujasQueryHandler> _logger;
    private readonly ISubastaRepository _repository;

    public ListarPujasQueryHandler(ISubastaRepository repository, ILogger<ListarPujasQueryHandler> logger)
    {
        _logger = logger;
        _repository = repository;
    }

    public async Task<PaginatedResult<PujaDto>> Handle(
        ListarPujasQuery query, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Ejecutando ListarPujasQueryHandler...");

        var (page, pageSize) = Paginacion.Normalizar(query.Page, query.PageSize);
        var (pujas, total) = await _repository.ObtenerPujasAsync(query.SubastaId, page, pageSize, cancellationToken);

        return new PaginatedResult<PujaDto>
        {
            Items = pujas.Select(p => new PujaDto(
                p.Id,
                p.Monto,
                p.FechaPuja,
                p.Comprador.Nombre.Substring(0, Math.Min(2, p.Comprador.Nombre.Length)) + "***",
                p.CompradorId
            )).ToList(),
            TotalItems = total,
            Page = page,
            PageSize = pageSize
        };
    }
}
