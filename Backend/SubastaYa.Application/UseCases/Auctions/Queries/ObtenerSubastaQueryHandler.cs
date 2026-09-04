using SubastaYa.Application.DTOs.Auctions;
using SubastaYa.Application.Interfaces;

namespace SubastaYa.Application.UseCases.Auctions.Queries;

public class ObtenerSubastaQueryHandler
{
    private readonly ISubastaRepository _subastaRepository;

    public ObtenerSubastaQueryHandler(ISubastaRepository subastaRepository)
    {
        _subastaRepository = subastaRepository;
    }

    public async Task<SubastaDetalleDto> Handle(ObtenerSubastaQuery query)
    {
        var subasta = await _subastaRepository.ObtenerDetalleAsync(query.Id);

        if (subasta == null)
        {
            throw new KeyNotFoundException($"No se encontró la subasta con ID {query.Id}.");
        }

        return new SubastaDetalleDto(
            subasta.Id,
            subasta.Titulo,
            subasta.Descripcion,
            subasta.UrlImagen,
            subasta.PrecioBase,
            subasta.PrecioActual,
            subasta.FechaInicio,
            subasta.FechaFin,
            subasta.Estado,
            subasta.Categoria.Nombre,
            subasta.Vendedor.Nombre,
            subasta.PujaLiderId
        );
    }
}
