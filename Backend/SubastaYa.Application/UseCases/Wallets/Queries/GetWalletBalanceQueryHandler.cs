using SubastaYa.Application.DTOs.Wallet;
using SubastaYa.Application.Interfaces;

namespace SubastaYa.Application.UseCases.Wallets.Queries;

public class GetWalletBalanceQueryHandler
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
