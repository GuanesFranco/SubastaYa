using SubastaYa.Application.DTOs.Auctions;
using SubastaYa.Application.Interfaces;

namespace SubastaYa.Application.UseCases.Auctions.Queries;

public class ListarPujasQueryHandler
{
    private readonly ISubastaRepository _repository;

    public ListarPujasQueryHandler(ISubastaRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<PujaDto>> Handle(ListarPujasQuery query)
    {
        var pujas = await _repository.ObtenerPujasAsync(query.SubastaId);
        
        return pujas.Select(p => new PujaDto(
            p.Id,
            p.Monto,
            p.FechaPuja,
            p.Comprador.Nombre.Substring(0, Math.Min(2, p.Comprador.Nombre.Length)) + "***"
        ));
    }
}
