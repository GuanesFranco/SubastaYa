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

echo "== Iniciando Suite de Pruebas de Reglas de Negocio =="

TOKEN_VENDEDOR="$(login vendedor@test.com)"
TOKEN_SECO="$(login sinfondos@test.com)"

if [ -z "$TOKEN_VENDEDOR" ] || [ -z "$TOKEN_SECO" ]; then
    echo "ERROR: no se pudo obtener los tokens. Revisá que la API esté levantada."
    exit 1
fi

echo -n "1. Creando subasta de prueba... "
CREACION=$(curl -s -X POST "$API/auctions" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN_VENDEDOR" \
    -d "{\"titulo\":\"Test Negocio\",\"descripcion\":\"Test\",\"precioBase\":1000,\"incrementoMinimo\":100,\"fechaInicio\":\"2020-01-01T00:00:00Z\",\"fechaFin\":\"2030-01-01T00:00:00Z\",\"categoriaId\":1,\"urlImagen\":\"https://img.com\"}")

SUBASTA_ID="$(echo "$CREACION" | grep -o '"id":[0-9]*' | head -n 1 | cut -d':' -f2)"
if [ -z "$SUBASTA_ID" ]; then
    echo "ERROR"
    exit 1
fi
echo "OK (ID: $SUBASTA_ID)"

echo -n "2. Prueba: Pujar sin estar logueado -> "
CODE_401=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auctions/$SUBASTA_ID/bids" -H "Content-Type: application/json" -d "{\"monto\":2000}")
if [ "$CODE_401" = "401" ]; then echo "✅ OK (401)"; else echo "❌ FALLÓ (Devolvió $CODE_401)"; fi

echo -n "3. Prueba: Pujar por debajo del mínimo (Ej: \$1050 cuando pide 1100) -> "
CODE_MIN=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auctions/$SUBASTA_ID/bids" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN_SECO" -d "{\"monto\":1050}")
if [[ "$CODE_MIN" == 4* ]]; then echo "✅ OK (Rechazado con $CODE_MIN)"; else echo "❌ FALLÓ (Devolvió $CODE_MIN)"; fi

echo -n "4. Prueba: Vendedor puja en su propia subasta -> "
CODE_VEND=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auctions/$SUBASTA_ID/bids" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN_VENDEDOR" -d "{\"monto\":2000}")
if [[ "$CODE_VEND" == 4* ]]; then echo "✅ OK (Rechazado con $CODE_VEND)"; else echo "❌ FALLÓ (Devolvió $CODE_VEND)"; fi

echo -n "5. Prueba: Pujar sin fondos suficientes (\$100.000) -> "
CODE_FONDOS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auctions/$SUBASTA_ID/bids" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN_SECO" -d "{\"monto\":100000}")
if [[ "$CODE_FONDOS" == 4* ]]; then echo "✅ OK (Rechazado con $CODE_FONDOS)"; else echo "❌ FALLÓ (Devolvió $CODE_FONDOS)"; fi

echo "== Pruebas finalizadas =="
