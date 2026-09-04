using SubastaYa.Domain.Entities;
using SubastaYa.Application.Interfaces;

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

        if (dto.FechaInicio >= dto.FechaFin)
        {
            throw new SubastaYa.Domain.Exceptions.DomainException("La fecha de inicio debe ser anterior a la fecha de fin.");
        }

        bool categoriaExiste = await _subastaRepository.ExisteCategoriaAsync(dto.CategoriaId);
        if (!categoriaExiste)
        {
            throw new SubastaYa.Domain.Exceptions.DomainException("La categoría especificada no existe.");
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
