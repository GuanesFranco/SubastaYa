using Microsoft.EntityFrameworkCore;
using SubastaYa.Application.Common.Time;
using SubastaYa.Application.Interfaces.Services;
using SubastaYa.Domain.Entities;
using SubastaYa.Domain.Enums;

namespace SubastaYa.Infrastructure.Persistence;

public static class DbInitializer
{
    public const string PasswordSemilla = "Test1234!";

    public static async Task SeedAsync(SubastaYaDbContext context, IPasswordHasher passwordHasher)
    {
        if (await context.Usuarios.AnyAsync())
        {
            return;
        }

        var ahora = FechaArgentina.AhoraUtc;
        var hash = passwordHasher.Hash(PasswordSemilla);

        var vendedor = CrearUsuario("vendedor@subastaya.com", "Sofía Vendedora", hash, ahora);
        var comprador1 = CrearUsuario("comprador1@subastaya.com", "Julián Comprador", hash, ahora);
        var comprador2 = CrearUsuario("comprador2@subastaya.com", "Marina Compradora", hash, ahora);
        var sinFondos = CrearUsuario("sinfondos@subastaya.com", "Pedro Sin Fondos", hash, ahora);

        await context.Usuarios.AddRangeAsync(vendedor, comprador1, comprador2, sinFondos);
        await context.SaveChangesAsync();

        var billeteraVendedor = new Billetera(vendedor.Id);
        var billeteraComprador1 = new Billetera(comprador1.Id);
        var billeteraComprador2 = new Billetera(comprador2.Id);
        var billeteraSinFondos = new Billetera(sinFondos.Id);

        billeteraVendedor.Depositar(10_000m);
        billeteraComprador1.Depositar(200_000m);
        billeteraComprador2.Depositar(120_000m);

        await context.Billeteras.AddRangeAsync(
            billeteraVendedor, billeteraComprador1, billeteraComprador2, billeteraSinFondos);
        await context.SaveChangesAsync();

        var subastaEstandar = new Subasta(
            vendedor.Id, CategoriaTecnologia,
            "Notebook gamer 16GB RAM",
            "Notebook con procesador de última generación, 16GB de RAM y placa dedicada. Usada tres meses, con caja y garantía vigente.",
            "https://picsum.photos/seed/notebook/600/400",
            precioBase: 30_000m, incrementoMinimo: 1_000m,
            fechaInicio: ahora.AddMinutes(-30), fechaFin: ahora.AddMinutes(25));
        subastaEstandar.Activar();

        var subastaCritica = new Subasta(
            vendedor.Id, CategoriaColeccionables,
            "Figura de colección edición limitada",
            "Pieza numerada 47/500, sellada, con certificado de autenticidad. Cierra en minutos.",
            "https://picsum.photos/seed/figura/600/400",
            precioBase: 15_000m, incrementoMinimo: 500m,
            fechaInicio: ahora.AddMinutes(-20), fechaFin: ahora.AddSeconds(90));
        subastaCritica.Activar();

        var subastaProgramada = new Subasta(
            vendedor.Id, CategoriaVehiculos,
            "Moto 150cc modelo 2022",
            "Moto con 8.000 km, service oficial al día, papeles en regla. La subasta abre mañana.",
            "https://picsum.photos/seed/moto/600/400",
            precioBase: 900_000m, incrementoMinimo: 20_000m,
            fechaInicio: ahora.AddHours(24), fechaFin: ahora.AddHours(48));

        var subastaVencidaConGanador = new Subasta(
            vendedor.Id, CategoriaIndumentaria,
            "Campera de cuero talle M",
            "Campera de cuero genuino, poco uso. Esta subasta ya venció y el worker debería liquidarla.",
            "https://picsum.photos/seed/campera/600/400",
            precioBase: 50_000m, incrementoMinimo: 2_000m,
            fechaInicio: ahora.AddHours(-3), fechaFin: ahora.AddMinutes(-5));
        subastaVencidaConGanador.Activar();

        var subastaVencidaDesierta = new Subasta(
            vendedor.Id, CategoriaTecnologia,
            "Teclado mecánico switches azules",
            "Teclado retroiluminado, sin uso. Esta subasta ya venció sin ofertas y el worker debería declararla desierta.",
            "https://picsum.photos/seed/teclado/600/400",
            precioBase: 25_000m, incrementoMinimo: 1_000m,
            fechaInicio: ahora.AddHours(-3), fechaFin: ahora.AddMinutes(-10));
        subastaVencidaDesierta.Activar();

        await context.Subastas.AddRangeAsync(
            subastaEstandar, subastaCritica, subastaProgramada,
            subastaVencidaConGanador, subastaVencidaDesierta);
        await context.SaveChangesAsync();

        var pujaSuperada = CrearPuja(subastaEstandar.Id, comprador2.Id, 40_000m, ahora.AddMinutes(-20));
        var pujaLider = CrearPuja(subastaEstandar.Id, comprador1.Id, 45_000m, ahora.AddMinutes(-10));
        var pujaGanadora = CrearPuja(subastaVencidaConGanador.Id, comprador2.Id, 60_000m, ahora.AddMinutes(-40));

        await context.Pujas.AddRangeAsync(pujaSuperada, pujaLider, pujaGanadora);
        await context.SaveChangesAsync();

        subastaEstandar.RegistrarNuevaPuja(pujaSuperada);
        subastaEstandar.RegistrarNuevaPuja(pujaLider);
        subastaVencidaConGanador.RegistrarNuevaPuja(pujaGanadora);

        billeteraComprador2.Retener(pujaSuperada.Monto);
        billeteraComprador2.Liberar(pujaSuperada.Monto);
        billeteraComprador1.Retener(pujaLider.Monto);
        billeteraComprador2.Retener(pujaGanadora.Monto);

        await context.TransaccionesLedger.AddRangeAsync(
            CrearMovimiento(billeteraVendedor.Id, TipoTransaccionLedger.Deposito, 10_000m,
                ahora.AddDays(-5), "Carga de saldo inicial", null),
            CrearMovimiento(billeteraComprador1.Id, TipoTransaccionLedger.Deposito, 200_000m,
                ahora.AddDays(-5), "Carga de saldo inicial", null),
            CrearMovimiento(billeteraComprador2.Id, TipoTransaccionLedger.Deposito, 120_000m,
                ahora.AddDays(-5), "Carga de saldo inicial", null),

            CrearMovimiento(billeteraComprador2.Id, TipoTransaccionLedger.Retencion, pujaSuperada.Monto,
                pujaSuperada.FechaPuja, $"Retención por puja en subasta #{subastaEstandar.Id}", subastaEstandar.Id),
            CrearMovimiento(billeteraComprador2.Id, TipoTransaccionLedger.Liberacion, pujaSuperada.Monto,
                pujaLider.FechaPuja, $"Liberación por superación en subasta #{subastaEstandar.Id}", subastaEstandar.Id),
            CrearMovimiento(billeteraComprador1.Id, TipoTransaccionLedger.Retencion, pujaLider.Monto,
                pujaLider.FechaPuja, $"Retención por puja en subasta #{subastaEstandar.Id}", subastaEstandar.Id),
            CrearMovimiento(billeteraComprador2.Id, TipoTransaccionLedger.Retencion, pujaGanadora.Monto,
                pujaGanadora.FechaPuja, $"Retención por puja en subasta #{subastaVencidaConGanador.Id}", subastaVencidaConGanador.Id));

        await context.SaveChangesAsync();
    }

    private const int CategoriaTecnologia = 1;
    private const int CategoriaVehiculos = 2;
    private const int CategoriaColeccionables = 3;
    private const int CategoriaIndumentaria = 4;

    private static Usuario CrearUsuario(string email, string nombre, string passwordHash, DateTime fecha) =>
        new()
        {
            Email = email,
            Nombre = nombre,
            PasswordHash = passwordHash,
            FechaRegistro = fecha.AddDays(-5)
        };

    private static Puja CrearPuja(int subastaId, int compradorId, decimal monto, DateTime fecha) =>
        new()
        {
            SubastaId = subastaId,
            CompradorId = compradorId,
            Monto = monto,
            FechaPuja = fecha
        };

    private static TransaccionLedger CrearMovimiento(
        int billeteraId, TipoTransaccionLedger tipo, decimal monto,
        DateTime fecha, string descripcion, int? subastaId) =>
        new()
        {
            BilleteraId = billeteraId,
            Tipo = tipo,
            Monto = monto,
            Fecha = fecha,
            Descripcion = descripcion,
            SubastaId = subastaId
        };
}
