using System.ComponentModel.DataAnnotations;

namespace SubastaYa.Application.DTOs.Auth;

public record RegistrarUsuarioDto(
    [Required, EmailAddress] string Email,
    [Required, MinLength(2)] string Nombre,
    [Required, MinLength(6)] string Password
);
