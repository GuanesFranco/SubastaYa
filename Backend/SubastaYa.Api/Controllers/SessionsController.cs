using Microsoft.AspNetCore.Mvc;
using SubastaYa.Application.DTOs.Auth;
using SubastaYa.Application.UseCases.Users.Queries;

namespace SubastaYa.Api.Controllers;

[ApiController]
[Route("api/v1/sessions")]
public class SessionsController : ControllerBase
{
    private readonly LoginQueryHandler _handler;

    public SessionsController(LoginQueryHandler handler)
    {
        _handler = handler;
    }

    [HttpPost]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        try
        {
            var query = new LoginQuery(dto);
            var result = await _handler.Handle(query);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }
}
