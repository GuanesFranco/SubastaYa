using SubastaYa.Domain.Entities;
using SubastaYa.Domain.Enums;

namespace SubastaYa.Application.Interfaces;

public interface ISubastaRepository
{
    Task AgregarAsync(Subasta subasta);
    Task<bool> ExisteCategoriaAsync(int categoriaId);
    Task<(IEnumerable<Subasta> Items, int Total)> ObtenerFiltradasAsync(
        int? categoriaId, EstadoSubasta? estado, decimal? precioMin, decimal? precioMax, string? orderBy, int page, int pageSize);
    Task<Subasta?> ObtenerDetalleAsync(int id);
    Task<IEnumerable<Puja>> ObtenerPujasAsync(int subastaId);
    Task<IEnumerable<Subasta>> ObtenerSubastasPorVendedorAsync(int vendedorId);
    Task<Subasta?> ObtenerParaPujarAsync(int id);
    Task AgregarPujaAsync(Puja puja);
    Task<IEnumerable<Subasta>> ObtenerSubastasDondeParticipoAsync(int compradorId);
}
