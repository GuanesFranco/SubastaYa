using System.ComponentModel.DataAnnotations;

namespace SubastaYa.Application.DTOs.Auctions;

public record CrearSubastaDto(
    [Required] int CategoriaId,
    [Required] [MaxLength(100)] string Titulo,
    [Required] [MaxLength(1000)] string Descripcion,
    string UrlImagen,
    [Required] [Range(0.01, double.MaxValue, ErrorMessage = "El precio base debe ser mayor a 0.")] decimal PrecioBase,
    [Required] [Range(0.01, double.MaxValue, ErrorMessage = "El incremento mínimo debe ser mayor a 0.")] decimal IncrementoMinimo,
    [Required] DateTime FechaInicio,
    [Required] DateTime FechaFin
);
