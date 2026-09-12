namespace SubastaYa.Application.Common;

public static class Paginacion
{
    public const int PageSizePorDefecto = 10;
    public const int PageSizeMaximo = 100;

    public static (int Page, int PageSize) Normalizar(int page, int pageSize)
    {
        return (Math.Max(page, 1), Math.Clamp(pageSize, 1, PageSizeMaximo));
    }
}
