using Microsoft.EntityFrameworkCore;
using SubastaYa.Application.Interfaces;
using SubastaYa.Domain.Entities;
using SubastaYa.Infrastructure.Data;

namespace SubastaYa.Infrastructure.Persistence.Repositories;

public class UsuarioRepository : IUsuarioRepository
{
    private readonly SubastaYaDbContext _ctx;

    public UsuarioRepository(SubastaYaDbContext ctx)
    {
        _ctx = ctx;
    }

    public async Task AgregarAsync(Usuario usuario)
    {
        await _ctx.Usuarios.AddAsync(usuario);
    }

    public async Task<Usuario?> ObtenerPorEmailAsync(string email)
    {
        return await _ctx.Usuarios.FirstOrDefaultAsync(u => u.Email == email);
    }
}
