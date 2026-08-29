using SubastaYa.Domain.Enums;

namespace SubastaYa.Domain.Entities;

public class TransaccionLedger
{
    public int Id { get; set; }
    public int BilleteraId { get; set; }
    public TipoTransaccionLedger Tipo { get; set; }
    public decimal Monto { get; set; }
    public DateTime Fecha { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public int? SubastaId { get; set; }

    public Billetera Billetera { get; set; } = null!;
    public Subasta? Subasta { get; set; }
}
