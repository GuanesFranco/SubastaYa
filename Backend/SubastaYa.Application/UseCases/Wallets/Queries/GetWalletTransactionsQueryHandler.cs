using SubastaYa.Application.Common.Time;
using SubastaYa.Application.DTOs.Wallet;
using SubastaYa.Application.Interfaces;

namespace SubastaYa.Application.UseCases.Wallets.Queries;

public class GetWalletTransactionsQueryHandler
{
    private readonly IBilleteraRepository _billeteraRepository;

    public GetWalletTransactionsQueryHandler(IBilleteraRepository billeteraRepository)
    {
        _billeteraRepository = billeteraRepository;
    }

    public async Task<List<MovimientoDto>> Handle(GetWalletTransactionsQuery query)
    {
        var movimientos = await _billeteraRepository.ObtenerMovimientosPorUsuarioIdAsync(query.UsuarioId);

        return movimientos
            .Select(m => new MovimientoDto(m.Id, m.Tipo, m.Monto, FechaArgentina.ALocal(m.Fecha), m.Descripcion, m.SubastaId))
            .ToList();
    }
}
