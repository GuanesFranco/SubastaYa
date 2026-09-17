using Microsoft.AspNetCore.SignalR;

namespace SubastaYa.Api.Hubs;

public class AuctionHub : Hub
{
    public const string GrupoCatalogo = "catalogo";

    public static string NombreGrupo(int subastaId) => $"subasta-{subastaId}";

    public Task JoinAuctionGroup(int subastaId)
    {
        return Groups.AddToGroupAsync(Context.ConnectionId, NombreGrupo(subastaId));
    }

    public Task LeaveAuctionGroup(int subastaId)
    {
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, NombreGrupo(subastaId));
    }

    public Task JoinCatalogGroup()
    {
        return Groups.AddToGroupAsync(Context.ConnectionId, GrupoCatalogo);
    }

    public Task LeaveCatalogGroup()
    {
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, GrupoCatalogo);
    }
}

