namespace SubastaYa.Domain.Interfaces;

using SubastaYa.Domain.Entities;

public interface ISubastaRepository
{
    Task AgregarAsync(Subasta subasta);
    Task<bool> ExisteCategoriaAsync(int categoriaId);
}
