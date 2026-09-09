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
        _logger.LogInformation("AuctionSettlementWorker (Fase 6) iniciado.");

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
        using var scope = _scopeFactory.CreateScope();
        var subastaRepo = scope.ServiceProvider.GetRequiredService<ISubastaRepository>();
        var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

        var ahora = FechaArgentina.AhoraUtc;
        var pendientes = await subastaRepo.ObtenerPendientesDeActivacionAsync(ahora);

        foreach (var subasta in pendientes)
        {
            if (stoppingToken.IsCancellationRequested) return;

            try
            {
                subasta.Activar();
                await unitOfWork.SaveChangesAsync();
                _logger.LogInformation("Subasta {SubastaId} activada exitosamente.", subasta.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al activar la subasta {SubastaId}.", subasta.Id);
            }
        }
    }

    private async Task ProcesarSubastasFinalizadasAsync(CancellationToken stoppingToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var subastaRepo = scope.ServiceProvider.GetRequiredService<ISubastaRepository>();
        var billeteraRepo = scope.ServiceProvider.GetRequiredService<IBilleteraRepository>();
        var logRepo = scope.ServiceProvider.GetRequiredService<IAuditoriaLogRepository>();
        var notificador = scope.ServiceProvider.GetRequiredService<INotificadorSubastas>();
        var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

        var ahora = FechaArgentina.AhoraUtc;
        var pendientes = await subastaRepo.ObtenerPendientesDeCierreAsync(ahora);

        foreach (var subasta in pendientes)
        {
            if (stoppingToken.IsCancellationRequested) return;

            try
            {
                if (subasta.PujaLiderId == null)
                {
                    // Nadie pujó, pasa a Desierta
                    subasta.MarcarDesierta();
                    
                    var log = new AuditoriaLog
                    {
                        Entidad = EntidadesAuditoria.Subasta,
                        EntidadId = subasta.Id,
                        Accion = AccionesAuditoria.PaseDesierta,
                        Fecha = ahora,
                        DetalleJson = "{\"motivo\":\"Falta de pujas\"}"
                    };
                    await logRepo.AgregarAsync(log);
                    
                    await unitOfWork.SaveChangesAsync();
                    _logger.LogInformation("Subasta {SubastaId} finalizada sin pujas (Desierta).", subasta.Id);

                    await notificador.SubastaCerradaAsync(new SubastaCerradaDto(
                        subasta.Id, subasta.Estado, null, null));
                }
                else
                {
                    // Liquidación (Escrow)
                    var compradorId = subasta.PujaLider!.CompradorId;
                    var vendedorId = subasta.VendedorId;
                    var monto = subasta.PrecioActual;

                    var billeteraComprador = await billeteraRepo.ObtenerPorUsuarioIdAsync(compradorId);
                    var billeteraVendedor = await billeteraRepo.ObtenerPorUsuarioIdAsync(vendedorId);

                    if (billeteraComprador == null || billeteraVendedor == null)
                    {
                        throw new InvalidOperationException("Billeteras no encontradas durante la liquidación.");
                    }

                    // 1. Debitar al comprador (sale del saldo retenido y disminuye el saldo total)
                    billeteraComprador.Debitar(monto);
                    
                    // 2. Acreditar al vendedor
                    billeteraVendedor.Acreditar(monto);

                    // 3. Registrar Ledger
                    var debito = new TransaccionLedger
                    {
                        BilleteraId = billeteraComprador.Id,
                        Tipo = TipoTransaccionLedger.Debito,
                        Monto = -monto,
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
                    await billeteraRepo.AgregarMovimientoAsync(debito);
                    await billeteraRepo.AgregarMovimientoAsync(credito);

                    // 4. Finalizar subasta
                    subasta.Finalizar(compradorId, monto);

                    // 5. Auditoría
                    var log = new AuditoriaLog
                    {
                        Entidad = EntidadesAuditoria.Subasta,
                        EntidadId = subasta.Id,
                        Accion = AccionesAuditoria.LiquidacionVenta,
                        Fecha = ahora,
                        DetalleJson = $"{{\"compradorId\":{compradorId},\"monto\":{monto}}}"
                    };
                    await logRepo.AgregarAsync(log);

                    // Guardar transacción (UnitOfWork)
                    await unitOfWork.SaveChangesAsync();
                    _logger.LogInformation("Subasta {SubastaId} finalizada exitosamente con ganador {GanadorId}.", subasta.Id, compradorId);

                    // 6. Notificar por SignalR (se hace después de guardar para asegurar la info en BD)
                    await notificador.SubastaCerradaAsync(new SubastaCerradaDto(
                        subasta.Id, subasta.Estado, compradorId, monto));
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error crítico liquidando la subasta {SubastaId}.", subasta.Id);
            }
        }
    }
}

