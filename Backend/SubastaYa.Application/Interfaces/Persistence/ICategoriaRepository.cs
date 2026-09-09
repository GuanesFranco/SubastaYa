namespace SubastaYa.Application.Interfaces.Persistence;

using SubastaYa.Domain.Entities;

public interface ICategoriaRepository
{
    Task<IEnumerable<Categoria>> ObtenerTodasAsync();
}
