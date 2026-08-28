using SubastaYa.Domain.Enums;

namespace SubastaYa.Domain.Entities;

public class Subasta
{
    public int Id { get; set; }
    public int VendedorId { get; set; }
    public int CategoriaId { get; set; }

    public string Titulo { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public string UrlImagen { get; set; } = string.Empty;

    public decimal PrecioBase { get; set; }
    public decimal IncrementoMinimo { get; set; }

    // Denormalizado para no recalcular MAX(Monto) de Pujas en cada lectura del catálogo.
    public decimal PrecioActual { get; set; }
    public int? PujaLiderId { get; set; }

    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public EstadoSubasta Estado { get; set; } = EstadoSubasta.Programada;

    public int? GanadorUsuarioId { get; set; }
    public decimal? MontoFinal { get; set; }

    // Concurrency token para optimistic locking (ver PLAN.md).
    public int Version { get; set; }

    public Usuario Vendedor { get; set; } = null!;
    public Categoria Categoria { get; set; } = null!;
    public Puja? PujaLider { get; set; }
    public Usuario? GanadorUsuario { get; set; }
    public ICollection<Puja> Pujas { get; set; } = new List<Puja>();
}
