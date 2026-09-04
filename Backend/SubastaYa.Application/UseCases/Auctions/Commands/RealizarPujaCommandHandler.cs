using SubastaYa.Application.DTOs.Auctions;
using SubastaYa.Application.Interfaces;
using SubastaYa.Domain.Entities;
using SubastaYa.Domain.Enums;
using SubastaYa.Domain.Exceptions;

namespace SubastaYa.Application.UseCases.Auctions.Commands;

public class RealizarPujaCommandHandler
{
    private static readonly TimeSpan VentanaAntiSniping = TimeSpan.FromSeconds(60);
    private static readonly TimeSpan ExtensionAntiSniping = TimeSpan.FromMinutes(2);

    private readonly ISubastaRepository _subastaRepository;
    private readonly IBilleteraRepository _billeteraRepository;
    private readonly IAuditoriaLogRepository _auditoriaLogRepository;
    private readonly IUnitOfWork _unitOfWork;

    public RealizarPujaCommandHandler(
        ISubastaRepository subastaRepository,
        IBilleteraRepository billeteraRepository,
        IAuditoriaLogRepository auditoriaLogRepository,
        IUnitOfWork unitOfWork)
    {
        _subastaRepository = subastaRepository;
        _billeteraRepository = billeteraRepository;
        _auditoriaLogRepository = auditoriaLogRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<PujaResultadoDto> Handle(RealizarPujaCommand command)
    {
        var subasta = await _subastaRepository.ObtenerParaPujarAsync(command.SubastaId)
            ?? throw new KeyNotFoundException("La subasta no existe.");

        var ahora = DateTime.UtcNow;

        if (subasta.Estado == EstadoSubasta.Finalizada || subasta.Estado == EstadoSubasta.Desierta
            || ahora < subasta.FechaInicio || ahora > subasta.FechaFin)
        {
            throw new DomainException("La subasta no está activa.");
        }

        var montoMinimo = subasta.PrecioActual + subasta.IncrementoMinimo;
        if (command.Monto < montoMinimo)
        {
            throw new MontoInsuficienteException($"La puja debe ser de al menos {montoMinimo}.");
        }

        var billeteraComprador = await _billeteraRepository.ObtenerPorUsuarioIdAsync(command.CompradorId)
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
            var billeteraLiderAnterior = await _billeteraRepository.ObtenerPorUsuarioIdAsync(liderAnteriorId.Value);
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
                });
            }
        }

        var puja = new Puja
        {
            SubastaId = subasta.Id,
            CompradorId = command.CompradorId,
            Monto = command.Monto,
            FechaPuja = ahora
        };
        await _subastaRepository.AgregarPujaAsync(puja);
        subasta.RegistrarNuevaPuja(puja);

        await _billeteraRepository.AgregarMovimientoAsync(new TransaccionLedger
        {
            BilleteraId = billeteraComprador.Id,
            Tipo = TipoTransaccionLedger.Retencion,
            Monto = command.Monto,
            Fecha = ahora,
            Descripcion = $"Retención por puja en subasta #{subasta.Id}",
            SubastaId = subasta.Id
        });

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
                DetalleJson = $"{{\"nuevaFechaFin\":\"{subasta.FechaFin:o}\"}}",
                Fecha = ahora
            });
        }

        try
        {
            await _unitOfWork.SaveChangesAsync();
        }
        catch (ConflictoConcurrenciaException)
        {
            await RegistrarRechazoAsync(subasta.Id, command.CompradorId, AccionesAuditoria.PujaRechazadaConcurrencia);
            throw;
        }

        return new PujaResultadoDto(puja.Id, puja.Monto, subasta.FechaFin, tiempoExtendido);
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
            Fecha = DateTime.UtcNow
        });

        await _unitOfWork.SaveChangesAsync();
    }
}
