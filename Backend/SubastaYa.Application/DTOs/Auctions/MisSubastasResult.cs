using SubastaYa.Application.DTOs.Common;

namespace SubastaYa.Application.DTOs.Auctions;

public class MisSubastasResult : PaginatedResult<SubastaResumenDto>
{
    public MetricasVendedorDto Metricas { get; set; } = new(0, 0, 0m, 0);
}
