#!/usr/bin/env bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
if [[ "$OSTYPE" == "darwin"* ]]; then
  open "http://localhost:8092"
else
  xdg-open "http://localhost:8092" || true
fi
