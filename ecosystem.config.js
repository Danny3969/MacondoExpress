module.exports = {
  apps: [
    {
      name: "macondo-server",
      cwd: "/Users/contabilidad/.gemini/antigravity-ide/scratch/MacondoExpress/consola_administracion",
      script: "server.js",
      env: {
        PORT: 8094
      },
      watch: false,
      autorestart: true,
      max_restarts: 10
    },
    {
      name: "macondo-tunnel",
      cwd: "/Users/contabilidad/.gemini/antigravity-ide/scratch/MacondoExpress",
      script: "macondo_tunnel_daemon.py",
      interpreter: "/Users/contabilidad/.gemini/antigravity-ide/scratch/Alberth/venv/bin/python3",
      watch: false,
      autorestart: true,
      max_restarts: 10
    }
  ]
};
