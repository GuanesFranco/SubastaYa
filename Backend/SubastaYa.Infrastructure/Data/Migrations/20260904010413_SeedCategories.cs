using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace SubastaYa.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class SeedCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Billeteras_Usuarios_UsuarioId",
                table: "Billeteras");

            migrationBuilder.InsertData(
                table: "Categorias",
                columns: new[] { "Id", "Nombre", "UrlIcono" },
                values: new object[,]
                {
                    { 1, "Tecnología", "https://example.com/icon-tech.png" },
                    { 2, "Vehículos", "https://example.com/icon-car.png" },
                    { 3, "Coleccionables", "https://example.com/icon-collect.png" }
                });

            migrationBuilder.AddForeignKey(
                name: "FK_Billeteras_Usuarios_UsuarioId",
                table: "Billeteras",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Billeteras_Usuarios_UsuarioId",
                table: "Billeteras");

            migrationBuilder.DeleteData(
                table: "Categorias",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Categorias",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Categorias",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.AddForeignKey(
                name: "FK_Billeteras_Usuarios_UsuarioId",
                table: "Billeteras",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
