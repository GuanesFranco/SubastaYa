using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SubastaYa.Application.DTOs.Auctions;
using SubastaYa.Application.UseCases.Auctions.Commands;
using System.IdentityModel.Tokens.Jwt;

namespace SubastaYa.Api.Controllers;

[ApiController]
[Route("api/v1/auctions")]
public class SubastasController : ControllerBase
{
    private readonly CrearSubastaCommandHandler _crearSubastaHandler;

    public SubastasController(CrearSubastaCommandHandler crearSubastaHandler)
    {
        _crearSubastaHandler = crearSubastaHandler;
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CrearSubasta([FromBody] CrearSubastaDto dto)
    {
        try
        {
            // Extraer el VendedorId del token JWT (usamos Sub porque ahí guardamos el ID)
            var userIdClaim = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int vendedorId))
            {
                return Unauthorized(new { error = "Token inválido o ID de usuario no encontrado en el token." });
            }

            var command = new CrearSubastaCommand(vendedorId, dto);
            var subastaId = await _crearSubastaHandler.Handle(command);
            
            return CreatedAtAction(nameof(CrearSubasta), new { id = subastaId }, new { id = subastaId });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
