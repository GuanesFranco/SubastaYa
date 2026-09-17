using Microsoft.Extensions.Logging;
using SubastaYa.Application.DTOs.Auctions;
using SubastaYa.Application.Interfaces.Persistence;
using SubastaYa.Application.Interfaces.Services;

namespace SubastaYa.Application.UseCases.Auctions.ObtenerSubasta;

public class ObtenerSubastaQueryHandler : IQueryHandler<ObtenerSubastaQuery, SubastaDetalleDto>
{
    private readonly ILogger<ObtenerSubastaQueryHandler> _logger;
    private readonly ISubastaRepository _subastaRepository;

    public ObtenerSubastaQueryHandler(ISubastaRepository subastaRepository, ILogger<ObtenerSubastaQueryHandler> logger)
    {
        _logger = logger;
        _subastaRepository = subastaRepository;
    }

    public async Task<SubastaDetalleDto> Handle(ObtenerSubastaQuery query, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Ejecutando ObtenerSubastaQueryHandler...");
        var subasta = await _subastaRepository.ObtenerDetalleAsync(query.Id, cancellationToken);

        if (subasta == null)
        {
            throw new KeyNotFoundException($"No se encontró la subasta con ID {query.Id}.");
        }

        var heParticipado = query.UsuarioId.HasValue
            && await _subastaRepository.ExisteMiPujaAsync(query.Id, query.UsuarioId.Value, cancellationToken);

        return new SubastaDetalleDto(
            subasta.Id,
            subasta.Titulo,
            subasta.Descripcion,
            subasta.UrlImagen,
            subasta.PrecioBase,
            subasta.PrecioActual,
            subasta.IncrementoMinimo,
            subasta.FechaInicio,
            subasta.FechaFin,
            subasta.Estado,
            subasta.Categoria.Nombre,
            subasta.VendedorId,
            subasta.Vendedor.Nombre,
            subasta.PujaLiderId,
            subasta.PujaLider?.CompradorId,
            heParticipado
        );
    }
}



