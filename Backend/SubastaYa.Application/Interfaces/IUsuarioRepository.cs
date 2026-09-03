namespace SubastaYa.Application.Interfaces;

using SubastaYa.Domain.Entities;

public interface IUsuarioRepository
{
    Task<Usuario?> ObtenerPorEmailAsync(string email);
    Task AgregarAsync(Usuario usuario);
}
