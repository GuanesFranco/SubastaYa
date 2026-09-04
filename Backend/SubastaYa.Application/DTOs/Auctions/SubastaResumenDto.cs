using SubastaYa.Domain.Enums;

namespace SubastaYa.Application.DTOs.Auctions;

public record SubastaResumenDto(
    int Id,
    string Titulo,
    string UrlImagen,
    decimal PrecioActual,
    DateTime FechaFin,
    SubastaYa.Domain.Enums.EstadoSubasta Estado,
    string CategoriaNombre,
    int CantidadPujas
);
