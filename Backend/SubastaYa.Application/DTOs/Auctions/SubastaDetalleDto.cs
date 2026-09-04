using SubastaYa.Domain.Enums;

namespace SubastaYa.Application.DTOs.Auctions;

public record SubastaDetalleDto(
    int Id,
    string Titulo,
    string Descripcion,
    string UrlImagen,
    decimal PrecioBase,
    decimal PrecioActual,
    DateTime FechaInicio,
    DateTime FechaFin,
    EstadoSubasta Estado,
    string CategoriaNombre,
    string VendedorNombre,
    int? PujaLiderId
);
