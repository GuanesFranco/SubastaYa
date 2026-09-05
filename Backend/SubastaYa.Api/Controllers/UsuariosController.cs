using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SubastaYa.Api.Extensions;
using SubastaYa.Application.DTOs.Auth;
using SubastaYa.Application.UseCases.Auctions.Queries;
using SubastaYa.Application.UseCases.Users.Commands;

namespace SubastaYa.Api.Controllers;

[ApiController]
[Route("api/v1/users")]
public class UsuariosController : ControllerBase
{
    private readonly RegistrarUsuarioCommandHandler _handler;
    private readonly ListarMisSubastasQueryHandler _listarMisSubastasHandler;
    private readonly ListarMisPujasQueryHandler _listarMisPujasHandler;

    public UsuariosController(
        RegistrarUsuarioCommandHandler handler,
        ListarMisSubastasQueryHandler listarMisSubastasHandler,
        ListarMisPujasQueryHandler listarMisPujasHandler)
    {
        _handler = handler;
        _listarMisSubastasHandler = listarMisSubastasHandler;
        _listarMisPujasHandler = listarMisPujasHandler;
    }

    [HttpPost]
    public async Task<IActionResult> Register([FromBody] RegistrarUsuarioDto dto)
    {
        var command = new RegistrarUsuarioCommand(dto);
        var result = await _handler.Handle(command);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpGet("me/auctions")]
    [Authorize]
    public async Task<IActionResult> GetMisSubastas()
    {
        var query = new ListarMisSubastasQuery(User.ObtenerUsuarioId());
        var result = await _listarMisSubastasHandler.Handle(query);
        return Ok(result);
    }

    [HttpGet("me/bids")]
    [Authorize]
    public async Task<IActionResult> GetMisPujas()
    {
        var query = new ListarMisPujasQuery(User.ObtenerUsuarioId());
        var result = await _listarMisPujasHandler.Handle(query);
        return Ok(result);
    }
}
