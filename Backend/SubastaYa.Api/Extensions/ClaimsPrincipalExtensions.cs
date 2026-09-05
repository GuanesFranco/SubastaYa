using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace SubastaYa.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static int ObtenerUsuarioId(this ClaimsPrincipal user)
    {
        var claim = user.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? user.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(claim, out var usuarioId))
        {
            throw new UnauthorizedAccessException("Token inválido o sin identificador de usuario.");
        }

        return usuarioId;
    }
}
