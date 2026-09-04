using Microsoft.AspNetCore.Mvc;
using SubastaYa.Application.DTOs.Auth;
using SubastaYa.Application.UseCases.Users.Commands;
using SubastaYa.Application.UseCases.Auctions.Queries;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace SubastaYa.Api.Controllers;

[ApiController]
[Route("api/v1/users")]
public class UsuariosController : ControllerBase
{
    private readonly RegistrarUsuarioCommandHandler _handler;
    private readonly ListarMisSubastasQueryHandler _listarMisSubastasHandler;

    public UsuariosController(RegistrarUsuarioCommandHandler handler, ListarMisSubastasQueryHandler listarMisSubastasHandler)
    {
        _handler = handler;
        _listarMisSubastasHandler = listarMisSubastasHandler;
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
        var userIdClaim = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int vendedorId))
        {
            return Unauthorized(new { error = "Token inválido o ID de usuario no encontrado en el token." });
        }

        var query = new ListarMisSubastasQuery(vendedorId);
        var result = await _listarMisSubastasHandler.Handle(query);
        return Ok(result);
    }
}
