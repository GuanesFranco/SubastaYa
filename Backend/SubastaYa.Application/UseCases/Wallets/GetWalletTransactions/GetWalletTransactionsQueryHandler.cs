using Microsoft.Extensions.Logging;
using SubastaYa.Application.Common.Time;
using SubastaYa.Application.DTOs.Wallet;
using SubastaYa.Application.Interfaces.Persistence;
using SubastaYa.Application.Interfaces.Services;

namespace SubastaYa.Application.UseCases.Wallets.GetWalletTransactions;

public class GetWalletTransactionsQueryHandler
{
    private readonly ILogger<GetWalletTransactionsQueryHandler> _logger;
    private readonly IBilleteraRepository _billeteraRepository;

    public GetWalletTransactionsQueryHandler(IBilleteraRepository billeteraRepository, ILogger<GetWalletTransactionsQueryHandler> logger)
    {
        _logger = logger;
        _billeteraRepository = billeteraRepository;
    }

    public async Task<List<MovimientoDto>> Handle(GetWalletTransactionsQuery query)
    {
        _logger.LogInformation("Ejecutando GetWalletTransactionsQueryHandler...");
        var movimientos = await _billeteraRepository.ObtenerMovimientosPorUsuarioIdAsync(query.UsuarioId);

        return movimientos
            .Select(m => new MovimientoDto(m.Id, m.Tipo, m.Monto, FechaArgentina.ComoUtc(m.Fecha), m.Descripcion, m.SubastaId))
            .ToList();
    }
}




