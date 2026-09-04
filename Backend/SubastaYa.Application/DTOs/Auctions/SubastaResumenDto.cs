using SubastaYa.Domain.Enums;

namespace SubastaYa.Application.DTOs.Auctions;

public record SubastaResumenDto(
    int Id,
    string Titulo,
    string UrlImagen,
    decimal PrecioActual,
    DateTime FechaFin,
    EstadoSubasta Estado
);
