#!/usr/bin/env bash
#
# Prueba de concurrencia: dos pujas idénticas y simultáneas sobre la misma subasta.
# Una tiene que responder 201 Created y la otra 409 Conflict, gracias al control
# optimista por la columna Version.
#
# Uso:  ./prueba-concurrencia.sh [URL_BASE] [ID_SUBASTA]
#
set -u

API="${1:-http://localhost:5058/api/v1}"
SUBASTA_ID="${2:-1}"
PASSWORD="Test1234!"

login() {
    curl -s -X POST "$API/sessions" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$1\",\"password\":\"$PASSWORD\"}" |
        grep -o '"token":"[^"]*"' | cut -d'"' -f4
}

echo "== Autenticando a los dos compradores =="
TOKEN_1="$(login comprador1@test.com)"
TOKEN_2="$(login comprador2@test.com)"

if [ -z "$TOKEN_1" ] || [ -z "$TOKEN_2" ]; then
    echo "ERROR: no se pudo obtener el token. ¿Está levantada la API en $API?"
    exit 1
fi

echo "== Leyendo el estado de la subasta $SUBASTA_ID =="
DETALLE="$(curl -s "$API/auctions/$SUBASTA_ID")"
PRECIO="$(echo "$DETALLE" | grep -o '"precioActual":[0-9.]*' | cut -d':' -f2)"

if [ -z "$PRECIO" ]; then
    echo "ERROR: no se pudo leer la subasta $SUBASTA_ID."
    exit 1
fi

MONTO="$(awk -v p="$PRECIO" 'BEGIN { printf "%.2f", p + 5000 }')"
echo "   Precio actual: $PRECIO  ->  ambos van a pujar $MONTO"

pujar() {
    curl -s -o /dev/null -w "%{http_code}" \
        -X POST "$API/auctions/$SUBASTA_ID/bids" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $1" \
        -d "{\"monto\":$MONTO}"
}

echo "== Disparando las dos pujas en paralelo =="
pujar "$TOKEN_1" > /tmp/subastaya_puja_1 &
PID_1=$!
pujar "$TOKEN_2" > /tmp/subastaya_puja_2 &
PID_2=$!
wait $PID_1 $PID_2

CODIGO_1="$(cat /tmp/subastaya_puja_1)"
CODIGO_2="$(cat /tmp/subastaya_puja_2)"
rm -f /tmp/subastaya_puja_1 /tmp/subastaya_puja_2

echo "   comprador1 -> HTTP $CODIGO_1"
echo "   comprador2 -> HTTP $CODIGO_2"
echo

if { [ "$CODIGO_1" = "201" ] && [ "$CODIGO_2" = "409" ]; } ||
   { [ "$CODIGO_1" = "409" ] && [ "$CODIGO_2" = "201" ]; }; then
    echo "OK: una puja fue aceptada (201) y la otra rechazada por concurrencia (409)."
    exit 0
fi

if { [ "$CODIGO_1" = "201" ] && [ "$CODIGO_2" = "422" ]; } ||
   { [ "$CODIGO_1" = "422" ] && [ "$CODIGO_2" = "201" ]; }; then
    echo "OK (variante válida): una puja entró primero y la segunda llegó cuando el precio"
    echo "ya había subido, así que fue rechazada por monto insuficiente (422) en vez de 409."
    echo "El control de concurrencia igual hizo su trabajo: no se aceptaron las dos."
    exit 0
fi

echo "FALLO: se esperaba 201 + 409. Revisar el control optimista de Subasta.Version."
exit 1
