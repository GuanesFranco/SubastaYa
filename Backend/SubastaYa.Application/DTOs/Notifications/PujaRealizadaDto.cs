namespace SubastaYa.Application.DTOs.Notifications;

public record PujaRealizadaDto(
    int SubastaId,
    int PujaId,
    decimal Monto,
    DateTime FechaPuja,
    DateTime FechaFin
);
