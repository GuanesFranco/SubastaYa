using SubastaYa.Domain.Entities;

namespace SubastaYa.Application.Interfaces.Persistence;

public interface IAuditoriaLogRepository
{
    Task AgregarAsync(AuditoriaLog log);
}
