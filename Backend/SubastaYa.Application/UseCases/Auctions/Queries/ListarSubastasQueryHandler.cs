using SubastaYa.Application.DTOs.Auctions;
using SubastaYa.Application.DTOs.Common;
using SubastaYa.Domain.Interfaces;

namespace SubastaYa.Application.UseCases.Auctions.Queries;

public class ListarSubastasQueryHandler
{
    private readonly ISubastaRepository _subastaRepository;

    public ListarSubastasQueryHandler(ISubastaRepository subastaRepository)
    {
        _subastaRepository = subastaRepository;
    }

    public async Task<PaginatedResult<SubastaResumenDto>> Handle(ListarSubastasQuery query)
    {
        var f = query.Filtro;
        var (items, total) = await _subastaRepository.ObtenerFiltradasAsync(
            f.CategoriaId, f.Estado, f.PrecioMin, f.PrecioMax, f.OrderBy, f.Page, f.PageSize);

        var dtos = items.Select(s => new SubastaResumenDto(
            s.Id,
            s.Titulo,
            s.UrlImagen,
            s.PrecioActual,
            s.FechaFin,
            s.Estado
        ));

        return new PaginatedResult<SubastaResumenDto>
        {
            Items = dtos,
            TotalItems = total,
            Page = f.Page,
            PageSize = f.PageSize
        };
    }
}
