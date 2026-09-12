using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SubastaYa.Api.Extensions;
using SubastaYa.Application.DTOs.Common;
using SubastaYa.Application.DTOs.Wallet;
using SubastaYa.Application.UseCases.Wallets.Deposit;
using SubastaYa.Application.UseCases.Wallets.GetWalletBalance;
using SubastaYa.Application.UseCases.Wallets.GetWalletTransactions;

namespace SubastaYa.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/wallets")]
[Produces("application/json")]
[ProducesErrorResponseType(typeof(ProblemDetails))]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
public class WalletsController : ControllerBase
{
    private readonly GetWalletBalanceQueryHandler _balanceHandler;
    private readonly DepositCommandHandler _depositHandler;
    private readonly GetWalletTransactionsQueryHandler _transactionsHandler;
    private readonly ILogger<WalletsController> _logger;

    public WalletsController(
        GetWalletBalanceQueryHandler balanceHandler,
        DepositCommandHandler depositHandler,
        GetWalletTransactionsQueryHandler transactionsHandler,
        ILogger<WalletsController> logger)
    {
        _balanceHandler = balanceHandler;
        _depositHandler = depositHandler;
        _transactionsHandler = transactionsHandler;
        _logger = logger;
    }

    [HttpGet("me")]
    [ProducesResponseType(typeof(WalletBalanceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObtenerBalance(CancellationToken cancellationToken)
    {
        var userId = User.ObtenerUsuarioId();
        _logger.LogInformation("Usuario {UserId} solicitó consultar su balance.", userId);

        var result = await _balanceHandler.Handle(new GetWalletBalanceQuery(userId), cancellationToken);
        return Ok(result);
    }

    [HttpPost("me/deposits")]
    [ProducesResponseType(typeof(WalletBalanceDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Depositar([FromBody] DepositoDto dto, CancellationToken cancellationToken)
    {
        var userId = User.ObtenerUsuarioId();
        _logger.LogInformation("Usuario {UserId} solicitó depositar {Monto}.", userId, dto.Monto);

        var result = await _depositHandler.Handle(new DepositCommand(userId, dto.Monto), cancellationToken);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpGet("me/transactions")]
    [ProducesResponseType(typeof(PaginatedResult<MovimientoDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerMovimientos([FromQuery] PaginacionDto paginacion, CancellationToken cancellationToken)
    {
        var userId = User.ObtenerUsuarioId();
        _logger.LogInformation("Usuario {UserId} solicitó su historial de transacciones.", userId);

        var query = new GetWalletTransactionsQuery(userId, paginacion.Page, paginacion.PageSize);
        var result = await _transactionsHandler.Handle(query, cancellationToken);
        return Ok(result);
    }
}
