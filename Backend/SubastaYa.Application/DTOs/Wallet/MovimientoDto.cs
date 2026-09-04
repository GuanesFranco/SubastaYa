using SubastaYa.Domain.Enums;

namespace SubastaYa.Application.DTOs.Wallet;

public record MovimientoDto(
    int Id,
    TipoTransaccionLedger Tipo,
    decimal Monto,
    DateTime Fecha,
    string Descripcion,
    int? SubastaId
);
