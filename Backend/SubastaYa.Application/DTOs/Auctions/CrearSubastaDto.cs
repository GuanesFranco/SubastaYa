using System.ComponentModel.DataAnnotations;

namespace SubastaYa.Application.DTOs.Auctions;

public record CrearSubastaDto(
    [Required(ErrorMessage = "Elegí una categoría.")] int CategoriaId,
    [Required(ErrorMessage = "El título es obligatorio.")] [MaxLength(100, ErrorMessage = "El título no puede pasar los 100 caracteres.")] string Titulo,
    [Required(ErrorMessage = "La descripción es obligatoria.")] [MaxLength(1000, ErrorMessage = "La descripción no puede pasar los 1000 caracteres.")] string Descripcion,
    [Required(ErrorMessage = "La URL de la imagen es obligatoria.")] string UrlImagen,
    [Required(ErrorMessage = "El precio base es obligatorio.")] [Range(0.01, double.MaxValue, ErrorMessage = "El precio base debe ser mayor a 0.")] decimal PrecioBase,
    [Required(ErrorMessage = "El incremento mínimo es obligatorio.")] [Range(0.01, double.MaxValue, ErrorMessage = "El incremento mínimo debe ser mayor a 0.")] decimal IncrementoMinimo,
    [Required(ErrorMessage = "Indicá cuándo empieza.")] DateTime FechaInicio,
    [Required(ErrorMessage = "Indicá cuándo termina.")] DateTime FechaFin
);
