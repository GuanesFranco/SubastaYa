using Microsoft.EntityFrameworkCore;
using SubastaYa.Domain.Entities;
using SubastaYa.Domain.Interfaces;

namespace SubastaYa.Infrastructure.Data.Repositories;

public class SubastaRepository : ISubastaRepository
{
    private readonly SubastaYaDbContext _context;

    public SubastaRepository(SubastaYaDbContext context)
    {
        _context = context;
    }

    public async Task AgregarAsync(Subasta subasta)
    {
        await _context.Subastas.AddAsync(subasta);
    }

    public async Task<bool> ExisteCategoriaAsync(int categoriaId)
    {
        return await _context.Categorias.AnyAsync(c => c.Id == categoriaId);
    }
}
