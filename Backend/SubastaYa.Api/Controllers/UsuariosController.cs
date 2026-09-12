using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SubastaYa.Api.Extensions;
using SubastaYa.Application.DTOs.Auctions;
using SubastaYa.Application.DTOs.Auth;
using SubastaYa.Application.DTOs.Common;
using SubastaYa.Application.UseCases.Auctions.ListarMisSubastas;
using SubastaYa.Application.UseCases.Users.ListarMisPujas;
using SubastaYa.Application.UseCases.Users.RegistrarUsuario;

namespace SubastaYa.Api.Controllers;

[ApiController]
[Route("api/v1/users")]
[Produces("application/json")]
[ProducesErrorResponseType(typeof(ProblemDetails))]
public class UsuariosController : ControllerBase
{
    private readonly RegistrarUsuarioCommandHandler _handler;
    private readonly ListarMisSubastasQueryHandler _listarMisSubastasHandler;
    private readonly ListarMisPujasQueryHandler _listarMisPujasHandler;
    private readonly ILogger<UsuariosController> _logger;

    public UsuariosController(
        RegistrarUsuarioCommandHandler handler,
        ListarMisSubastasQueryHandler listarMisSubastasHandler,
        ListarMisPujasQueryHandler listarMisPujasHandler,
        ILogger<UsuariosController> logger)
    {
        _handler = handler;
        _listarMisSubastasHandler = listarMisSubastasHandler;
        _listarMisPujasHandler = listarMisPujasHandler;
        _logger = logger;
    }

    [HttpPost]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegistrarUsuarioDto dto, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Intento de registro para un usuario nuevo.");

        var result = await _handler.Handle(new RegistrarUsuarioCommand(dto), cancellationToken);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpGet("me/auctions")]
    [Authorize]
    [ProducesResponseType(typeof(PaginatedResult<SubastaResumenDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMisSubastas([FromQuery] PaginacionDto paginacion, CancellationToken cancellationToken)
    {
        var userId = User.ObtenerUsuarioId();
        _logger.LogInformation("Usuario {UserId} consultando sus propias subastas publicadas.", userId);

        var query = new ListarMisSubastasQuery(userId, paginacion.Page, paginacion.PageSize);
        var result = await _listarMisSubastasHandler.Handle(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("me/bids")]
    [Authorize]
    [ProducesResponseType(typeof(PaginatedResult<MisPujasDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMisPujas([FromQuery] PaginacionDto paginacion, CancellationToken cancellationToken)
    {
        var userId = User.ObtenerUsuarioId();
        _logger.LogInformation("Usuario {UserId} consultando las subastas donde ha pujado.", userId);

        var query = new ListarMisPujasQuery(userId, paginacion.Page, paginacion.PageSize);
        var result = await _listarMisPujasHandler.Handle(query, cancellationToken);
        return Ok(result);
    }
}
