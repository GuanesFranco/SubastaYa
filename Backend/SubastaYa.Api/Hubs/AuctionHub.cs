using Microsoft.AspNetCore.SignalR;

namespace SubastaYa.Api.Hubs;

public class AuctionHub : Hub
{
    public static string NombreGrupo(int subastaId) => $"subasta-{subastaId}";

    public Task JoinAuctionGroup(int subastaId)
    {
        return Groups.AddToGroupAsync(Context.ConnectionId, NombreGrupo(subastaId));
    }

    public Task LeaveAuctionGroup(int subastaId)
    {
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, NombreGrupo(subastaId));
    }
}
