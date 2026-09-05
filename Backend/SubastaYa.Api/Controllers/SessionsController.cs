using Microsoft.AspNetCore.Mvc;
using SubastaYa.Application.DTOs.Auth;
using SubastaYa.Application.UseCases.Users.Queries;

namespace SubastaYa.Api.Controllers;

[ApiController]
[Route("api/v1/sessions")]
[Produces("application/json")]
public class SessionsController : ControllerBase
{
    private readonly LoginQueryHandler _handler;

    public SessionsController(LoginQueryHandler handler)
    {
        _handler = handler;
    }

    [HttpPost]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var query = new LoginQuery(dto);
        var result = await _handler.Handle(query);
        return Ok(result);
    }
}
