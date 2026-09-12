using Microsoft.Extensions.Logging;
using SubastaYa.Application.DTOs.Wallet;
using SubastaYa.Application.Interfaces.Persistence;
using SubastaYa.Application.Interfaces.Services;

namespace SubastaYa.Application.UseCases.Wallets.GetWalletBalance;

public class GetWalletBalanceQueryHandler : IQueryHandler<GetWalletBalanceQuery, WalletBalanceDto>
{
    private readonly ILogger<GetWalletBalanceQueryHandler> _logger;
    private readonly IBilleteraRepository _billeteraRepository;

    public GetWalletBalanceQueryHandler(IBilleteraRepository billeteraRepository, ILogger<GetWalletBalanceQueryHandler> logger)
    {
        _logger = logger;
        _billeteraRepository = billeteraRepository;
    }

    public async Task<WalletBalanceDto> Handle(GetWalletBalanceQuery query, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Ejecutando GetWalletBalanceQueryHandler...");
        var billetera = await _billeteraRepository.ObtenerPorUsuarioIdAsync(query.UsuarioId, cancellationToken);
        if (billetera == null)
        {
            throw new KeyNotFoundException("Billetera no encontrada.");
        }

        return new WalletBalanceDto(billetera.SaldoTotal, billetera.SaldoRetenido, billetera.SaldoDisponible);
    }
}



