#!/usr/bin/env bash
set -u

API="${1:-http://localhost:5058/api/v1}"
PASSWORD="Test1234!"

login() {
    curl -s -X POST "$API/sessions" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$1\",\"password\":\"$PASSWORD\"}" |
        grep -o '"token":"[^"]*"' | cut -d'"' -f4
}

echo "== Iniciando Prueba del Background Worker (Cierre Automático) =="

TOKEN_VENDEDOR="$(login vendedor@test.com)"
TOKEN_COMPRADOR="$(login comprador1@test.com)"

if [ -z "$TOKEN_VENDEDOR" ] || [ -z "$TOKEN_COMPRADOR" ]; then
    echo "ERROR: no se pudo obtener los tokens."
    exit 1
fi

# 1. Calculamos fechas (Inicio hace 1 día, Fin en 5 segundos)
# En Git Bash (Windows), el comando date es el de Linux.
AHORA_UTC=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Le sumamos 6 segundos a la fecha actual para el cierre
FIN_UTC=$(date -u -d "$AHORA_UTC + 6 seconds" +"%Y-%m-%dT%H:%M:%SZ")
INICIO_UTC=$(date -u -d "$AHORA_UTC - 1 day" +"%Y-%m-%dT%H:%M:%SZ")

echo "1. Creando subasta programada para cerrar en 6 segundos ($FIN_UTC)..."
CREACION=$(curl -s -X POST "$API/auctions" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN_VENDEDOR" \
    -d "{\"titulo\":\"Subasta Relampago\",\"descripcion\":\"Se cierra al toque\",\"precioBase\":1000,\"incrementoMinimo\":100,\"fechaInicio\":\"$INICIO_UTC\",\"fechaFin\":\"$FIN_UTC\",\"categoriaId\":1,\"urlImagen\":\"https://img.com\"}")

SUBASTA_ID="$(echo "$CREACION" | grep -o '"id":[0-9]*' | head -n 1 | cut -d':' -f2)"

if [ -z "$SUBASTA_ID" ]; then
    echo "❌ ERROR: No se pudo crear la subasta."
    echo "Respuesta de la API: $CREACION"
    exit 1
fi

echo "   Subasta creada OK (ID: $SUBASTA_ID)"

echo "2. El Comprador 1 realiza una puja de \$1500..."
curl -s -o /dev/null -X POST "$API/auctions/$SUBASTA_ID/bids" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN_COMPRADOR" \
    -d "{\"monto\":1500}"

echo "3. Esperando 10 segundos para darle tiempo al Background Worker a que barra y cierre la subasta..."
for i in {1..10}; do
    echo -n "."
    sleep 1
done
echo ""

echo "4. Verificando el nuevo estado de la subasta..."
ESTADO=$(curl -s "$API/auctions/$SUBASTA_ID" | grep -o '"estado":"[^"]*"' | cut -d'"' -f4)

if [ "$ESTADO" = "Finalizada" ]; then
    echo "✅ ÉXITO: El Background Worker detectó el vencimiento y la pasó a estado '$ESTADO' de forma automática."
else
    echo "❌ FALLÓ: La subasta sigue en estado '$ESTADO'. El Worker no la cerró."
fi

echo "== Prueba finalizada =="
