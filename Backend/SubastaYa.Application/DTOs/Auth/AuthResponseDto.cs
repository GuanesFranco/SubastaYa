namespace SubastaYa.Application.DTOs.Auth;

public record AuthResponseDto(
    string Token,
    int Id,
    string Email,
    string Nombre
);
