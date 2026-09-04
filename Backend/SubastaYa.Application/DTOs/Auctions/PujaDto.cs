namespace SubastaYa.Application.DTOs.Auctions;

public record PujaDto(
    int Id,
    decimal Monto,
    DateTime Fecha,
    string CompradorNombre
);
