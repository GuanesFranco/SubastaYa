using SubastaYa.Application.Common;

namespace SubastaYa.Application.UseCases.Wallets.GetWalletTransactions;

public record GetWalletTransactionsQuery(
    int UsuarioId,
    int Page = 1,
    int PageSize = Paginacion.PageSizePorDefecto
);
