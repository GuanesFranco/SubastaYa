using SubastaYa.Application.Interfaces.Persistence;
using SubastaYa.Domain.Entities;

namespace SubastaYa.Infrastructure.Persistence.Repositories;

public class AuditoriaLogRepository : IAuditoriaLogRepository
{
    private readonly SubastaYaDbContext _context;

    public AuditoriaLogRepository(SubastaYaDbContext context)
    {
        _context = context;
    }

    public async Task AgregarAsync(AuditoriaLog log, CancellationToken cancellationToken = default)
    {
        await _context.AuditoriaLogs.AddAsync(log, cancellationToken);
    }
}
