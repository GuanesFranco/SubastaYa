using Microsoft.Extensions.Logging;
using SubastaYa.Application.Common.Time;
using SubastaYa.Application.DTOs.Auctions;
using SubastaYa.Application.Interfaces.Persistence;
using SubastaYa.Application.Interfaces.Services;

namespace SubastaYa.Application.UseCases.Auctions.ListarPujas;

public class ListarPujasQueryHandler
{
    private readonly ILogger<ListarPujasQueryHandler> _logger;
    private readonly ISubastaRepository _repository;

    public ListarPujasQueryHandler(ISubastaRepository repository, ILogger<ListarPujasQueryHandler> logger)
    {
        _logger = logger;
        _repository = repository;
    }

    public async Task<IEnumerable<PujaDto>> Handle(ListarPujasQuery query)
    {
        _logger.LogInformation("Ejecutando ListarPujasQueryHandler...");
        var pujas = await _repository.ObtenerPujasAsync(query.SubastaId);
        
        return pujas.Select(p => new PujaDto(
            p.Id,
            p.Monto,
            FechaArgentina.ComoUtc(p.FechaPuja),
            p.Comprador.Nombre.Substring(0, Math.Min(2, p.Comprador.Nombre.Length)) + "***"
        ));
    }
}




