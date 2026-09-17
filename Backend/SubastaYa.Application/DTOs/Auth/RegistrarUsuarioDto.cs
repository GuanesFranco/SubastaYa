using System.ComponentModel.DataAnnotations;

namespace SubastaYa.Application.DTOs.Auth;

public record RegistrarUsuarioDto(
    [Required(ErrorMessage = "El email es obligatorio.")] [EmailAddress(ErrorMessage = "El email no tiene un formato válido.")] string Email,
    [Required(ErrorMessage = "El nombre es obligatorio.")] [MinLength(2, ErrorMessage = "El nombre debe tener al menos 2 caracteres.")] string Nombre,
    [Required(ErrorMessage = "La contraseña es obligatoria.")] [MinLength(6, ErrorMessage = "La contraseña debe tener al menos 6 caracteres.")] string Password
);
