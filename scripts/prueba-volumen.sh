#!/usr/bin/env bash
#
# Prueba de volumen: dispara múltiples requests en paralelo para estresar la API.
#
# Uso: ./prueba-volumen.sh [URL_BASE] [CANTIDAD_REQUESTS]

set -u

API="${1:-http://localhost:5058/api/v1}"
CANTIDAD="${2:-100}"

echo "== Iniciando prueba de estrés: $CANTIDAD requests simultáneos al catálogo =="

START_TIME=$(date +%s%N)

TMP_FILE="/tmp/subastaya_stress_results.txt"
> "$TMP_FILE"

# Disparamos todos los requests en background (&)
for i in $(seq 1 $CANTIDAD); do
    curl -s -o /dev/null -w "%{http_code}\n" "$API/auctions" >> "$TMP_FILE" &
done

# Esperamos a que terminen todos los curls
wait

END_TIME=$(date +%s%N)
TIEMPO_MS=$(( (END_TIME - START_TIME) / 1000000 ))

# Analizamos los resultados leyendo el archivo temporal
EXITOSOS=$(grep -c "200" "$TMP_FILE" || true)
FALLIDOS=$((CANTIDAD - EXITOSOS))

echo
echo "Prueba finalizada en ${TIEMPO_MS} milisegundos."
echo "✅ Requests exitosos: $EXITOSOS"
if [ "$FALLIDOS" -gt 0 ]; then
    echo "❌ Requests fallidos: $FALLIDOS"
else
    echo "¡Backend de acero! Ningún request fue rechazado bajo presión."
fi

rm -f "$TMP_FILE"
