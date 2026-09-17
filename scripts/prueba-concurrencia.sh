#!/usr/bin/env bash
set -u

API="${1:-http://localhost:5058/api/v1}"
PASSWORD="Test1234!"

echo "== Iniciando Prueba de Concurrencia (Choque Optimista) =="

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

CHOQUES_DETECTADOS=0

for RONDA in 1 2 3; do
    echo "--- RONDA $RONDA ---"
    echo -n "1. Creando subasta nueva... "
    CREACION=$(curl -s -X POST "$API/auctions" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN_VEND" \
        -d "{\"titulo\":\"Choque Ronda $RONDA\",\"descripcion\":\"Test\",\"precioBase\":100,\"incrementoMinimo\":100,\"fechaInicio\":\"$INICIO_UTC\",\"fechaFin\":\"$FIN_UTC\",\"categoriaId\":1,\"urlImagen\":\"https://img.com\"}")
    
    SUBASTA_ID="$(echo "$CREACION" | grep -o '"id":[0-9]*' | head -n 1 | cut -d':' -f2)"
    echo "OK (ID: $SUBASTA_ID)"

    echo "2. Preparando 15 peticiones concurrentes simultáneas al mismo milisegundo..."
    
    TMP_DIR=$(mktemp -d)
    
    for i in {1..15}; do
        curl -s -w '%{http_code}\n' -o /dev/null -X POST "$API/auctions/$SUBASTA_ID/bids" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN_COMP" -d "{\"monto\":300}" > "$TMP_DIR/$i.txt" &
    done

    # Esperamos a que todas las peticiones terminen
    wait

    # Leemos todos los archivos juntos
    RESULTADOS=$(cat "$TMP_DIR"/*.txt)
    rm -rf "$TMP_DIR"

    COUNT_201=$(echo "$RESULTADOS" | grep -c "201" || true)
    COUNT_409=$(echo "$RESULTADOS" | grep -c "409" || true)
    COUNT_422=$(echo "$RESULTADOS" | grep -c "422" || true)
    COUNT_500=$(echo "$RESULTADOS" | grep -c "500" || true)

    echo "Resultados Ronda $RONDA:"
    echo " - 201 (Aceptada): $COUNT_201"
    echo " - 409 (Choque Concurrencia): $COUNT_409"
    echo " - 422 (Rebotada Normal): $COUNT_422"
    
    if [ "$COUNT_500" -gt 0 ]; then
        echo "❌ ERROR FATAL: Aparecieron respuestas 500 (Deadlock en BD u otro error de servidor)."
        exit 1
    fi

    if [ "$COUNT_201" -ne 1 ]; then
        echo "❌ ERROR: Debió registrarse exactamente 1 puja, pero se registraron $COUNT_201."
        exit 1
    fi

    if [ "$COUNT_409" -gt 0 ]; then
        echo "✅ CHOQUE CONFIRMADO: El control optimista atajó $COUNT_409 peticiones."
        CHOQUES_DETECTADOS=$((CHOQUES_DETECTADOS + 1))
        break # Si ya chocó, podemos cortar el bucle
    else
        echo "⚠️  No hubo choques optimistas (409) en esta ronda, fueron todos rechazados normales (422) por velocidad de CPU."
    fi
    echo ""
done

if [ "$CHOQUES_DETECTADOS" -eq 0 ]; then
    echo "❌ FALLO DE SUITE: Después de 3 rondas, no logramos generar un conflicto de concurrencia optimista (409)."
    exit 1
fi

echo "✅ ÉXITO: El sistema previene corrupciones y bloqueos optimistas correctamente bajo estrés."
exit 0
