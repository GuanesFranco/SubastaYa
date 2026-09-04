using SubastaYa.Application.DTOs.Auth;
using SubastaYa.Application.Interfaces;
using SubastaYa.Domain.Entities;

namespace SubastaYa.Application.UseCases.Users.Commands;

public class RegistrarUsuarioCommandHandler
{
    private readonly IUsuarioRepository _usuarioRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtProvider _jwtProvider;

    public RegistrarUsuarioCommandHandler(
        IUsuarioRepository usuarioRepository,
        IUnitOfWork unitOfWork,
        IPasswordHasher passwordHasher,
        IJwtProvider jwtProvider)
    {
        _usuarioRepository = usuarioRepository;
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
        _jwtProvider = jwtProvider;
    }

    public async Task<AuthResponseDto> Handle(RegistrarUsuarioCommand command)
    {
        var existe = await _usuarioRepository.ObtenerPorEmailAsync(command.Dto.Email);
        if (existe != null)
        {
            throw new SubastaYa.Domain.Exceptions.DomainException("El correo electrónico ya está registrado.");
        }

        var hash = _passwordHasher.Hash(command.Dto.Password);
        
        var usuario = new Usuario
        {
            Email = command.Dto.Email,
            Nombre = command.Dto.Nombre,
            PasswordHash = hash,
            FechaRegistro = DateTime.UtcNow
        };

        var billetera = new Billetera(0); // EF Core asignará UsuarioId luego de guardar o usando nav properties.
        usuario.Billetera = billetera;

        await _usuarioRepository.AgregarAsync(usuario);
        await _unitOfWork.SaveChangesAsync();

        var token = _jwtProvider.Generate(usuario);

        return new AuthResponseDto(token, usuario.Id, usuario.Email, usuario.Nombre);
    }
}
