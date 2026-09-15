using System.ComponentModel.DataAnnotations;

namespace SubastaYa.Application.DTOs.Auth;

public record LoginDto(
    [Required(ErrorMessage = "El email es obligatorio.")] [EmailAddress(ErrorMessage = "El email no tiene un formato válido.")] string Email,
    [Required(ErrorMessage = "La contraseña es obligatoria.")] string Password
);
