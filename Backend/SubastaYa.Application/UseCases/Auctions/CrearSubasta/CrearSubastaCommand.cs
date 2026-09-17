using SubastaYa.Application.DTOs.Auctions;

namespace SubastaYa.Application.UseCases.Auctions.CrearSubasta;

public record CrearSubastaCommand(int VendedorId, CrearSubastaDto Dto);
