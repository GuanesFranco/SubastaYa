using SubastaYa.Application.DTOs.Wallet;
using SubastaYa.Application.Interfaces.Persistence;
using SubastaYa.Application.Interfaces.Services;

namespace SubastaYa.Application.UseCases.Wallets.GetWalletBalance;

public class GetWalletBalanceQueryHandler : IQueryHandler<GetWalletBalanceQuery, WalletBalanceDto>
{
    private readonly IBilleteraRepository _billeteraRepository;

    public GetWalletBalanceQueryHandler(IBilleteraRepository billeteraRepository)
    {
        _billeteraRepository = billeteraRepository;
    }

    public async Task<WalletBalanceDto> Handle(GetWalletBalanceQuery query)
    {
        var billetera = await _billeteraRepository.ObtenerPorUsuarioIdAsync(query.UsuarioId);
        if (billetera == null)
        {
            throw new KeyNotFoundException("Billetera no encontrada.");
        }

        return new WalletBalanceDto(billetera.SaldoTotal, billetera.SaldoRetenido, billetera.SaldoDisponible);
    }
}


