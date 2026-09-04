using NSubstitute;
using SubastaYa.Application.DTOs.Auth;
using SubastaYa.Application.Interfaces;
using SubastaYa.Application.UseCases.Users.Commands;
using SubastaYa.Domain.Entities;
using SubastaYa.Domain.Exceptions;

namespace SubastaYa.Tests;

public class RegistrarUsuarioCommandHandlerTests
{
    private readonly IUsuarioRepository _usuarioRepositoryMock;
    private readonly IUnitOfWork _unitOfWorkMock;
    private readonly IPasswordHasher _passwordHasherMock;
    private readonly IJwtProvider _jwtProviderMock;
    private readonly RegistrarUsuarioCommandHandler _handler;

    public RegistrarUsuarioCommandHandlerTests()
    {
        _usuarioRepositoryMock = Substitute.For<IUsuarioRepository>();
        _unitOfWorkMock = Substitute.For<IUnitOfWork>();
        _passwordHasherMock = Substitute.For<IPasswordHasher>();
        _jwtProviderMock = Substitute.For<IJwtProvider>();

        _handler = new RegistrarUsuarioCommandHandler(
            _usuarioRepositoryMock,
            _unitOfWorkMock,
            _passwordHasherMock,
            _jwtProviderMock
        );
    }

    [Fact]
    public async Task Handle_SiEmailYaExiste_LanzaDomainException()
    {
        // Arrange
        var dto = new RegistrarUsuarioDto("test@test.com", "Test", "Password123!");
        var command = new RegistrarUsuarioCommand(dto);

        var usuarioMock = new Usuario
        {
            Email = dto.Email,
            Nombre = dto.Nombre,
            PasswordHash = "hash"
        };

        _usuarioRepositoryMock.ObtenerPorEmailAsync(dto.Email)
            .Returns(usuarioMock);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<DomainException>(() => _handler.Handle(command));
        Assert.Equal("El correo electrónico ya está registrado.", exception.Message);

        await _unitOfWorkMock.DidNotReceive().SaveChangesAsync();
    }
}
