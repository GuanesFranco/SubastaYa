using SubastaYa.Domain.Entities;

namespace SubastaYa.Application.Interfaces;

public interface IBilleteraRepository
{
    Task<Billetera?> ObtenerPorUsuarioIdAsync(int usuarioId);
    Task AgregarMovimientoAsync(TransaccionLedger movimiento);
    Task<List<TransaccionLedger>> ObtenerMovimientosPorUsuarioIdAsync(int usuarioId);
}
