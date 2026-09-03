using SubastaYa.Domain.Entities;

namespace SubastaYa.Application.Interfaces;

public interface IJwtProvider
{
    string Generate(Usuario usuario);
}
