using SubastaYa.Domain.Entities;

namespace SubastaYa.Application.Interfaces.Persistence;

public interface IBilleteraRepository
{
    Task<Billetera?> ObtenerPorUsuarioIdAsync(int usuarioId, CancellationToken cancellationToken = default);

    Task AgregarMovimientoAsync(TransaccionLedger movimiento, CancellationToken cancellationToken = default);

    Task<(IEnumerable<TransaccionLedger> Items, int Total)> ObtenerMovimientosPorUsuarioIdAsync(
        int usuarioId, int page, int pageSize, CancellationToken cancellationToken = default);
}
