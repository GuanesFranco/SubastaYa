using SubastaYa.Application.Common;

namespace SubastaYa.Application.UseCases.Auctions.ListarMisSubastas;

public record ListarMisSubastasQuery(
    int VendedorId,
    int Page = 1,
    int PageSize = Paginacion.PageSizePorDefecto
);
