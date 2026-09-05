using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SubastaYa.Api.Extensions;
using SubastaYa.Application.DTOs.Auctions;
using SubastaYa.Application.DTOs.Common;
using SubastaYa.Application.UseCases.Auctions.Commands;
using SubastaYa.Application.UseCases.Auctions.Queries;

namespace SubastaYa.Api.Controllers;

[ApiController]
[Route("api/v1/auctions")]
[Produces("application/json")]
public class SubastasController : ControllerBase
{
    private readonly CrearSubastaCommandHandler _crearSubastaHandler;
    private readonly ListarSubastasQueryHandler _listarSubastasHandler;
    private readonly ObtenerSubastaQueryHandler _obtenerSubastaHandler;
    private readonly ListarPujasQueryHandler _listarPujasHandler;
    private readonly RealizarPujaCommandHandler _realizarPujaHandler;

    public SubastasController(
        CrearSubastaCommandHandler crearSubastaHandler,
        ListarSubastasQueryHandler listarSubastasHandler,
        ObtenerSubastaQueryHandler obtenerSubastaHandler,
        ListarPujasQueryHandler listarPujasHandler,
        RealizarPujaCommandHandler realizarPujaHandler)
    {
        _crearSubastaHandler = crearSubastaHandler;
        _listarSubastasHandler = listarSubastasHandler;
        _obtenerSubastaHandler = obtenerSubastaHandler;
        _listarPujasHandler = listarPujasHandler;
        _realizarPujaHandler = realizarPujaHandler;
    }

    [HttpPost]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CrearSubasta([FromBody] CrearSubastaDto dto)
    {
        var command = new CrearSubastaCommand(User.ObtenerUsuarioId(), dto);
        var subastaId = await _crearSubastaHandler.Handle(command);

        return CreatedAtAction(nameof(GetSubasta), new { id = subastaId }, new { id = subastaId });
    }

    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResult<SubastaResumenDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSubastas([FromQuery] ListarSubastasFiltroDto filtro)
    {
        var query = new ListarSubastasQuery(filtro);
        var result = await _listarSubastasHandler.Handle(query);
        return Ok(result);
    }

    [HttpGet("{id}/bids")]
    [ProducesResponseType(typeof(IEnumerable<PujaDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPujas(int id)
    {
        var query = new ListarPujasQuery(id);
        var result = await _listarPujasHandler.Handle(query);
        return Ok(result);
    }

    [HttpPost("{id}/bids")]
    [Authorize]
    [ProducesResponseType(typeof(PujaResultadoDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Pujar(int id, [FromBody] PujaRequestDto dto)
    {
        var command = new RealizarPujaCommand(id, User.ObtenerUsuarioId(), dto.Monto);
        var result = await _realizarPujaHandler.Handle(command);

        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(SubastaDetalleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSubasta(int id)
    {
        var query = new ObtenerSubastaQuery(id);
        var result = await _obtenerSubastaHandler.Handle(query);
        return Ok(result);
    }
}
