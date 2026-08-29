using SubastaYa.Domain.Enums;

namespace SubastaYa.Domain.Entities;

public class Subasta
{
    public int Id { get; private set; }
    public int VendedorId { get; private set; }
    public int CategoriaId { get; private set; }

    public string Titulo { get; private set; } = string.Empty;
    public string Descripcion { get; private set; } = string.Empty;
    public string UrlImagen { get; private set; } = string.Empty;

    public decimal PrecioBase { get; private set; }
    public decimal IncrementoMinimo { get; private set; }

    public decimal PrecioActual { get; private set; }
    public int? PujaLiderId { get; private set; }

    public DateTime FechaInicio { get; private set; }
    public DateTime FechaFin { get; private set; }
    public EstadoSubasta Estado { get; private set; } = EstadoSubasta.Programada;

    public int? GanadorUsuarioId { get; private set; }
    public decimal? MontoFinal { get; private set; }

    public int Version { get; private set; }

    public Usuario Vendedor { get; set; } = null!;
    public Categoria Categoria { get; set; } = null!;
    public Puja? PujaLider { get; set; }
    public Usuario? GanadorUsuario { get; set; }
    public ICollection<Puja> Pujas { get; set; } = new List<Puja>();

    private Subasta()
    {
    }

    public Subasta(
        int vendedorId,
        int categoriaId,
        string titulo,
        string descripcion,
        string urlImagen,
        decimal precioBase,
        decimal incrementoMinimo,
        DateTime fechaInicio,
        DateTime fechaFin)
    {
        VendedorId = vendedorId;
        CategoriaId = categoriaId;
        Titulo = titulo;
        Descripcion = descripcion;
        UrlImagen = urlImagen;
        PrecioBase = precioBase;
        IncrementoMinimo = incrementoMinimo;
        PrecioActual = precioBase;
        FechaInicio = fechaInicio;
        FechaFin = fechaFin;
        Estado = EstadoSubasta.Programada;
    }

    public void Activar()
    {
        Estado = EstadoSubasta.Activa;
        Version++;
    }

    public void RegistrarNuevaPuja(Puja puja)
    {
        PrecioActual = puja.Monto;
        PujaLider = puja;
        Version++;
    }

    public void ExtenderTiempo(TimeSpan extension)
    {
        FechaFin = FechaFin.Add(extension);
        Version++;
    }

    public void Finalizar(int ganadorUsuarioId, decimal montoFinal)
    {
        Estado = EstadoSubasta.Finalizada;
        GanadorUsuarioId = ganadorUsuarioId;
        MontoFinal = montoFinal;
        Version++;
    }

    public void MarcarDesierta()
    {
        Estado = EstadoSubasta.Desierta;
        Version++;
    }
}
