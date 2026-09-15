using SubastaYa.Application.DTOs.Auctions;
using SubastaYa.Domain.Entities;
using SubastaYa.Domain.Enums;

namespace SubastaYa.Application.Interfaces.Persistence;

public interface ISubastaRepository
{
    Task AgregarAsync(Subasta subasta, CancellationToken cancellationToken = default);

    Task<bool> ExisteCategoriaAsync(int categoriaId, CancellationToken cancellationToken = default);

    Task<(IEnumerable<SubastaResumenDto> Items, int Total)> ObtenerFiltradasAsync(
        int? categoriaId, EstadoSubasta? estado, bool cerradas, string? busqueda,
        decimal? precioMin, decimal? precioMax,
        string? orderBy, int page, int pageSize, CancellationToken cancellationToken = default);

    Task<Subasta?> ObtenerDetalleAsync(int id, CancellationToken cancellationToken = default);

    Task<(IEnumerable<Puja> Items, int Total)> ObtenerPujasAsync(
        int subastaId, int page, int pageSize, CancellationToken cancellationToken = default);

    Task<(IEnumerable<SubastaResumenDto> Items, int Total)> ObtenerSubastasPorVendedorAsync(
        int vendedorId, int page, int pageSize, CancellationToken cancellationToken = default);

    Task<Subasta?> ObtenerParaPujarAsync(int id, CancellationToken cancellationToken = default);

    Task AgregarPujaAsync(Puja puja, CancellationToken cancellationToken = default);

    Task<(IEnumerable<MisPujasDto> Items, int Total)> ObtenerSubastasDondeParticipoAsync(
        int compradorId, int page, int pageSize, CancellationToken cancellationToken = default);

    Task<IEnumerable<int>> ObtenerIdsPendientesDeActivacionAsync(
        DateTime ahoraUtc, CancellationToken cancellationToken = default);

    Task<IEnumerable<int>> ObtenerIdsPendientesDeCierreAsync(
        DateTime ahoraUtc, CancellationToken cancellationToken = default);

    Task<Subasta?> ObtenerParaLiquidacionAsync(int id, CancellationToken cancellationToken = default);
}
