namespace SubastaYa.Domain.Entities;

public class Billetera
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public decimal SaldoTotal { get; set; }
    public decimal SaldoRetenido { get; set; }

    // Concurrency token para optimistic locking (ver PLAN.md).
    public int Version { get; set; }

    public decimal SaldoDisponible => SaldoTotal - SaldoRetenido;

    public Usuario Usuario { get; set; } = null!;
    public ICollection<TransaccionLedger> Movimientos { get; set; } = new List<TransaccionLedger>();
}
