#!/usr/bin/env bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"
echo "Iniciando Consola de Administración Macondo Express (v1.6.0_Autenticacion_y_Registro_Completo)..."
PORT=8094 node server.js &
SERVER_PID=$!
sleep 1
if [[ "$OSTYPE" == "darwin"* ]]; then
  open "http://localhost:8094"
else
  xdg-open "http://localhost:8094" || true
fi
wait $SERVER_PID
