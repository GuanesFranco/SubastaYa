namespace SubastaYa.Application.Common.Time;

public static class FechaArgentina
{
    private static readonly TimeSpan Offset = TimeSpan.FromHours(-3);

    public static DateTime AhoraUtc => DateTime.UtcNow;

    public static DateTime AUtc(DateTime fecha)
    {
        return fecha.Kind switch
        {
            DateTimeKind.Utc => fecha,
            DateTimeKind.Local => fecha.ToUniversalTime(),
            _ => DateTime.SpecifyKind(fecha - Offset, DateTimeKind.Utc)
        };
    }

}
