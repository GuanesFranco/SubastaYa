namespace SubastaYa.Application.UseCases.Auctions.Commands;

public record RealizarPujaCommand(int SubastaId, int CompradorId, decimal Monto);
