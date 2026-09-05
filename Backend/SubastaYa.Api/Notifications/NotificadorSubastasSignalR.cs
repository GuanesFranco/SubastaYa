using Microsoft.AspNetCore.SignalR;
using SubastaYa.Api.Hubs;
using SubastaYa.Application.DTOs.Notifications;
using SubastaYa.Application.Interfaces;

namespace SubastaYa.Api.Notifications;

public class NotificadorSubastasSignalR : INotificadorSubastas
{
    private readonly IHubContext<AuctionHub> _hub;
    private readonly ILogger<NotificadorSubastasSignalR> _logger;

    public NotificadorSubastasSignalR(IHubContext<AuctionHub> hub, ILogger<NotificadorSubastasSignalR> logger)
    {
        _hub = hub;
        _logger = logger;
    }

    public Task PujaRealizadaAsync(PujaRealizadaDto notificacion)
    {
        return EmitirAsync(notificacion.SubastaId, "BidPlaced", notificacion);
    }

    public Task TiempoExtendidoAsync(TiempoExtendidoDto notificacion)
    {
        return EmitirAsync(notificacion.SubastaId, "AuctionExtended", notificacion);
    }

    public Task SubastaCerradaAsync(SubastaCerradaDto notificacion)
    {
        return EmitirAsync(notificacion.SubastaId, "AuctionClosed", notificacion);
    }

    private async Task EmitirAsync(int subastaId, string evento, object payload)
    {
        try
        {
            await _hub.Clients.Group(AuctionHub.NombreGrupo(subastaId)).SendAsync(evento, payload);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "No se pudo emitir {Evento} para la subasta {SubastaId}.", evento, subastaId);
        }
    }
}
