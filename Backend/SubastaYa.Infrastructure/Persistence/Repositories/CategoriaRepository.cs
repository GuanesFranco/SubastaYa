using Microsoft.EntityFrameworkCore;
using SubastaYa.Domain.Entities;
using SubastaYa.Application.Interfaces;

namespace SubastaYa.Infrastructure.Persistence.Repositories;

public class CategoriaRepository : ICategoriaRepository
{
    private readonly SubastaYaDbContext _context;

    public CategoriaRepository(SubastaYaDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Categoria>> ObtenerTodasAsync()
    {
        return await _context.Categorias
            .AsNoTracking()
            .ToListAsync();
    }
}
