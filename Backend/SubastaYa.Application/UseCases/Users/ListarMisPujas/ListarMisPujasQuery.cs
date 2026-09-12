using SubastaYa.Application.Common;

namespace SubastaYa.Application.UseCases.Users.ListarMisPujas;

public record ListarMisPujasQuery(
    int CompradorId,
    int Page = 1,
    int PageSize = Paginacion.PageSizePorDefecto
);
