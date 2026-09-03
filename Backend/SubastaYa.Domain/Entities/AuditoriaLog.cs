using SubastaYa.Domain.Enums;

namespace SubastaYa.Domain.Entities;

public class AuditoriaLog
{
    public int Id { get; set; }
    public EntidadesAuditoria Entidad { get; set; }
    public int EntidadId { get; set; }
    public AccionesAuditoria Accion { get; set; }
    public int? UsuarioId { get; set; }
    public string DetalleJson { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }

    public Usuario? Usuario { get; set; }
}
