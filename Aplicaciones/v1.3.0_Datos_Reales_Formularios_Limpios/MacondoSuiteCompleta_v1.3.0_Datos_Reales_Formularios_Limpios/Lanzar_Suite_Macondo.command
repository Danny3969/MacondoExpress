#!/usr/bin/env bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
echo "==============================================================="
echo " 🚀 INICIANDO MACONDO EXPRESS SUITE COMPLETA (v1.3.0_Datos_Reales_Formularios_Limpios)"
echo "==============================================================="

# Lanzar Consola Admin en 8094
cd "$DIR/consola_admin"
PORT=8094 node server.js &
ADMIN_PID=$!

# Lanzar Simulador Dual en 8092
cd "$DIR/simulador_dual"
PORT=8092 npx serve -l 8092 -s . &
SIM_PID=$!

sleep 2
if [[ "$OSTYPE" == "darwin"* ]]; then
  open "http://localhost:8094"
  open "http://localhost:8092"
fi

echo "Presione CTRL+C para detener todos los servicios de Macondo Express."
wait $ADMIN_PID $SIM_PID
