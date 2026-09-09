namespace SubastaYa.Application.UseCases.Auctions.RealizarPuja;

public record RealizarPujaCommand(int SubastaId, int CompradorId, decimal Monto);
