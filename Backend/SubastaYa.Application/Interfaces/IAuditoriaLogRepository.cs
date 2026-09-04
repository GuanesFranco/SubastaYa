using SubastaYa.Domain.Entities;

namespace SubastaYa.Application.Interfaces;

public interface IAuditoriaLogRepository
{
    Task AgregarAsync(AuditoriaLog log);
}
