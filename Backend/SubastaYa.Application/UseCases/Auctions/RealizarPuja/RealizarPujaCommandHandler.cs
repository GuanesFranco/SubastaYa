using Microsoft.Extensions.Logging;
using SubastaYa.Application.Common.Time;
using SubastaYa.Application.DTOs.Auctions;
using SubastaYa.Application.DTOs.Notifications;
using SubastaYa.Application.Interfaces.Persistence;
using SubastaYa.Application.Interfaces.Services;
using SubastaYa.Domain.Entities;
using SubastaYa.Domain.Enums;
using SubastaYa.Domain.Exceptions;

namespace SubastaYa.Application.UseCases.Auctions.RealizarPuja;

public class RealizarPujaCommandHandler : ICommandHandler<RealizarPujaCommand, PujaResultadoDto>
{
    private readonly ILogger<RealizarPujaCommandHandler> _logger;
    private static readonly TimeSpan VentanaAntiSniping = TimeSpan.FromSeconds(60);
    private static readonly TimeSpan ExtensionAntiSniping = TimeSpan.FromMinutes(2);

    private readonly ISubastaRepository _subastaRepository;
    private readonly IBilleteraRepository _billeteraRepository;
    private readonly IAuditoriaLogRepository _auditoriaLogRepository;
    private readonly INotificadorSubastas _notificador;
    private readonly IUnitOfWork _unitOfWork;

    public RealizarPujaCommandHandler(
        ISubastaRepository subastaRepository,
        IBilleteraRepository billeteraRepository,
        IAuditoriaLogRepository auditoriaLogRepository,
        INotificadorSubastas notificador,
        IUnitOfWork unitOfWork, ILogger<RealizarPujaCommandHandler> logger)
    {
        _logger = logger;
        _subastaRepository = subastaRepository;
        _billeteraRepository = billeteraRepository;
        _auditoriaLogRepository = auditoriaLogRepository;
        _notificador = notificador;
        _unitOfWork = unitOfWork;
    }

    public async Task<PujaResultadoDto> Handle(RealizarPujaCommand command, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Ejecutando RealizarPujaCommandHandler...");
        var subasta = await _subastaRepository.ObtenerParaPujarAsync(command.SubastaId, cancellationToken)
            ?? throw new KeyNotFoundException("La subasta no existe.");

        var ahora = FechaArgentina.AhoraUtc;

        if (subasta.Estado == EstadoSubasta.Finalizada || subasta.Estado == EstadoSubasta.Desierta
            || ahora < subasta.FechaInicio || ahora > subasta.FechaFin)
        {
            throw new DomainException("La subasta no está activa.");
        }

        if (subasta.VendedorId == command.CompradorId)
        {
            throw new DomainException("No podés pujar en tu propia subasta.");
        }

        var montoMinimo = subasta.PrecioActual + subasta.IncrementoMinimo;
        if (command.Monto < montoMinimo)
        {
            throw new MontoInsuficienteException($"La puja debe ser de al menos {montoMinimo}.");
        }

        var billeteraComprador = await _billeteraRepository.ObtenerPorUsuarioIdAsync(command.CompradorId, cancellationToken)
            ?? throw new KeyNotFoundException("Billetera no encontrada.");

        try
        {
            billeteraComprador.Retener(command.Monto);
        }
        catch (FondosInsuficientesException)
        {
            await RegistrarRechazoAsync(subasta.Id, command.CompradorId, AccionesAuditoria.PujaRechazadaSaldo);
            throw;
        }

        var liderAnteriorId = subasta.PujaLider?.CompradorId;
        var montoAnterior = subasta.PrecioActual;

        if (liderAnteriorId.HasValue)
        {
            var billeteraLiderAnterior = await _billeteraRepository.ObtenerPorUsuarioIdAsync(liderAnteriorId.Value, cancellationToken);
            if (billeteraLiderAnterior != null)
            {
                billeteraLiderAnterior.Liberar(montoAnterior);
                await _billeteraRepository.AgregarMovimientoAsync(new TransaccionLedger
                {
                    BilleteraId = billeteraLiderAnterior.Id,
                    Tipo = TipoTransaccionLedger.Liberacion,
                    Monto = montoAnterior,
                    Fecha = ahora,
                    Descripcion = $"Liberación por superación en subasta #{subasta.Id}",
                    SubastaId = subasta.Id
                }, cancellationToken);
            }
        }

        var puja = new Puja
        {
            SubastaId = subasta.Id,
            CompradorId = command.CompradorId,
            Monto = command.Monto,
            FechaPuja = ahora
        };
        await _subastaRepository.AgregarPujaAsync(puja, cancellationToken);
        subasta.RegistrarNuevaPuja(puja);

        await _billeteraRepository.AgregarMovimientoAsync(new TransaccionLedger
        {
            BilleteraId = billeteraComprador.Id,
            Tipo = TipoTransaccionLedger.Retencion,
            Monto = command.Monto,
            Fecha = ahora,
            Descripcion = $"Retención por puja en subasta #{subasta.Id}",
            SubastaId = subasta.Id
        }, cancellationToken);

        var tiempoExtendido = false;
        if (subasta.FechaFin - ahora <= VentanaAntiSniping)
        {
            subasta.ExtenderTiempo(ExtensionAntiSniping);
            tiempoExtendido = true;

            await _auditoriaLogRepository.AgregarAsync(new AuditoriaLog
            {
                Entidad = EntidadesAuditoria.Subasta,
                EntidadId = subasta.Id,
                Accion = AccionesAuditoria.ExtensionTiempo,
                UsuarioId = command.CompradorId,
                DetalleJson = $"{{\"nuevaFechaFin\":\"{FechaArgentina.ComoUtc(subasta.FechaFin):o}\"}}",
                Fecha = ahora
            }, cancellationToken);
        }

        try
        {
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (ConflictoConcurrenciaException)
        {
            await RegistrarRechazoAsync(subasta.Id, command.CompradorId, AccionesAuditoria.PujaRechazadaConcurrencia);
            throw;
        }

        var fechaFinUtc = FechaArgentina.ComoUtc(subasta.FechaFin);

        await _notificador.PujaRealizadaAsync(new PujaRealizadaDto(
            subasta.Id,
            puja.Id,
            puja.Monto,
            FechaArgentina.ComoUtc(puja.FechaPuja),
            fechaFinUtc,
            command.CompradorId));

        if (tiempoExtendido)
        {
            await _notificador.TiempoExtendidoAsync(new TiempoExtendidoDto(subasta.Id, fechaFinUtc));
        }

        return new PujaResultadoDto(puja.Id, puja.Monto, fechaFinUtc, tiempoExtendido);
    }

    private async Task RegistrarRechazoAsync(int subastaId, int compradorId, AccionesAuditoria accion)
    {
        _unitOfWork.DescartarCambios();

        await _auditoriaLogRepository.AgregarAsync(new AuditoriaLog
        {
            Entidad = EntidadesAuditoria.Subasta,
            EntidadId = subastaId,
            Accion = accion,
            UsuarioId = compradorId,
            DetalleJson = string.Empty,
            Fecha = FechaArgentina.AhoraUtc
        });

        await _unitOfWork.SaveChangesAsync();
    }
}



