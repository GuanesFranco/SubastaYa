#!/usr/bin/env bash
set -u

echo "== Script de Reset de Base de Datos (QA) =="

# 1. Validar que sqlcmd exista
if ! command -v sqlcmd &> /dev/null; then
    echo "❌ ERROR: 'sqlcmd' no está instalado o no está en el PATH."
    echo "Asegurate de instalar las herramientas de SQL Server Express."
    exit 1
fi

# 2. Validar que la API no esté corriendo (para no corromper la BD)
echo "Verificando si la API está corriendo en http://localhost:5058..."
if curl -s http://localhost:5058/api/v1/categories &> /dev/null; then
    echo "❌ ERROR: La API está encendida."
    echo "Por favor, apaga la API (Ctrl+C en la consola de .NET) antes de resetear la base de datos para evitar bloqueos por conexiones huérfanas."
    exit 1
fi

# 3. Eliminar la BD
echo "Eliminando la base de datos SubastaYaDB..."
sqlcmd -S "localhost\SQLEXPRESS" -E -Q "IF EXISTS(SELECT * FROM sys.databases WHERE name='SubastaYaDB') BEGIN ALTER DATABASE [SubastaYaDB] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [SubastaYaDB]; END"

if [ $? -ne 0 ]; then
    echo "❌ ERROR: Falló la eliminación de la base de datos."
    exit 1
fi

echo "✅ ÉXITO: La base de datos fue eliminada por completo."
echo ""
echo "⚠️  ATENCIÓN: La base de datos ahora no existe. Las tablas y los datos de prueba se sembrarán de forma limpia (DbInitializer) recién cuando levantes la API con 'dotnet run'."
