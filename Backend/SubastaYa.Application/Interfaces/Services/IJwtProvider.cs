using SubastaYa.Domain.Entities;

namespace SubastaYa.Application.Interfaces.Services;

public interface IJwtProvider
{
    string Generate(Usuario usuario);
}
