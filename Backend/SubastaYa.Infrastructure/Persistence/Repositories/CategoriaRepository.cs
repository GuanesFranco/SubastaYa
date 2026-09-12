using Microsoft.EntityFrameworkCore;
using SubastaYa.Application.Interfaces.Persistence;
using SubastaYa.Domain.Entities;

namespace SubastaYa.Infrastructure.Persistence.Repositories;

public class CategoriaRepository : ICategoriaRepository
{
    private readonly SubastaYaDbContext _context;

    public CategoriaRepository(SubastaYaDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Categoria>> ObtenerTodasAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Categorias
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }
}
