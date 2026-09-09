namespace SubastaYa.Application.Interfaces.Persistence;

using SubastaYa.Domain.Entities;

public interface IUsuarioRepository
{
    Task<Usuario?> ObtenerPorEmailAsync(string email);
    Task AgregarAsync(Usuario usuario);
}
