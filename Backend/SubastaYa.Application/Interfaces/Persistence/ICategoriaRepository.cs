using SubastaYa.Domain.Entities;

namespace SubastaYa.Application.Interfaces.Persistence;

public interface ICategoriaRepository
{
    Task<IEnumerable<Categoria>> ObtenerTodasAsync(CancellationToken cancellationToken = default);
}
