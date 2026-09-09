using Microsoft.AspNetCore.Mvc;
using SubastaYa.Application.DTOs.Categories;
using SubastaYa.Application.UseCases.Categories.ListarCategorias;

namespace SubastaYa.Api.Controllers;

[ApiController]
[Route("api/v1/categories")]
[Produces("application/json")]
public class CategoriasController : ControllerBase
{
    private readonly ListarCategoriasQueryHandler _handler;
    private readonly ILogger<CategoriasController> _logger;

    public CategoriasController(ListarCategoriasQueryHandler handler, ILogger<CategoriasController> logger)
    {
        _handler = handler;
        _logger = logger;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<CategoriaDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCategorias()
    {
        _logger.LogInformation("Consultando la lista completa de categorías.");
        var query = new ListarCategoriasQuery();
        var result = await _handler.Handle(query);
        return Ok(result);
    }
}

