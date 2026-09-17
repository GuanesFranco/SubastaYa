namespace SubastaYa.Application.DTOs.Auctions;

public record MetricasVendedorDto(
    int TotalPublicadas,
    int Vendidas,
    decimal RecaudacionTotal,
    int EnCurso
);
