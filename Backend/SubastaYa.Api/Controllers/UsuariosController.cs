using Microsoft.AspNetCore.Mvc;
using SubastaYa.Application.DTOs.Auth;
using SubastaYa.Application.UseCases.Users.Commands;

namespace SubastaYa.Api.Controllers;

[ApiController]
[Route("api/v1/users")]
public class UsuariosController : ControllerBase
{
    private readonly RegistrarUsuarioCommandHandler _handler;

    public UsuariosController(RegistrarUsuarioCommandHandler handler)
    {
        _handler = handler;
    }

    [HttpPost]
    public async Task<IActionResult> Register([FromBody] RegistrarUsuarioDto dto)
    {
        try
        {
            var command = new RegistrarUsuarioCommand(dto);
            var result = await _handler.Handle(command);
            return StatusCode(201, result); // 201 Created
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
