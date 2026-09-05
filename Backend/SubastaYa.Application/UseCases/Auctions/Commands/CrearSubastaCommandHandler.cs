using SubastaYa.Application.Interfaces;
using SubastaYa.Domain.Entities;
using SubastaYa.Domain.Exceptions;

namespace SubastaYa.Application.UseCases.Auctions.Commands;

public class CrearSubastaCommandHandler
{
    private readonly ISubastaRepository _subastaRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CrearSubastaCommandHandler(ISubastaRepository subastaRepository, IUnitOfWork unitOfWork)
    {
        _subastaRepository = subastaRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<int> Handle(CrearSubastaCommand command)
    {
        var dto = command.Dto;

        if (string.IsNullOrWhiteSpace(dto.Titulo))
        {
            throw new DomainException("El título es obligatorio.");
        }

        if (string.IsNullOrWhiteSpace(dto.Descripcion))
        {
            throw new DomainException("La descripción es obligatoria.");
        }

        if (dto.PrecioBase <= 0)
        {
            throw new DomainException("El precio base debe ser mayor a 0.");
        }

        if (dto.IncrementoMinimo <= 0)
        {
            throw new DomainException("El incremento mínimo debe ser mayor a 0.");
        }

        if (dto.FechaInicio >= dto.FechaFin)
        {
            throw new DomainException("La fecha de inicio debe ser anterior a la fecha de fin.");
        }

        bool categoriaExiste = await _subastaRepository.ExisteCategoriaAsync(dto.CategoriaId);
        if (!categoriaExiste)
        {
            throw new DomainException("La categoría especificada no existe.");
        }

        var subasta = new Subasta(
            vendedorId: command.VendedorId,
            categoriaId: dto.CategoriaId,
            titulo: dto.Titulo,
            descripcion: dto.Descripcion,
            urlImagen: dto.UrlImagen ?? string.Empty,
            precioBase: dto.PrecioBase,
            incrementoMinimo: dto.IncrementoMinimo,
            fechaInicio: dto.FechaInicio,
            fechaFin: dto.FechaFin
        );

        await _subastaRepository.AgregarAsync(subasta);
        await _unitOfWork.SaveChangesAsync();

        return subasta.Id;
    }
}
