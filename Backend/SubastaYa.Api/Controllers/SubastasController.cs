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
    private readonly RealizarPujaCommandHandler _realizarPujaHandler;

    public SubastasController(
        CrearSubastaCommandHandler crearSubastaHandler,
        ListarSubastasQueryHandler listarSubastasHandler,
        ObtenerSubastaQueryHandler obtenerSubastaHandler,
        ListarPujasQueryHandler listarPujasHandler,
        RealizarPujaCommandHandler realizarPujaHandler)
    {
        _crearSubastaHandler = crearSubastaHandler;
        _listarSubastasHandler = listarSubastasHandler;
        _obtenerSubastaHandler = obtenerSubastaHandler;
        _listarPujasHandler = listarPujasHandler;
        _realizarPujaHandler = realizarPujaHandler;
    }

    private int? UsuarioIdActual
    {
        get
        {
            var claim = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(claim, out var id) ? id : null;
        }
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CrearSubasta([FromBody] CrearSubastaDto dto)
    {
        var vendedorId = UsuarioIdActual;
        if (vendedorId == null)
        {
            return Unauthorized(new { error = "Token inválido o ID de usuario no encontrado en el token." });
        }

        var command = new CrearSubastaCommand(vendedorId.Value, dto);
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

    [HttpPost("{id}/bids")]
    [Authorize]
    public async Task<IActionResult> Pujar(int id, [FromBody] PujaRequestDto dto)
    {
        var compradorId = UsuarioIdActual;
        if (compradorId == null)
        {
            return Unauthorized(new { error = "Token inválido o ID de usuario no encontrado en el token." });
        }

        var command = new RealizarPujaCommand(id, compradorId.Value, dto.Monto);
        var result = await _realizarPujaHandler.Handle(command);

        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetSubasta(int id)
    {
        var query = new ObtenerSubastaQuery(id);
        var result = await _obtenerSubastaHandler.Handle(query);
        return Ok(result);
    }
}
