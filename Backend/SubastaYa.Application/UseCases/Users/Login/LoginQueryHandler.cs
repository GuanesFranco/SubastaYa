using SubastaYa.Application.DTOs.Auth;
using SubastaYa.Application.Interfaces.Persistence;
using SubastaYa.Application.Interfaces.Services;

namespace SubastaYa.Application.UseCases.Users.Login;

public class LoginQueryHandler : IQueryHandler<LoginQuery, AuthResponseDto>
{
    private readonly IUsuarioRepository _usuarioRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtProvider _jwtProvider;

    public LoginQueryHandler(
        IUsuarioRepository usuarioRepository,
        IPasswordHasher passwordHasher,
        IJwtProvider jwtProvider)
    {
        _usuarioRepository = usuarioRepository;
        _passwordHasher = passwordHasher;
        _jwtProvider = jwtProvider;
    }

    public async Task<AuthResponseDto> Handle(LoginQuery query)
    {
        var usuario = await _usuarioRepository.ObtenerPorEmailAsync(query.Dto.Email);
        if (usuario == null)
        {
            throw new UnauthorizedAccessException("Credenciales incorrectas.");
        }

        if (!_passwordHasher.Verify(query.Dto.Password, usuario.PasswordHash))
        {
            throw new UnauthorizedAccessException("Credenciales incorrectas.");
        }

        var token = _jwtProvider.Generate(usuario);

        return new AuthResponseDto(token, usuario.Id, usuario.Email, usuario.Nombre);
    }
}


