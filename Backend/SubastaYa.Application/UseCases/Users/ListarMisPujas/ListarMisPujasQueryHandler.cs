using Microsoft.Extensions.Logging;
using SubastaYa.Application.DTOs.Auctions;
using SubastaYa.Application.Interfaces.Persistence;
using SubastaYa.Application.Interfaces.Services;
using SubastaYa.Domain.Enums;

namespace SubastaYa.Application.UseCases.Users.ListarMisPujas;

public class ListarMisPujasQueryHandler
{
    private readonly ILogger<ListarMisPujasQueryHandler> _logger;
    private readonly ISubastaRepository _subastaRepository;

    public ListarMisPujasQueryHandler(ISubastaRepository subastaRepository, ILogger<ListarMisPujasQueryHandler> logger)
    {
        _logger = logger;
        _subastaRepository = subastaRepository;
    }

    public async Task<IEnumerable<MisPujasDto>> Handle(ListarMisPujasQuery query)
    {
        _logger.LogInformation("Ejecutando ListarMisPujasQueryHandler...");
        var subastas = await _subastaRepository.ObtenerSubastasDondeParticipoAsync(query.CompradorId);

        return subastas.Select(s => new MisPujasDto(
            s.Id,
            s.Titulo,
            s.UrlImagen,
            s.PrecioActual,
            s.Estado,
            s.Estado == EstadoSubasta.Finalizada && s.GanadorUsuarioId == query.CompradorId
        ));
    }
}




