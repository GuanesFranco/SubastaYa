using SubastaYa.Application.DTOs.Auctions;

namespace SubastaYa.Application.UseCases.Auctions.Commands;

public record CrearSubastaCommand(int VendedorId, CrearSubastaDto Dto);
