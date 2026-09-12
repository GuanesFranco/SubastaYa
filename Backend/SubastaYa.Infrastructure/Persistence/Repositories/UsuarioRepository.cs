using Microsoft.EntityFrameworkCore;
using SubastaYa.Application.Interfaces.Persistence;
using SubastaYa.Domain.Entities;

namespace SubastaYa.Infrastructure.Persistence.Repositories;

public class UsuarioRepository : IUsuarioRepository
{
    private readonly SubastaYaDbContext _ctx;

    public UsuarioRepository(SubastaYaDbContext ctx)
    {
        _ctx = ctx;
    }

    public async Task AgregarAsync(Usuario usuario, CancellationToken cancellationToken = default)
    {
        await _ctx.Usuarios.AddAsync(usuario, cancellationToken);
    }

    public async Task<Usuario?> ObtenerPorEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _ctx.Usuarios.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
    }
}
