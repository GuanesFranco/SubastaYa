namespace SubastaYa.Application.DTOs.Auctions;

public record PujaResultadoDto(
    int PujaId,
    decimal Monto,
    DateTime FechaFin,
    bool TiempoExtendido
);
