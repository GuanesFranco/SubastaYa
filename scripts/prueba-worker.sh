#!/usr/bin/env bash
set -u

API="${1:-http://localhost:5058/api/v1}"
PASSWORD="Test1234!"

echo "== Iniciando Prueba del Background Worker (Cierre Automático) =="

TOKEN_VEND="$(curl -s -X POST "$API/sessions" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"vendedor@test.com\",\"password\":\"$PASSWORD\"}" | \
    grep -o '"token":"[^"]*"' | cut -d'"' -f4)"

AHORA_UTC=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
INICIO_UTC=$(date -u -d "$AHORA_UTC - 1 hour" +"%Y-%m-%dT%H:%M:%SZ")
FIN_UTC=$(date -u -d "$AHORA_UTC + 5 seconds" +"%Y-%m-%dT%H:%M:%SZ")

echo -n "1. Creando subasta programada para cerrar en 5 segundos... "
CREACION=$(curl -s -X POST "$API/auctions" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN_VEND" \
    -d "{\"titulo\":\"Subasta Relampago\",\"descripcion\":\"Test\",\"precioBase\":100,\"incrementoMinimo\":10,\"fechaInicio\":\"$INICIO_UTC\",\"fechaFin\":\"$FIN_UTC\",\"categoriaId\":1,\"urlImagen\":\"https://img.com\"}")

SUBASTA_ID="$(echo "$CREACION" | grep -o '"id":[0-9]*' | head -n 1 | cut -d':' -f2)"
echo "OK (ID: $SUBASTA_ID)"

if [ -z "$SUBASTA_ID" ]; then
    echo "❌ ERROR: No se pudo crear."
    exit 1
fi

echo "2. Esperando a que el worker cierre la subasta (polling máximo 30 segundos)..."

for i in {1..15}; do
    ESTADO=$(curl -s "$API/auctions/$SUBASTA_ID" | grep -o '"estado":"[^"]*"' | cut -d'"' -f4)
    if [ "$ESTADO" = "Desierta" ]; then
        echo ""
        echo "✅ ÉXITO: El Worker la cerró en estado '$ESTADO' a los $((i*2)) segundos."
        exit 0
    fi
    echo -n "."
    sleep 2
done

echo ""
echo "❌ FALLÓ: Pasaron 30 segundos y la subasta sigue en estado '$ESTADO'."
exit 1
