using Microsoft.AspNetCore.Mvc;
using SubastaYa.Application.DTOs.Auth;
using SubastaYa.Application.UseCases.Users.Login;

namespace SubastaYa.Api.Controllers;

[ApiController]
[Route("api/v1/sessions")]
[Produces("application/json")]
[ProducesErrorResponseType(typeof(ProblemDetails))]
public class SessionsController : ControllerBase
{
    private readonly LoginQueryHandler _handler;
    private readonly ILogger<SessionsController> _logger;

    public SessionsController(LoginQueryHandler handler, ILogger<SessionsController> logger)
    {
        _handler = handler;
        _logger = logger;
    }

    [HttpPost]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginDto dto, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Intento de login recibido.");

        var result = await _handler.Handle(new LoginQuery(dto), cancellationToken);
        return Ok(result);
    }
}
