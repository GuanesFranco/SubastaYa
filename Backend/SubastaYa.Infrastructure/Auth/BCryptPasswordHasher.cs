using SubastaYa.Application.Interfaces;
using BC = BCrypt.Net.BCrypt;

namespace SubastaYa.Infrastructure.Auth;

public class BCryptPasswordHasher : IPasswordHasher
{
    public string Hash(string password)
    {
        return BC.HashPassword(password);
    }

    public bool Verify(string password, string hash)
    {
        return BC.Verify(password, hash);
    }
}
