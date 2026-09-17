using Microsoft.Extensions.Logging;
using SubastaYa.Application.DTOs.Categories;
using SubastaYa.Application.Interfaces.Persistence;
using SubastaYa.Application.Interfaces.Services;

namespace SubastaYa.Application.UseCases.Categories.ListarCategorias;

public class ListarCategoriasQueryHandler : IQueryHandler<ListarCategoriasQuery, IEnumerable<CategoriaDto>>
{
    private readonly ILogger<ListarCategoriasQueryHandler> _logger;
    private readonly ICategoriaRepository _categoriaRepository;

    public ListarCategoriasQueryHandler(ICategoriaRepository categoriaRepository, ILogger<ListarCategoriasQueryHandler> logger)
    {
        _logger = logger;
        _categoriaRepository = categoriaRepository;
    }

    public async Task<IEnumerable<CategoriaDto>> Handle(ListarCategoriasQuery query, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Ejecutando ListarCategoriasQueryHandler...");
        var categorias = await _categoriaRepository.ObtenerTodasAsync(cancellationToken);
        
        return categorias.Select(c => new CategoriaDto(c.Id, c.Nombre, c.UrlIcono));
    }
}




