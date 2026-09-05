using SubastaYa.Application.DTOs.Notifications;

namespace SubastaYa.Application.Interfaces;

public interface INotificadorSubastas
{
    Task PujaRealizadaAsync(PujaRealizadaDto notificacion);

    Task TiempoExtendidoAsync(TiempoExtendidoDto notificacion);

    Task SubastaCerradaAsync(SubastaCerradaDto notificacion);
}
