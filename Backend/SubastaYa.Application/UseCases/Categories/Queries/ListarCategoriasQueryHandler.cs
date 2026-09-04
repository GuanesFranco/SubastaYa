using SubastaYa.Application.DTOs.Categories;
using SubastaYa.Domain.Interfaces;

namespace SubastaYa.Application.UseCases.Categories.Queries;

public class ListarCategoriasQueryHandler
{
    private readonly ICategoriaRepository _categoriaRepository;

    public ListarCategoriasQueryHandler(ICategoriaRepository categoriaRepository)
    {
        _categoriaRepository = categoriaRepository;
    }

    public async Task<IEnumerable<CategoriaDto>> Handle(ListarCategoriasQuery query)
    {
        var categorias = await _categoriaRepository.ObtenerTodasAsync();
        
        return categorias.Select(c => new CategoriaDto(c.Id, c.Nombre, c.UrlIcono));
    }
}
