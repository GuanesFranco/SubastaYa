#!/usr/bin/env bash
set -u

API="${1:-http://localhost:5058/api/v1}"
PASSWORD="Test1234!"

echo "== Iniciando Prueba de Reglas de Negocio y Seguridad =="

# 1. Login de Vendedor
TOKEN_VEND="$(curl -s -X POST "$API/sessions" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"vendedor@test.com\",\"password\":\"$PASSWORD\"}" | \
    grep -o '"token":"[^"]*"' | cut -d'"' -f4)"

# 2. Login de Comprador
TOKEN_COMP="$(curl -s -X POST "$API/sessions" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"comprador1@test.com\",\"password\":\"$PASSWORD\"}" | \
    grep -o '"token":"[^"]*"' | cut -d'"' -f4)"

AHORA_UTC=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
FIN_UTC=$(date -u -d "$AHORA_UTC + 10 days" +"%Y-%m-%dT%H:%M:%SZ")
INICIO_UTC=$(date -u -d "$AHORA_UTC - 10 days" +"%Y-%m-%dT%H:%M:%SZ")

echo -n "1. Creando subasta de prueba... "
CREACION=$(curl -s -X POST "$API/auctions" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN_VEND" \
    -d "{\"titulo\":\"Prueba Negocio\",\"descripcion\":\"Test\",\"precioBase\":100,\"incrementoMinimo\":100,\"fechaInicio\":\"$INICIO_UTC\",\"fechaFin\":\"$FIN_UTC\",\"categoriaId\":1,\"urlImagen\":\"https://img.com\"}")

SUBASTA_ID="$(echo "$CREACION" | grep -o '"id":[0-9]*' | head -n 1 | cut -d':' -f2)"
echo "OK (ID: $SUBASTA_ID)"

if [ -z "$SUBASTA_ID" ]; then
    echo "❌ ERROR: No se pudo crear la subasta."
    exit 1
fi

FALLOS=0

echo "2. Probando seguridad: Pujar sin token JWT"
C1=$(curl -s -w '%{http_code}' -o /dev/null -X POST "$API/auctions/$SUBASTA_ID/bids" -H "Content-Type: application/json" -d "{\"monto\":200}")
if [ "$C1" -eq 401 ]; then
    echo "   ✅ OK: Bloqueado (401 Unauthorized)"
else
    echo "   ❌ ERROR: Se esperaba 401, devolvió $C1"
    FALLOS=1
fi

echo "3. Probando incremento mínimo: Pujar \$110 (Mínimo es 200)"
C2=$(curl -s -w '%{http_code}' -o /dev/null -X POST "$API/auctions/$SUBASTA_ID/bids" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN_COMP" -d "{\"monto\":110}")
if [ "$C2" -eq 422 ]; then
    echo "   ✅ OK: Bloqueado (422 Unprocessable Entity)"
else
    echo "   ❌ ERROR: Se esperaba 422, devolvió $C2"
    FALLOS=1
fi

echo "4. Probando trampa: Vendedor puja en su propia subasta"
C3=$(curl -s -w '%{http_code}' -o /dev/null -X POST "$API/auctions/$SUBASTA_ID/bids" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN_VEND" -d "{\"monto\":200}")
if [ "$C3" -eq 400 ]; then
    echo "   ✅ OK: Bloqueado (400 Bad Request)"
else
    echo "   ❌ ERROR: Se esperaba 400, devolvió $C3"
    FALLOS=1
fi

echo "5. Probando fondos: Pujar más plata de la que tiene (\$9999999)"
C4=$(curl -s -w '%{http_code}' -o /dev/null -X POST "$API/auctions/$SUBASTA_ID/bids" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN_COMP" -d "{\"monto\":9999999}")
if [ "$C4" -eq 422 ]; then
    echo "   ✅ OK: Bloqueado (422 Unprocessable Entity)"
else
    echo "   ❌ ERROR: Se esperaba 422, devolvió $C4"
    FALLOS=1
fi

echo "== Conclusión =="
if [ "$FALLOS" -eq 0 ]; then
    echo "✅ ÉXITO: El dominio validó perfectamente todas las reglas."
    exit 0
else
    echo "❌ FALLÓ: Al menos una regla de negocio fue evadida o devolvió el código incorrecto."
    exit 1
fi
