namespace SubastaYa.Application.Interfaces;

using SubastaYa.Domain.Entities;

public interface ICategoriaRepository
{
    Task<IEnumerable<Categoria>> ObtenerTodasAsync();
}
