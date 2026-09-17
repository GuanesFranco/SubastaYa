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

get_saldo() {
    local TOKEN=$1
    curl -s -X GET "$API/wallets/me" \
        -H "Authorization: Bearer $TOKEN" | grep -o '"saldoDisponible":[0-9.]*' | cut -d':' -f2
}

echo "== Iniciando Prueba de Integridad del Ledger (Billetera) =="

TOKEN_VEND="$(login vendedor@test.com)"
TOKEN_C1="$(login comprador1@test.com)"
TOKEN_C2="$(login comprador2@test.com)"

if [ -z "$TOKEN_C1" ] || [ -z "$TOKEN_C2" ]; then
    echo "❌ ERROR: Falló el login."
    exit 1
fi

SALDO_C1_INICIAL=$(get_saldo "$TOKEN_C1")
SALDO_C2_INICIAL=$(get_saldo "$TOKEN_C2")

echo "💰 Saldo Inicial Comprador 1: \$$SALDO_C1_INICIAL"
echo "💰 Saldo Inicial Comprador 2: \$$SALDO_C2_INICIAL"

echo -n "1. Creando subasta de prueba... "
AHORA_UTC=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
FIN_UTC=$(date -u -d "$AHORA_UTC + 1 hour" +"%Y-%m-%dT%H:%M:%SZ")
INICIO_UTC=$(date -u -d "$AHORA_UTC - 1 hour" +"%Y-%m-%dT%H:%M:%SZ")

CREACION=$(curl -s -X POST "$API/auctions" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN_VEND" \
    -d "{\"titulo\":\"Prueba Ledger\",\"descripcion\":\"Test de billeteras\",\"precioBase\":100,\"incrementoMinimo\":100,\"fechaInicio\":\"$INICIO_UTC\",\"fechaFin\":\"$FIN_UTC\",\"categoriaId\":1,\"urlImagen\":\"https://img.com\"}")

SUBASTA_ID="$(echo "$CREACION" | grep -o '"id":[0-9]*' | head -n 1 | cut -d':' -f2)"
echo "OK (ID: $SUBASTA_ID)"

echo "2. Round 1: C1 puja \$200 (Se le retienen \$200 a C1)"
R1=$(curl -s -w '%{http_code}' -o /dev/null -X POST "$API/auctions/$SUBASTA_ID/bids" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN_C1" -d "{\"monto\":200}")

echo "3. Round 2: C2 puja \$300 (Se le retienen \$300 a C2 y se le devuelven los \$200 a C1)"
R2=$(curl -s -w '%{http_code}' -o /dev/null -X POST "$API/auctions/$SUBASTA_ID/bids" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN_C2" -d "{\"monto\":300}")

echo "4. Round 3: C1 contraataca y puja \$400 (Se le retienen \$400 a C1 y se le devuelven los \$300 a C2)"
R3=$(curl -s -w '%{http_code}' -o /dev/null -X POST "$API/auctions/$SUBASTA_ID/bids" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN_C1" -d "{\"monto\":400}")

if [ "$R1" -ne 201 ] || [ "$R2" -ne 201 ] || [ "$R3" -ne 201 ]; then
    echo "❌ ERROR: Una de las pujas falló en insertarse (R1: $R1, R2: $R2, R3: $R3)."
    exit 1
fi

echo "5. Consultando saldos finales..."
SALDO_C1_FINAL=$(get_saldo "$TOKEN_C1")
SALDO_C2_FINAL=$(get_saldo "$TOKEN_C2")

echo ""
echo "💰 Saldo Final Comprador 1: \$$SALDO_C1_FINAL"
echo "💰 Saldo Final Comprador 2: \$$SALDO_C2_FINAL"
echo ""

# Usamos awk para comparar matemáticamente los saldos decimales
MATCH_C1=$(awk -v inicial="$SALDO_C1_INICIAL" -v final="$SALDO_C1_FINAL" 'BEGIN { if(final == inicial - 400) print 1; else print 0}')
MATCH_C2=$(awk -v inicial="$SALDO_C2_INICIAL" -v final="$SALDO_C2_FINAL" 'BEGIN { if(final == inicial) print 1; else print 0}')

if [ "$MATCH_C1" -eq 1 ] && [ "$MATCH_C2" -eq 1 ]; then
    echo "✅ ÉXITO: El Ledger retuvo e hizo los refunds con exactitud centesimal."
    exit 0
else
    echo "❌ FALLÓ: Los números de la billetera no cuadran matemáticamente."
    exit 1
fi
