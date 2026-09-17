namespace SubastaYa.Domain.Exceptions;

public class ConflictoConcurrenciaException : Exception
{
    public ConflictoConcurrenciaException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
