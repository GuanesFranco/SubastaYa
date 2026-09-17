namespace SubastaYa.Domain.Entities;

public class Billetera
{
    public int Id { get; private set; }
    public int UsuarioId { get; private set; }
    public decimal SaldoTotal { get; private set; }
    public decimal SaldoRetenido { get; private set; }
    public int Version { get; private set; }

    public decimal SaldoDisponible => SaldoTotal - SaldoRetenido;

    public Usuario Usuario { get; set; } = null!;
    public ICollection<TransaccionLedger> Movimientos { get; set; } = new List<TransaccionLedger>();

    private Billetera()
    {
    }

    public Billetera(int usuarioId)
    {
        UsuarioId = usuarioId;
        SaldoTotal = 0m;
        SaldoRetenido = 0m;
        Version = 0;
    }

    public void Depositar(decimal monto)
    {
        ValidarMontoPositivo(monto);
        SaldoTotal += monto;
        Version++;
    }

    public void Retener(decimal monto)
    {
        ValidarMontoPositivo(monto);
        if (monto > SaldoDisponible)
        {
            throw new SubastaYa.Domain.Exceptions.FondosInsuficientesException("Saldo disponible insuficiente para retener el monto solicitado.");
        }

        SaldoRetenido += monto;
        Version++;
    }

    public void Liberar(decimal monto)
    {
        ValidarMontoPositivo(monto);
        if (monto > SaldoRetenido)
        {
            throw new SubastaYa.Domain.Exceptions.DomainException("No se puede liberar un monto mayor al saldo retenido actual.");
        }

        SaldoRetenido -= monto;
        Version++;
    }

    public void Debitar(decimal monto)
    {
        ValidarMontoPositivo(monto);
        if (monto > SaldoRetenido)
        {
            throw new SubastaYa.Domain.Exceptions.DomainException("No se puede debitar un monto mayor al saldo retenido actual.");
        }

        SaldoTotal -= monto;
        SaldoRetenido -= monto;
        Version++;
    }

    public void Acreditar(decimal monto)
    {
        ValidarMontoPositivo(monto);
        SaldoTotal += monto;
        Version++;
    }

    private static void ValidarMontoPositivo(decimal monto)
    {
        if (monto <= 0)
        {
            throw new SubastaYa.Domain.Exceptions.DomainException("El monto debe ser positivo.");
        }
    }
}
