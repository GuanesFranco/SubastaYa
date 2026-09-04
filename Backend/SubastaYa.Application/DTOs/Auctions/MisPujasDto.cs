using SubastaYa.Domain.Enums;

namespace SubastaYa.Application.DTOs.Auctions;

public record MisPujasDto(
    int SubastaId,
    string Titulo,
    string UrlImagen,
    decimal PrecioActual,
    EstadoSubasta Estado,
    bool EsGanador
);
