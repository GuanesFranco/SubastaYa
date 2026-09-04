using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SubastaYa.Application.DTOs.Auctions;
using SubastaYa.Application.UseCases.Auctions.Commands;
using SubastaYa.Application.UseCases.Auctions.Queries;
using System.IdentityModel.Tokens.Jwt;

namespace SubastaYa.Api.Controllers;

[ApiController]
[Route("api/v1/auctions")]
public class SubastasController : ControllerBase
{
    private readonly CrearSubastaCommandHandler _crearSubastaHandler;
    private readonly ListarSubastasQueryHandler _listarSubastasHandler;
    private readonly ObtenerSubastaQueryHandler _obtenerSubastaHandler;
    private readonly ListarPujasQueryHandler _listarPujasHandler;

    public SubastasController(
        CrearSubastaCommandHandler crearSubastaHandler,
        ListarSubastasQueryHandler listarSubastasHandler,
        ObtenerSubastaQueryHandler obtenerSubastaHandler,
        ListarPujasQueryHandler listarPujasHandler)
    {
        _crearSubastaHandler = crearSubastaHandler;
        _listarSubastasHandler = listarSubastasHandler;
        _obtenerSubastaHandler = obtenerSubastaHandler;
        _listarPujasHandler = listarPujasHandler;
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CrearSubasta([FromBody] CrearSubastaDto dto)
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

    [HttpGet]
    public async Task<IActionResult> GetSubastas([FromQuery] ListarSubastasFiltroDto filtro)
    {
        var query = new ListarSubastasQuery(filtro);
        var result = await _listarSubastasHandler.Handle(query);
        return Ok(result);
    }

    [HttpGet("{id}/bids")]
    public async Task<IActionResult> GetPujas(int id)
    {
        var query = new ListarPujasQuery(id);
        var result = await _listarPujasHandler.Handle(query);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetSubasta(int id)
    {
        var query = new ObtenerSubastaQuery(id);
        var result = await _obtenerSubastaHandler.Handle(query);
        return Ok(result);
    }
}
