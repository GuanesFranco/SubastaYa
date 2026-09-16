#!/usr/bin/env bash
set -u

API="${1:-http://localhost:5058/api/v1}"
PASSWORD="Test1234!"

echo "== Iniciando Prueba de Paginación y Filtros (Rendimiento) =="

TOKEN_VEND="$(curl -s -X POST "$API/sessions" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"vendedor@test.com\",\"password\":\"$PASSWORD\"}" | \
    grep -o '"token":"[^"]*"' | cut -d'"' -f4)"

AHORA_UTC=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
FIN_UTC=$(date -u -d "$AHORA_UTC + 10 days" +"%Y-%m-%dT%H:%M:%SZ")
INICIO_UTC=$(date -u -d "$AHORA_UTC - 10 days" +"%Y-%m-%dT%H:%M:%SZ")

echo -n "1. Sembrando 30 subastas en la base de datos para la prueba..."
for i in {1..30}; do
    curl -s -o /dev/null -X POST "$API/auctions" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN_VEND" \
        -d "{\"titulo\":\"Subasta Lote $i\",\"descripcion\":\"Test Paginacion\",\"precioBase\":100,\"incrementoMinimo\":10,\"fechaInicio\":\"$INICIO_UTC\",\"fechaFin\":\"$FIN_UTC\",\"categoriaId\":1,\"urlImagen\":\"https://img.com\"}"
    echo -n "."
done
echo " LISTO."

echo "2. Solicitando Página 1 (Tamaño: 10)..."
PAGE_1=$(curl -s "$API/auctions?page=1&pageSize=10")
# Contamos cuántas veces aparece "id" dentro de la respuesta para saber cuántos items vinieron
COUNT_1=$(echo "$PAGE_1" | grep -o '"id":' | wc -l)

echo "3. Solicitando Página 2 (Tamaño: 10)..."
PAGE_2=$(curl -s "$API/auctions?page=2&pageSize=10")
COUNT_2=$(echo "$PAGE_2" | grep -o '"id":' | wc -l)

# En la query le pasamos estado=1 (Activa) y la Busqueda
echo "4. Buscando por palabra clave 'Lote 15'..."
SEARCH=$(curl -s "$API/auctions?Busqueda=Lote%2015&page=1&pageSize=10")
COUNT_SEARCH=$(echo "$SEARCH" | grep -o '"id":' | wc -l)

echo ""
echo "== Resultados =="
echo "📦 Página 1 devolvió: $COUNT_1 items (Esperado: 10)"
echo "📦 Página 2 devolvió: $COUNT_2 items (Esperado: 10)"
echo "🔍 Búsqueda 'Lote 15' devolvió: $COUNT_SEARCH items (Esperado: 1)"
echo ""

if [ "$COUNT_1" -eq 10 ] && [ "$COUNT_2" -eq 10 ] && [ "$COUNT_SEARCH" -ge 1 ]; then
    echo "✅ ÉXITO: El motor de paginación de SQL Server funciona impecable."
else
    echo "❌ FALLÓ: La paginación trajo números inesperados."
fi
