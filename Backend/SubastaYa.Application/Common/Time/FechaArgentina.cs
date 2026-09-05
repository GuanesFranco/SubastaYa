namespace SubastaYa.Application.Common.Time;

public static class FechaArgentina
{
    public static readonly TimeSpan Offset = TimeSpan.FromHours(-3);

    public static DateTime AhoraUtc => DateTime.UtcNow;

    public static DateTime Ahora => ALocal(DateTime.UtcNow);

    public static DateTime AUtc(DateTime fecha)
    {
        return fecha.Kind switch
        {
            DateTimeKind.Utc => fecha,
            DateTimeKind.Local => fecha.ToUniversalTime(),
            _ => DateTime.SpecifyKind(fecha - Offset, DateTimeKind.Utc)
        };
    }

    public static DateTime ALocal(DateTime fechaUtc)
    {
        var utc = fechaUtc.Kind == DateTimeKind.Utc
            ? fechaUtc
            : DateTime.SpecifyKind(fechaUtc, DateTimeKind.Utc);

        return DateTime.SpecifyKind(utc + Offset, DateTimeKind.Unspecified);
    }
}
