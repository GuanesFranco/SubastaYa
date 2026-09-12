using Microsoft.Extensions.Logging;
using SubastaYa.Application.Common.Time;
using SubastaYa.Application.DTOs.Wallet;
using SubastaYa.Application.Interfaces.Persistence;
using SubastaYa.Application.Interfaces.Services;
using SubastaYa.Domain.Entities;
using SubastaYa.Domain.Enums;

namespace SubastaYa.Application.UseCases.Wallets.Deposit;

public class DepositCommandHandler : ICommandHandler<DepositCommand, WalletBalanceDto>
{
    private readonly ILogger<DepositCommandHandler> _logger;
    private readonly IBilleteraRepository _billeteraRepository;
    private readonly IUnitOfWork _unitOfWork;

    public DepositCommandHandler(IBilleteraRepository billeteraRepository, IUnitOfWork unitOfWork, ILogger<DepositCommandHandler> logger)
    {
        _logger = logger;
        _billeteraRepository = billeteraRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<WalletBalanceDto> Handle(DepositCommand command, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Ejecutando DepositCommandHandler...");
        var billetera = await _billeteraRepository.ObtenerPorUsuarioIdAsync(command.UsuarioId, cancellationToken);
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
            Fecha = FechaArgentina.AhoraUtc,
            Descripcion = "Carga de saldo simulada"
        };

        await _billeteraRepository.AgregarMovimientoAsync(movimiento, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new WalletBalanceDto(billetera.SaldoTotal, billetera.SaldoRetenido, billetera.SaldoDisponible);
    }
}



