using SubastaYa.Application.Common;

namespace SubastaYa.Application.DTOs.Common;

public record PaginacionDto(
    int Page = 1,
    int PageSize = Paginacion.PageSizePorDefecto
);
