using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SubastaYa.Api.Extensions;
using SubastaYa.Application.DTOs.Auctions;
using SubastaYa.Application.DTOs.Auth;
using SubastaYa.Application.UseCases.Auctions.ListarSubastas;
using SubastaYa.Application.UseCases.Auctions.ObtenerSubasta;
using SubastaYa.Application.UseCases.Auctions.ListarPujas;
using SubastaYa.Application.UseCases.Users.ListarMisPujas;
using SubastaYa.Application.UseCases.Auctions.ListarMisSubastas;
using SubastaYa.Application.UseCases.Users.RegistrarUsuario;

namespace SubastaYa.Api.Controllers;

[ApiController]
[Route("api/v1/users")]
[Produces("application/json")]
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
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegistrarUsuarioDto dto)
    {
        _logger.LogInformation("Intento de registro para usuario: {Email}", dto.Email);
        var command = new RegistrarUsuarioCommand(dto);
        var result = await _handler.Handle(command);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpGet("me/auctions")]
    [Authorize]
    [ProducesResponseType(typeof(IEnumerable<SubastaResumenDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMisSubastas()
    {
        var userId = User.ObtenerUsuarioId();
        _logger.LogInformation("Usuario {UserId} consultando sus propias subastas publicadas.", userId);
        
        var query = new ListarMisSubastasQuery(userId);
        var result = await _listarMisSubastasHandler.Handle(query);
        return Ok(result);
    }

    [HttpGet("me/bids")]
    [Authorize]
    [ProducesResponseType(typeof(IEnumerable<MisPujasDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMisPujas()
    {
        var userId = User.ObtenerUsuarioId();
        _logger.LogInformation("Usuario {UserId} consultando las subastas donde ha pujado.", userId);
        
        var query = new ListarMisPujasQuery(userId);
        var result = await _listarMisPujasHandler.Handle(query);
        return Ok(result);
    }
}


