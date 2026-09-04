using Microsoft.EntityFrameworkCore;
using SubastaYa.Domain.Exceptions;

namespace SubastaYa.Api.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (UnauthorizedAccessException ex)
        {
            await EscribirErrorAsync(context, StatusCodes.Status401Unauthorized, ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            await EscribirErrorAsync(context, StatusCodes.Status404NotFound, ex.Message);
        }
        catch (ConflictoConcurrenciaException)
        {
            await EscribirErrorAsync(
                context,
                StatusCodes.Status409Conflict,
                "La operación no pudo completarse por un conflicto de concurrencia. Intentá de nuevo.");
        }
        catch (DbUpdateConcurrencyException)
        {
            await EscribirErrorAsync(
                context,
                StatusCodes.Status409Conflict,
                "La operación no pudo completarse por un conflicto de concurrencia. Intentá de nuevo.");
        }
        catch (FondosInsuficientesException ex)
        {
            await EscribirErrorAsync(context, StatusCodes.Status422UnprocessableEntity, ex.Message);
        }
        catch (MontoInsuficienteException ex)
        {
            await EscribirErrorAsync(context, StatusCodes.Status422UnprocessableEntity, ex.Message);
        }
        catch (DomainException ex)
        {
            await EscribirErrorAsync(context, StatusCodes.Status400BadRequest, ex.Message);
        }
        catch (ArgumentException ex)
        {
            await EscribirErrorAsync(context, StatusCodes.Status400BadRequest, ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            await EscribirErrorAsync(context, StatusCodes.Status400BadRequest, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error no controlado procesando {Path}", context.Request.Path);
            await EscribirErrorAsync(context, StatusCodes.Status500InternalServerError, "Ocurrió un error interno.");
        }
    }

    private static Task EscribirErrorAsync(HttpContext context, int statusCode, string mensaje)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = statusCode;
        return context.Response.WriteAsJsonAsync(new { error = mensaje });
    }
}
