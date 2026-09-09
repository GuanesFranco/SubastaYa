using Microsoft.Extensions.Logging;
using SubastaYa.Application.Common.Time;
using SubastaYa.Application.DTOs.Auctions;
using SubastaYa.Application.Interfaces.Persistence;
using SubastaYa.Application.Interfaces.Services;

namespace SubastaYa.Application.UseCases.Auctions.ListarMisSubastas;

public class ListarMisSubastasQueryHandler
{
    private readonly ILogger<ListarMisSubastasQueryHandler> _logger;
    private readonly ISubastaRepository _repository;

    public ListarMisSubastasQueryHandler(ISubastaRepository repository, ILogger<ListarMisSubastasQueryHandler> logger)
    {
        _logger = logger;
        _repository = repository;
    }

    public async Task<IEnumerable<SubastaResumenDto>> Handle(ListarMisSubastasQuery query)
    {
        _logger.LogInformation("Ejecutando ListarMisSubastasQueryHandler...");
        var subastas = await _repository.ObtenerSubastasPorVendedorAsync(query.VendedorId);
        
        return subastas.Select(s => new SubastaResumenDto(
            s.Id,
            s.Titulo,
            s.UrlImagen,
            s.PrecioActual,
            FechaArgentina.ComoUtc(s.FechaFin),
            s.Estado,
            s.Categoria.Nombre,
            s.Pujas.Count
        ));
    }
}




