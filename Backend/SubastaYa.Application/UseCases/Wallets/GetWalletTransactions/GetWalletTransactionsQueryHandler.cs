using Microsoft.Extensions.Logging;
using SubastaYa.Application.Common;
using SubastaYa.Application.Common.Time;
using SubastaYa.Application.DTOs.Common;
using SubastaYa.Application.DTOs.Wallet;
using SubastaYa.Application.Interfaces.Persistence;
using SubastaYa.Application.Interfaces.Services;

namespace SubastaYa.Application.UseCases.Wallets.GetWalletTransactions;

public class GetWalletTransactionsQueryHandler : IQueryHandler<GetWalletTransactionsQuery, PaginatedResult<MovimientoDto>>
{
    private readonly ILogger<GetWalletTransactionsQueryHandler> _logger;
    private readonly IBilleteraRepository _billeteraRepository;

    public GetWalletTransactionsQueryHandler(IBilleteraRepository billeteraRepository, ILogger<GetWalletTransactionsQueryHandler> logger)
    {
        _logger = logger;
        _billeteraRepository = billeteraRepository;
    }

    public async Task<PaginatedResult<MovimientoDto>> Handle(
        GetWalletTransactionsQuery query, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Ejecutando GetWalletTransactionsQueryHandler...");

        var (page, pageSize) = Paginacion.Normalizar(query.Page, query.PageSize);
        var (movimientos, total) = await _billeteraRepository.ObtenerMovimientosPorUsuarioIdAsync(
            query.UsuarioId, page, pageSize, cancellationToken);

        return new PaginatedResult<MovimientoDto>
        {
            Items = movimientos
                .Select(m => new MovimientoDto(m.Id, m.Tipo, m.Monto, FechaArgentina.ComoUtc(m.Fecha), m.Descripcion, m.SubastaId))
                .ToList(),
            TotalItems = total,
            Page = page,
            PageSize = pageSize
        };
    }
}
