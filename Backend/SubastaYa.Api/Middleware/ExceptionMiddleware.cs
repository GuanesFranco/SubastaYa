using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
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
            await EscribirErrorAsync(context, StatusCodes.Status401Unauthorized, "No autenticado", ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            await EscribirErrorAsync(context, StatusCodes.Status404NotFound, "Recurso no encontrado", ex.Message);
        }
        catch (ConflictoConcurrenciaException)
        {
            await EscribirErrorAsync(
                context,
                StatusCodes.Status409Conflict,
                "Conflicto de concurrencia",
                "La operación no pudo completarse por un conflicto de concurrencia. Intentá de nuevo.");
        }
        catch (FondosInsuficientesException ex)
        {
            await EscribirErrorAsync(context, StatusCodes.Status422UnprocessableEntity, "Regla de negocio incumplida", ex.Message);
        }
        catch (MontoInsuficienteException ex)
        {
            await EscribirErrorAsync(context, StatusCodes.Status422UnprocessableEntity, "Regla de negocio incumplida", ex.Message);
        }
        catch (DomainException ex)
        {
            await EscribirErrorAsync(context, StatusCodes.Status400BadRequest, "Solicitud inválida", ex.Message);
        }
        catch (ArgumentException ex)
        {
            await EscribirErrorAsync(context, StatusCodes.Status400BadRequest, "Solicitud inválida", ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            await EscribirErrorAsync(context, StatusCodes.Status400BadRequest, "Solicitud inválida", ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error no controlado procesando {Path}", context.Request.Path);
            await EscribirErrorAsync(context, StatusCodes.Status500InternalServerError, "Error interno", "Ocurrió un error interno.");
        }
    }

    private Task EscribirErrorAsync(HttpContext context, int statusCode, string titulo, string detalle)
    {
        if (context.Response.HasStarted)
        {
            _logger.LogWarning(
                "No se pudo escribir la respuesta de error {StatusCode} para {Path}: la respuesta ya había empezado.",
                statusCode,
                context.Request.Path);

            return Task.CompletedTask;
        }

        var problema = new ProblemDetails
        {
            Status = statusCode,
            Title = titulo,
            Detail = detalle,
            Instance = context.Request.Path
        };

        problema.Extensions["traceId"] = Activity.Current?.Id ?? context.TraceIdentifier;

        context.Response.Clear();
        context.Response.ContentType = "application/problem+json";
        context.Response.StatusCode = statusCode;

        return context.Response.WriteAsJsonAsync(problema);
    }
}
