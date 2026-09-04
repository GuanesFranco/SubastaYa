using SubastaYa.Domain.Enums;

namespace SubastaYa.Application.DTOs.Auctions;

public record ListarSubastasFiltroDto(
    int? CategoriaId = null,
    EstadoSubasta? Estado = null,
    decimal? PrecioMin = null,
    decimal? PrecioMax = null,
    string? OrderBy = null,
    int Page = 1,
    int PageSize = 10
);
