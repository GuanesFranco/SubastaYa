using SubastaYa.Domain.Enums;

namespace SubastaYa.Application.DTOs.Auctions;

public record SubastaDetalleDto(
    int Id,
    string Titulo,
    string Descripcion,
    string UrlImagen,
    decimal PrecioBase,
    decimal PrecioActual,
    decimal IncrementoMinimo,
    DateTime FechaInicio,
    DateTime FechaFin,
    EstadoSubasta Estado,
    string CategoriaNombre,
    int VendedorId,
    string VendedorNombre,
    int? PujaLiderId,
    int? CompradorLiderId
);
