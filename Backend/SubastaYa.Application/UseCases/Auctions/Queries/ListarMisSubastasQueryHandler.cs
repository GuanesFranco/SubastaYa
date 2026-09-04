using SubastaYa.Application.DTOs.Auctions;
using SubastaYa.Application.Interfaces;

namespace SubastaYa.Application.UseCases.Auctions.Queries;

public class ListarMisSubastasQueryHandler
{
    private readonly ISubastaRepository _repository;

    public ListarMisSubastasQueryHandler(ISubastaRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<SubastaResumenDto>> Handle(ListarMisSubastasQuery query)
    {
        var subastas = await _repository.ObtenerSubastasPorVendedorAsync(query.VendedorId);
        
        return subastas.Select(s => new SubastaResumenDto(
            s.Id,
            s.Titulo,
            s.UrlImagen,
            s.PrecioActual,
            s.FechaFin,
            s.Estado,
            s.Categoria.Nombre,
            s.Pujas.Count
        ));
    }
}
