#!/usr/bin/env python3
"""
MACONDO EXPRESS · CLOUDFLARE TUNNEL DAEMON
Expone la Consola de Administración (puerto 8094) a Internet de forma segura
con HTTPS permanente de Cloudflare para acceso remoto desde cualquier lugar del mundo.
"""
import subprocess
import re
import json
import time
import os
import signal
import sys
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent
STATUS_FILE = WORKSPACE / "consola_administracion" / "tunnel_status.json"
LOG_FILE = WORKSPACE / "consola_administracion" / "tunnel.log"

def run_tunnel():
    STATUS_FILE.parent.mkdir(exist_ok=True)
    
    cmd = ["/usr/local/bin/cloudflared", "tunnel", "--url", "http://localhost:8094"]
    print(f"[Macondo Tunnel] Iniciando Cloudflare Tunnel en puerto 8094: {' '.join(cmd)}")

    with open(LOG_FILE, "w", encoding="utf-8") as log_f:
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )

        tunnel_url = None
        for line in proc.stdout:
            log_f.write(line)
            log_f.flush()
            if not tunnel_url:
                match = re.search(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com", line)
                if match:
                    tunnel_url = match.group(0)
                    print(f"[Macondo Tunnel] ✓ URL Pública activa: {tunnel_url}")
                    with open(STATUS_FILE, "w", encoding="utf-8") as sf:
                        json.dump({
                            "url": tunnel_url,
                            "service": "Macondo Express Administración",
                            "local_port": 8094,
                            "pid": proc.pid,
                            "started_at": time.strftime("%Y-%m-%d %H:%M:%S")
                        }, sf, indent=2)

        proc.wait()

def main():
    while True:
        try:
            run_tunnel()
        except Exception as e:
            print(f"[Macondo Tunnel] Error en daemon: {e}")
        time.sleep(5)

if __name__ == "__main__":
    main()
