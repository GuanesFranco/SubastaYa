using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SubastaYa.Api.Extensions;
using SubastaYa.Application.DTOs.Auctions;
using SubastaYa.Application.DTOs.Common;
using SubastaYa.Application.UseCases.Auctions.CrearSubasta;
using SubastaYa.Application.UseCases.Auctions.ListarPujas;
using SubastaYa.Application.UseCases.Auctions.ListarSubastas;
using SubastaYa.Application.UseCases.Auctions.ObtenerSubasta;
using SubastaYa.Application.UseCases.Auctions.RealizarPuja;

namespace SubastaYa.Api.Controllers;

[ApiController]
[Route("api/v1/auctions")]
[Produces("application/json")]
[ProducesErrorResponseType(typeof(ProblemDetails))]
public class SubastasController : ControllerBase
{
    private readonly CrearSubastaCommandHandler _crearSubastaHandler;
    private readonly ListarSubastasQueryHandler _listarSubastasHandler;
    private readonly ObtenerSubastaQueryHandler _obtenerSubastaHandler;
    private readonly ListarPujasQueryHandler _listarPujasHandler;
    private readonly RealizarPujaCommandHandler _realizarPujaHandler;
    private readonly ILogger<SubastasController> _logger;

    public SubastasController(
        CrearSubastaCommandHandler crearSubastaHandler,
        ListarSubastasQueryHandler listarSubastasHandler,
        ObtenerSubastaQueryHandler obtenerSubastaHandler,
        ListarPujasQueryHandler listarPujasHandler,
        RealizarPujaCommandHandler realizarPujaHandler,
        ILogger<SubastasController> logger)
    {
        _crearSubastaHandler = crearSubastaHandler;
        _listarSubastasHandler = listarSubastasHandler;
        _obtenerSubastaHandler = obtenerSubastaHandler;
        _listarPujasHandler = listarPujasHandler;
        _realizarPujaHandler = realizarPujaHandler;
        _logger = logger;
    }

    [HttpPost]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CrearSubasta([FromBody] CrearSubastaDto dto, CancellationToken cancellationToken)
    {
        var userId = User.ObtenerUsuarioId();
        _logger.LogInformation("Usuario {UserId} creando subasta: {Titulo}", userId, dto.Titulo);

        var command = new CrearSubastaCommand(userId, dto);
        var subastaId = await _crearSubastaHandler.Handle(command, cancellationToken);

        return CreatedAtAction(nameof(GetSubasta), new { id = subastaId }, new { id = subastaId });
    }

    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResult<SubastaResumenDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSubastas([FromQuery] ListarSubastasFiltroDto filtro, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Consultando lista de subastas. Estado: {Estado}", filtro.Estado?.ToString() ?? "Todos");

        var result = await _listarSubastasHandler.Handle(new ListarSubastasQuery(filtro), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id}/bids")]
    [ProducesResponseType(typeof(PaginatedResult<PujaDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPujas(int id, [FromQuery] PaginacionDto paginacion, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Consultando historial de pujas para la subasta {SubastaId}.", id);

        var query = new ListarPujasQuery(id, paginacion.Page, paginacion.PageSize);
        var result = await _listarPujasHandler.Handle(query, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id}/bids")]
    [Authorize]
    [ProducesResponseType(typeof(PujaResultadoDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Pujar(int id, [FromBody] PujaRequestDto dto, CancellationToken cancellationToken)
    {
        var userId = User.ObtenerUsuarioId();
        _logger.LogInformation("Usuario {UserId} enviando puja por {Monto} a la subasta {SubastaId}.", userId, dto.Monto, id);

        var command = new RealizarPujaCommand(id, userId, dto.Monto);
        var result = await _realizarPujaHandler.Handle(command, cancellationToken);

        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(SubastaDetalleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSubasta(int id, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Consultando detalle de la subasta {SubastaId}.", id);

        var result = await _obtenerSubastaHandler.Handle(
            new ObtenerSubastaQuery(id, User.ObtenerUsuarioIdOpcional()), cancellationToken);
        return Ok(result);
    }
}
