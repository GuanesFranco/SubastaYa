using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SubastaYa.Application.Common.Time;
using SubastaYa.Application.DTOs.Notifications;
using SubastaYa.Application.Interfaces.Persistence;
using SubastaYa.Application.Interfaces.Services;
using SubastaYa.Domain.Entities;
using SubastaYa.Domain.Enums;

namespace SubastaYa.Infrastructure.Workers;

public class AuctionSettlementWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AuctionSettlementWorker> _logger;

    public AuctionSettlementWorker(IServiceScopeFactory scopeFactory, ILogger<AuctionSettlementWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("AuctionSettlementWorker iniciado y escuchando subastas.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcesarSubastasProgramadasAsync(stoppingToken);
                await ProcesarSubastasFinalizadasAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inesperado ejecutando AuctionSettlementWorker.");
            }

            await Task.Delay(10000, stoppingToken);
        }
    }

    private async Task ProcesarSubastasProgramadasAsync(CancellationToken stoppingToken)
    {
        List<int> pendientesIds;
        using (var scope = _scopeFactory.CreateScope())
        {
            var subastaRepo = scope.ServiceProvider.GetRequiredService<ISubastaRepository>();
            var ahora = FechaArgentina.AhoraUtc;
            pendientesIds = (await subastaRepo.ObtenerIdsPendientesDeActivacionAsync(ahora, stoppingToken)).ToList();
        }

        if (pendientesIds.Any())
        {
            _logger.LogInformation("Activador: Procesando {Cantidad} subastas programadas para activarse.", pendientesIds.Count);
        }

        foreach (var id in pendientesIds)
        {
            if (stoppingToken.IsCancellationRequested) return;

            using var scope = _scopeFactory.CreateScope();
            var subastaRepo = scope.ServiceProvider.GetRequiredService<ISubastaRepository>();
            var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

            try
            {
                var subasta = await subastaRepo.ObtenerParaLiquidacionAsync(id, stoppingToken);
                if (subasta == null || subasta.Estado != EstadoSubasta.Programada) continue;

                subasta.Activar();
                await unitOfWork.SaveChangesAsync(stoppingToken);
                _logger.LogInformation("Subasta {SubastaId} activada exitosamente.", subasta.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al activar la subasta {SubastaId}.", id);
            }
        }
    }

    private async Task ProcesarSubastasFinalizadasAsync(CancellationToken stoppingToken)
    {
        List<int> pendientesIds;
        using (var scope = _scopeFactory.CreateScope())
        {
            var subastaRepo = scope.ServiceProvider.GetRequiredService<ISubastaRepository>();
            var ahora = FechaArgentina.AhoraUtc;
            pendientesIds = (await subastaRepo.ObtenerIdsPendientesDeCierreAsync(ahora, stoppingToken)).ToList();
        }

        if (pendientesIds.Any())
        {
            _logger.LogInformation("Liquidador: Procesando el cierre de {Cantidad} subastas activas vencidas.", pendientesIds.Count);
        }

        foreach (var id in pendientesIds)
        {
            if (stoppingToken.IsCancellationRequested) return;

            using var scope = _scopeFactory.CreateScope();
            var subastaRepo = scope.ServiceProvider.GetRequiredService<ISubastaRepository>();
            var billeteraRepo = scope.ServiceProvider.GetRequiredService<IBilleteraRepository>();
            var logRepo = scope.ServiceProvider.GetRequiredService<IAuditoriaLogRepository>();
            var notificador = scope.ServiceProvider.GetRequiredService<INotificadorSubastas>();
            var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
            var ahora = FechaArgentina.AhoraUtc;

            try
            {
                var subasta = await subastaRepo.ObtenerParaLiquidacionAsync(id, stoppingToken);
                if (subasta == null || subasta.Estado != EstadoSubasta.Activa) continue;

                if (subasta.PujaLiderId == null)
                {
                    subasta.MarcarDesierta();
                    
                    var log = new AuditoriaLog
                    {
                        Entidad = EntidadesAuditoria.Subasta,
                        EntidadId = subasta.Id,
                        Accion = AccionesAuditoria.PaseDesierta,
                        Fecha = ahora,
                        DetalleJson = "{\"motivo\":\"Falta de pujas\"}"
                    };
                    await logRepo.AgregarAsync(log, stoppingToken);
                    
                    await unitOfWork.SaveChangesAsync(stoppingToken);
                    _logger.LogInformation("Subasta {SubastaId} finalizada sin pujas (Desierta).", subasta.Id);

                    await notificador.SubastaCerradaAsync(new SubastaCerradaDto(
                        subasta.Id, subasta.Estado, null, null));
                }
                else
                {
                    var compradorId = subasta.PujaLider!.CompradorId;
                    var vendedorId = subasta.VendedorId;
                    var monto = subasta.PrecioActual;

                    var billeteraComprador = await billeteraRepo.ObtenerPorUsuarioIdAsync(compradorId, stoppingToken);
                    var billeteraVendedor = await billeteraRepo.ObtenerPorUsuarioIdAsync(vendedorId, stoppingToken);

                    if (billeteraComprador == null || billeteraVendedor == null)
                    {
                        throw new InvalidOperationException("Billeteras no encontradas durante la liquidación.");
                    }

                    billeteraComprador.Debitar(monto);
                    billeteraVendedor.Acreditar(monto);

                    var debito = new TransaccionLedger
                    {
                        BilleteraId = billeteraComprador.Id,
                        Tipo = TipoTransaccionLedger.Debito,
                        Monto = monto,
                        Fecha = ahora,
                        SubastaId = subasta.Id,
                        Descripcion = $"Pago por victoria en subasta {subasta.Id}"
                    };
                    var credito = new TransaccionLedger
                    {
                        BilleteraId = billeteraVendedor.Id,
                        Tipo = TipoTransaccionLedger.Credito,
                        Monto = monto,
                        Fecha = ahora,
                        SubastaId = subasta.Id,
                        Descripcion = $"Cobro por venta en subasta {subasta.Id}"
                    };
                    await billeteraRepo.AgregarMovimientoAsync(debito, stoppingToken);
                    await billeteraRepo.AgregarMovimientoAsync(credito, stoppingToken);

                    subasta.Finalizar(compradorId, monto);

                    var log = new AuditoriaLog
                    {
                        Entidad = EntidadesAuditoria.Subasta,
                        EntidadId = subasta.Id,
                        Accion = AccionesAuditoria.LiquidacionVenta,
                        Fecha = ahora,
                        DetalleJson = $"{{\"compradorId\":{compradorId},\"monto\":{monto}}}"
                    };
                    await logRepo.AgregarAsync(log, stoppingToken);

                    await unitOfWork.SaveChangesAsync(stoppingToken);
                    _logger.LogInformation("Subasta {SubastaId} finalizada exitosamente con ganador {GanadorId}.", subasta.Id, compradorId);

                    await notificador.SubastaCerradaAsync(new SubastaCerradaDto(
                        subasta.Id, subasta.Estado, compradorId, monto));
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error crítico liquidando la subasta {SubastaId}.", id);
            }
        }
    }
}
