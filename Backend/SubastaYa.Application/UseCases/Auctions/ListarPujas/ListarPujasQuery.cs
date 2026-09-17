using SubastaYa.Application.Common;

namespace SubastaYa.Application.UseCases.Auctions.ListarPujas;

public record ListarPujasQuery(
    int SubastaId,
    int Page = 1,
    int PageSize = Paginacion.PageSizePorDefecto
);
