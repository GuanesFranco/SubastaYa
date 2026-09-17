#!/usr/bin/env bash

echo "============================================="
echo "   ORQUESTADOR DE QA: SUBASTAYA TEST SUITE"
echo "============================================="
echo ""
echo "Asegurate de haber ejecutado reset-db.sh y haber levantado la API antes de correr esto."
echo ""

SCRIPTS=(
    "prueba-concurrencia.sh"
    "prueba-volumen.sh"
    "prueba-reglas-negocio.sh"
    "prueba-worker.sh"
    "prueba-antisniping.sh"
    "prueba-ledger.sh"
    "prueba-paginacion.sh"
)

declare -A RESULTADOS
FALLOS=0

for SCRIPT in "${SCRIPTS[@]}"; do
    echo "============================================="
    echo "▶ EJECUTANDO: $SCRIPT"
    echo "============================================="
    
    # Damos permisos por las dudas
    chmod +x "scripts/$SCRIPT"
    
    # Ejecutamos el script
    ./scripts/$SCRIPT
    EXIT_CODE=$?
    
    if [ $EXIT_CODE -eq 0 ]; then
        RESULTADOS["$SCRIPT"]="✅ PASÓ"
    else
        RESULTADOS["$SCRIPT"]="❌ FALLÓ"
        FALLOS=$((FALLOS + 1))
    fi
    echo ""
done

echo "============================================="
echo "               RESUMEN FINAL                 "
echo "============================================="
for SCRIPT in "${SCRIPTS[@]}"; do
    printf "%-30s %s\n" "$SCRIPT" "${RESULTADOS[$SCRIPT]}"
done
echo "============================================="

if [ $FALLOS -gt 0 ]; then
    echo "❌ LA SUITE DE PRUEBAS FALLÓ ($FALLOS scripts con errores)."
    exit 1
else
    echo "✅ LA SUITE DE PRUEBAS PASÓ AL 100%. SISTEMA ESTABLE."
    exit 0
fi
