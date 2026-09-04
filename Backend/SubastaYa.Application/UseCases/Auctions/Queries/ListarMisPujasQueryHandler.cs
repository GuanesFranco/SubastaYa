using SubastaYa.Application.DTOs.Auctions;
using SubastaYa.Application.Interfaces;
using SubastaYa.Domain.Enums;

namespace SubastaYa.Application.UseCases.Auctions.Queries;

public class ListarMisPujasQueryHandler
{
    private readonly ISubastaRepository _subastaRepository;

    public ListarMisPujasQueryHandler(ISubastaRepository subastaRepository)
    {
        _subastaRepository = subastaRepository;
    }

    public async Task<IEnumerable<MisPujasDto>> Handle(ListarMisPujasQuery query)
    {
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
