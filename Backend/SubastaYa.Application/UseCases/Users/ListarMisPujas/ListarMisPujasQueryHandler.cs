using Microsoft.Extensions.Logging;
using SubastaYa.Application.Common;
using SubastaYa.Application.DTOs.Auctions;
using SubastaYa.Application.DTOs.Common;
using SubastaYa.Application.Interfaces.Persistence;
using SubastaYa.Application.Interfaces.Services;
using SubastaYa.Domain.Enums;

namespace SubastaYa.Application.UseCases.Users.ListarMisPujas;

public class ListarMisPujasQueryHandler : IQueryHandler<ListarMisPujasQuery, PaginatedResult<MisPujasDto>>
{
    private readonly ILogger<ListarMisPujasQueryHandler> _logger;
    private readonly ISubastaRepository _subastaRepository;

    public ListarMisPujasQueryHandler(ISubastaRepository subastaRepository, ILogger<ListarMisPujasQueryHandler> logger)
    {
        _logger = logger;
        _subastaRepository = subastaRepository;
    }

    public async Task<PaginatedResult<MisPujasDto>> Handle(
        ListarMisPujasQuery query, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Ejecutando ListarMisPujasQueryHandler...");

        var (page, pageSize) = Paginacion.Normalizar(query.Page, query.PageSize);
        var (subastas, total) = await _subastaRepository.ObtenerSubastasDondeParticipoAsync(
            query.CompradorId, page, pageSize, cancellationToken);

        return new PaginatedResult<MisPujasDto>
        {
            Items = subastas.Select(s => new MisPujasDto(
                s.Id,
                s.Titulo,
                s.UrlImagen,
                s.PrecioActual,
                s.Estado,
                s.Estado == EstadoSubasta.Finalizada && s.GanadorUsuarioId == query.CompradorId
            )).ToList(),
            TotalItems = total,
            Page = page,
            PageSize = pageSize
        };
    }
}
