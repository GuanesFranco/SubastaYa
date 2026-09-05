using Microsoft.AspNetCore.Mvc;
using SubastaYa.Application.DTOs.Categories;
using SubastaYa.Application.UseCases.Categories.Queries;

namespace SubastaYa.Api.Controllers;

[ApiController]
[Route("api/v1/categories")]
[Produces("application/json")]
public class CategoriasController : ControllerBase
{
    private readonly ListarCategoriasQueryHandler _handler;

    public CategoriasController(ListarCategoriasQueryHandler handler)
    {
        _handler = handler;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<CategoriaDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCategorias()
    {
        var query = new ListarCategoriasQuery();
        var result = await _handler.Handle(query);
        return Ok(result);
    }
}
