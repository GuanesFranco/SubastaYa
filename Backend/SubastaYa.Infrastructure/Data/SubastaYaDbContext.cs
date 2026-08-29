using Microsoft.EntityFrameworkCore;
using SubastaYa.Domain.Entities;
using SubastaYa.Domain.Enums;

namespace SubastaYa.Infrastructure.Data;

public class SubastaYaDbContext : DbContext
{
    public SubastaYaDbContext(DbContextOptions<SubastaYaDbContext> options)
        : base(options)
    {
    }

    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Billetera> Billeteras => Set<Billetera>();
    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Subasta> Subastas => Set<Subasta>();
    public DbSet<Puja> Pujas => Set<Puja>();
    public DbSet<TransaccionLedger> TransaccionesLedger => Set<TransaccionLedger>();
    public DbSet<AuditoriaLog> AuditoriaLogs => Set<AuditoriaLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.Property(u => u.Email).IsRequired();
            entity.HasIndex(u => u.Email).IsUnique();

            entity.HasOne(u => u.Billetera)
                .WithOne(b => b.Usuario)
                .HasForeignKey<Billetera>(b => b.UsuarioId);

            entity.HasMany(u => u.SubastasPublicadas)
                .WithOne(s => s.Vendedor)
                .HasForeignKey(s => s.VendedorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(u => u.Pujas)
                .WithOne(p => p.Comprador)
                .HasForeignKey(p => p.CompradorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Billetera>(entity =>
        {
            entity.Property(b => b.Version).IsConcurrencyToken();

            entity.HasMany(b => b.Movimientos)
                .WithOne(t => t.Billetera)
                .HasForeignKey(t => t.BilleteraId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Categoria>(entity =>
        {
            entity.HasMany(c => c.Subastas)
                .WithOne(s => s.Categoria)
                .HasForeignKey(s => s.CategoriaId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Subasta>(entity =>
        {
            entity.Property(s => s.Estado).HasConversion<string>();

            entity.Property(s => s.Version).IsConcurrencyToken();

            entity.HasOne(s => s.Vendedor)
                .WithMany(u => u.SubastasPublicadas)
                .HasForeignKey(s => s.VendedorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(s => s.GanadorUsuario)
                .WithMany()
                .HasForeignKey(s => s.GanadorUsuarioId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(s => s.Categoria)
                .WithMany(c => c.Subastas)
                .HasForeignKey(s => s.CategoriaId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(s => s.PujaLider)
                .WithMany()
                .HasForeignKey(s => s.PujaLiderId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(s => s.Pujas)
                .WithOne(p => p.Subasta)
                .HasForeignKey(p => p.SubastaId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Puja>(entity =>
        {
            entity.HasOne(p => p.Comprador)
                .WithMany(u => u.Pujas)
                .HasForeignKey(p => p.CompradorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<TransaccionLedger>(entity =>
        {
            entity.Property(t => t.Tipo).HasConversion<string>();

            entity.HasOne(t => t.Subasta)
                .WithMany()
                .HasForeignKey(t => t.SubastaId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AuditoriaLog>(entity =>
        {
            entity.Property(a => a.DetalleJson).HasColumnType("jsonb");

            entity.HasOne(a => a.Usuario)
                .WithMany()
                .HasForeignKey(a => a.UsuarioId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}