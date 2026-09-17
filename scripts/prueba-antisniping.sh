#!/usr/bin/env bash
set -u

API="${1:-http://localhost:5058/api/v1}"
PASSWORD="Test1234!"

echo "== Iniciando Prueba de Anti-Sniping =="

TOKEN_VEND="$(curl -s -X POST "$API/sessions" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"vendedor@test.com\",\"password\":\"$PASSWORD\"}" | \
    grep -o '"token":"[^"]*"' | cut -d'"' -f4)"

TOKEN_COMP="$(curl -s -X POST "$API/sessions" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"comprador1@test.com\",\"password\":\"$PASSWORD\"}" | \
    grep -o '"token":"[^"]*"' | cut -d'"' -f4)"

AHORA_UTC=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
INICIO_UTC=$(date -u -d "$AHORA_UTC - 1 hour" +"%Y-%m-%dT%H:%M:%SZ")
# Se vence en 45 segundos, dentro del último minuto
FIN_UTC=$(date -u -d "$AHORA_UTC + 45 seconds" +"%Y-%m-%dT%H:%M:%SZ")

echo -n "1. Creando subasta programada para cerrar en 45 segundos... "
CREACION=$(curl -s -X POST "$API/auctions" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN_VEND" \
    -d "{\"titulo\":\"Subasta Sniping\",\"descripcion\":\"Test\",\"precioBase\":100,\"incrementoMinimo\":10,\"fechaInicio\":\"$INICIO_UTC\",\"fechaFin\":\"$FIN_UTC\",\"categoriaId\":1,\"urlImagen\":\"https://img.com\"}")

SUBASTA_ID="$(echo "$CREACION" | grep -o '"id":[0-9]*' | head -n 1 | cut -d':' -f2)"
echo "OK (ID: $SUBASTA_ID)"

if [ -z "$SUBASTA_ID" ]; then
    echo "❌ ERROR: No se pudo crear."
    exit 1
fi

echo "2. Obteniendo fecha original de la API..."
GET_ANTES=$(curl -s "$API/auctions/$SUBASTA_ID")
FECHA_ANTES=$(echo "$GET_ANTES" | grep -o '"fechaFin":"[^"]*"' | cut -d'"' -f4)
echo "   Fecha original: $FECHA_ANTES"

echo "3. Pujando para activar el anti-sniping..."
curl -s -o /dev/null -X POST "$API/auctions/$SUBASTA_ID/bids" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN_COMP" -d "{\"monto\":150}"

echo "4. Obteniendo fecha extendida de la API..."
GET_DESPUES=$(curl -s "$API/auctions/$SUBASTA_ID")
FECHA_DESPUES=$(echo "$GET_DESPUES" | grep -o '"fechaFin":"[^"]*"' | cut -d'"' -f4)
echo "   Nueva fecha: $FECHA_DESPUES"

# Convertimos ambas fechas de la API a Unix Epoch (segundos) y restamos
SEC_ANTES=$(date -d "$FECHA_ANTES" +%s)
SEC_DESPUES=$(date -d "$FECHA_DESPUES" +%s)
DIFERENCIA=$((SEC_DESPUES - SEC_ANTES))

echo "   Diferencia agregada: $DIFERENCIA segundos"

if [ "$DIFERENCIA" -eq 120 ]; then
    echo "✅ ÉXITO: El sistema sumó exactamente 120 segundos (2 minutos) a la fecha de cierre."
    exit 0
else
    echo "❌ FALLÓ: Se esperaba que sumara 120s, pero sumó $DIFERENCIA."
    exit 1
fi
