using System.ComponentModel.DataAnnotations;

namespace SubastaYa.Application.DTOs.Auth;

public record LoginDto(
    [Required, EmailAddress] string Email,
    [Required] string Password
);
