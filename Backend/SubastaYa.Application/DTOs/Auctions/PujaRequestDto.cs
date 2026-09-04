using System.ComponentModel.DataAnnotations;

namespace SubastaYa.Application.DTOs.Auctions;

public record PujaRequestDto(
    [Required] decimal Monto
);
