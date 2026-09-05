using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SubastaYa.Api.Extensions;
using SubastaYa.Application.DTOs.Wallet;
using SubastaYa.Application.UseCases.Wallets.Commands;
using SubastaYa.Application.UseCases.Wallets.Queries;

namespace SubastaYa.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/wallets")]
public class WalletsController : ControllerBase
{
    private readonly GetWalletBalanceQueryHandler _balanceHandler;
    private readonly DepositCommandHandler _depositHandler;
    private readonly GetWalletTransactionsQueryHandler _transactionsHandler;

    public WalletsController(
        GetWalletBalanceQueryHandler balanceHandler,
        DepositCommandHandler depositHandler,
        GetWalletTransactionsQueryHandler transactionsHandler)
    {
        _balanceHandler = balanceHandler;
        _depositHandler = depositHandler;
        _transactionsHandler = transactionsHandler;
    }

    [HttpGet("me")]
    public async Task<IActionResult> ObtenerBalance()
    {
        var result = await _balanceHandler.Handle(new GetWalletBalanceQuery(User.ObtenerUsuarioId()));
        return Ok(result);
    }

    [HttpPost("me/deposits")]
    public async Task<IActionResult> Depositar([FromBody] DepositoDto dto)
    {
        var result = await _depositHandler.Handle(new DepositCommand(User.ObtenerUsuarioId(), dto.Monto));
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpGet("me/transactions")]
    public async Task<IActionResult> ObtenerMovimientos()
    {
        var result = await _transactionsHandler.Handle(new GetWalletTransactionsQuery(User.ObtenerUsuarioId()));
        return Ok(result);
    }
}
