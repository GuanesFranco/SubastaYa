using SubastaYa.Application.DTOs.Wallet;
using SubastaYa.Application.Interfaces;
using SubastaYa.Domain.Entities;
using SubastaYa.Domain.Enums;

namespace SubastaYa.Application.UseCases.Wallets.Commands;

public class DepositCommandHandler
{
    private readonly IBilleteraRepository _billeteraRepository;
    private readonly IUnitOfWork _unitOfWork;

    public DepositCommandHandler(IBilleteraRepository billeteraRepository, IUnitOfWork unitOfWork)
    {
        _billeteraRepository = billeteraRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<WalletBalanceDto> Handle(DepositCommand command)
    {
        var billetera = await _billeteraRepository.ObtenerPorUsuarioIdAsync(command.UsuarioId);
        if (billetera == null)
        {
            throw new KeyNotFoundException("Billetera no encontrada.");
        }

        billetera.Depositar(command.Monto);

        var movimiento = new TransaccionLedger
        {
            BilleteraId = billetera.Id,
            Tipo = TipoTransaccionLedger.Deposito,
            Monto = command.Monto,
            Fecha = DateTime.UtcNow,
            Descripcion = "Carga de saldo simulada"
        };

        await _billeteraRepository.AgregarMovimientoAsync(movimiento);
        await _unitOfWork.SaveChangesAsync();

        return new WalletBalanceDto(billetera.SaldoTotal, billetera.SaldoRetenido, billetera.SaldoDisponible);
    }
}
