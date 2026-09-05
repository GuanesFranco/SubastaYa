using SubastaYa.Domain.Enums;

namespace SubastaYa.Application.DTOs.Notifications;

public record SubastaCerradaDto(
    int SubastaId,
    EstadoSubasta Estado,
    int? GanadorUsuarioId,
    decimal? MontoFinal
);
