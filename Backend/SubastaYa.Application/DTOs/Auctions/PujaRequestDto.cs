using System.ComponentModel.DataAnnotations;

namespace SubastaYa.Application.DTOs.Auctions;

public record PujaRequestDto(
    [Required(ErrorMessage = "El monto es obligatorio.")] [Range(0.01, double.MaxValue, ErrorMessage = "El monto debe ser mayor a 0.")] decimal Monto
);
