namespace SubastaYa.Domain.Entities;

public class AuditoriaLog
{
    public int Id { get; set; }

    // Ej: "SUBASTA", "BILLETERA", "SISTEMA".
    public string Entidad { get; set; } = string.Empty;
    public int EntidadId { get; set; }

    // Ej: "EXTENSION_TIEMPO", "CIERRE_WORKER", "PUJA_RECHAZADA_CONCURRENCIA".
    public string Accion { get; set; } = string.Empty;

    // Null si la acción la disparó el Worker (no un usuario).
    public int? UsuarioId { get; set; }
    public string DetalleJson { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }

    public Usuario? Usuario { get; set; }
}
