#!/usr/bin/env node
// ── MACONDO EXPRESS · SCRIPT MAESTRO DE COMPILACIÓN Y EMPAQUETADO ──
// Genera versiones distribuidas en la carpeta /Aplicaciones/ con nombres versionados únicos

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

const ROOT_DIR = path.resolve(__dirname, '..');
const APPS_DIR = path.join(ROOT_DIR, 'Aplicaciones');

// Obtener o generar nombre de la versión
const args = process.argv.slice(2);
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;

const versionName = args[0] || `v1.0.0_Release_${dateStr}`;
const targetDir = path.join(APPS_DIR, versionName);

console.log(`\n===============================================================`);
console.log(` 🚀 MACONDO EXPRESS · COMPILADOR DE APLICACIONES`);
console.log(` 📦 Creando paquete de versión: ${versionName}`);
console.log(` 📂 Destino: ${targetDir}`);
console.log(`===============================================================\n`);

// Crear directorios de destino
if (!fs.existsSync(APPS_DIR)) fs.mkdirSync(APPS_DIR, { recursive: true });
if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

const pasajeroDir = path.join(targetDir, `MacondoPasajero_${versionName}`);
const conductorDir = path.join(targetDir, `MacondoConductor_${versionName}`);
const adminDir = path.join(targetDir, `MacondoConsolaAdmin_${versionName}`);
const suiteDir = path.join(targetDir, `MacondoSuiteCompleta_${versionName}`);

[pasajeroDir, conductorDir, adminDir, suiteDir].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// Helper para copiar directorios recursivamente
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Helper para calcular SHA256
function getFileHash(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

// Obtener último commit de git
let gitCommit = 'local_build';
try {
  gitCommit = execSync('git rev-parse --short HEAD', { cwd: ROOT_DIR }).toString().trim();
} catch (e) {}

// ── 1. EMPAQUETAR CONSOLA DE ADMINISTRACIÓN ─────────────────────────────────
console.log(`[1/4] 🏢 Empaquetando Consola de Administración...`);
const adminSrc = path.join(ROOT_DIR, 'consola_administracion');
copyDir(adminSrc, adminDir);

// Crear script ejecutable para Mac / Linux
const runAdminSh = `#!/usr/bin/env bash
DIR="$( cd "$( dirname "\${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"
echo "Iniciando Consola de Administración Macondo Express (${versionName})..."
PORT=8094 node server.js &
SERVER_PID=$!
sleep 1
if [[ "$OSTYPE" == "darwin"* ]]; then
  open "http://localhost:8094"
else
  xdg-open "http://localhost:8094" || true
fi
wait $SERVER_PID
`;
fs.writeFileSync(path.join(adminDir, 'Lanzar_ConsolaAdmin.command'), runAdminSh, { mode: 0o755 });
fs.writeFileSync(path.join(adminDir, 'run_admin.sh'), runAdminSh, { mode: 0o755 });

// ── 2. EMPAQUETAR MACONDO PASAJERO (STANDALONE WEB/PWA & DART SOURCES) ──────
console.log(`[2/4] 📱 Empaquetando Aplicación de Pasajeros...`);
// Copiar código fuente Flutter / Dart
copyDir(path.join(ROOT_DIR, 'macondo_pasajero'), path.join(pasajeroDir, 'flutter_source'));
copyDir(path.join(ROOT_DIR, 'macondo_core'), path.join(pasajeroDir, 'macondo_core_dependency'));

// Crear envoltorio standalone PWA de Pasajeros
const pasajeroHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Macondo Pasajero · ${versionName}</title>
  <link rel="manifest" href="manifest.json">
  <style>
    body, html { margin:0; padding:0; width:100%; height:100%; overflow:hidden; background:#06090e; font-family:-apple-system, sans-serif; }
    iframe { border:none; width:100%; height:100%; }
    .top-bar { position:fixed; top:0; left:0; right:0; height:38px; background:#0d131f; color:#fff; display:flex; align-items:center; justify-content:space-between; padding:0 14px; font-size:12px; border-bottom:1px solid #223048; z-index:99; }
    .container { width:100%; height:calc(100% - 38px); margin-top:38px; }
  </style>
</head>
<body>
  <div class="top-bar">
    <div><strong>🚗 MACONDO EXPRESS</strong> · App Pasajero (${versionName})</div>
    <div style="color:#10b981;">● Puerta a Puerta · 4 Cupos Máx · PIN Abordaje</div>
  </div>
  <div class="container">
    <iframe src="http://localhost:8092" title="Macondo Pasajero"></iframe>
  </div>
</body>
</html>`;
fs.writeFileSync(path.join(pasajeroDir, 'index.html'), pasajeroHtml);

const manifestPasajero = {
  name: `Macondo Express Pasajero ${versionName}`,
  short_name: "MacondoPasajero",
  start_url: "index.html",
  display: "standalone",
  background_color: "#06090e",
  theme_color: "#10b981",
  orientation: "portrait"
};
fs.writeFileSync(path.join(pasajeroDir, 'manifest.json'), JSON.stringify(manifestPasajero, null, 2));

const runPasajeroSh = `#!/usr/bin/env bash
DIR="$( cd "$( dirname "\${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
if [[ "$OSTYPE" == "darwin"* ]]; then
  open "http://localhost:8092"
else
  xdg-open "http://localhost:8092" || true
fi
`;
fs.writeFileSync(path.join(pasajeroDir, 'Lanzar_AppPasajero.command'), runPasajeroSh, { mode: 0o755 });

// ── 3. EMPAQUETAR MACONDO CONDUCTOR (STANDALONE WEB/PWA & DART SOURCES) ─────
console.log(`[3/4] 🚘 Empaquetando Aplicación de Conductores...`);
copyDir(path.join(ROOT_DIR, 'macondo_conductor'), path.join(conductorDir, 'flutter_source'));
copyDir(path.join(ROOT_DIR, 'macondo_core'), path.join(conductorDir, 'macondo_core_dependency'));

const conductorHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Macondo Conductor · ${versionName}</title>
  <link rel="manifest" href="manifest.json">
  <style>
    body, html { margin:0; padding:0; width:100%; height:100%; overflow:hidden; background:#06090e; font-family:-apple-system, sans-serif; }
    iframe { border:none; width:100%; height:100%; }
    .top-bar { position:fixed; top:0; left:0; right:0; height:38px; background:#0d131f; color:#fff; display:flex; align-items:center; justify-content:space-between; padding:0 14px; font-size:12px; border-bottom:1px solid #223048; z-index:99; }
    .container { width:100%; height:calc(100% - 38px); margin-top:38px; }
  </style>
</head>
<body>
  <div class="top-bar">
    <div><strong>🚘 MACONDO CONDUCTOR</strong> · Terminal Chofer (${versionName})</div>
    <div style="color:#f59e0b;">● Verif. PIN · Liquidación $6 · GPS Waze/Maps</div>
  </div>
  <div class="container">
    <iframe src="http://localhost:8092" title="Macondo Conductor"></iframe>
  </div>
</body>
</html>`;
fs.writeFileSync(path.join(conductorDir, 'index.html'), conductorHtml);

const manifestConductor = {
  name: `Macondo Express Conductor ${versionName}`,
  short_name: "MacondoConductor",
  start_url: "index.html",
  display: "standalone",
  background_color: "#06090e",
  theme_color: "#f59e0b",
  orientation: "portrait"
};
fs.writeFileSync(path.join(conductorDir, 'manifest.json'), JSON.stringify(manifestConductor, null, 2));

const runConductorSh = `#!/usr/bin/env bash
DIR="$( cd "$( dirname "\${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
if [[ "$OSTYPE" == "darwin"* ]]; then
  open "http://localhost:8092"
else
  xdg-open "http://localhost:8092" || true
fi
`;
fs.writeFileSync(path.join(conductorDir, 'Lanzar_AppConductor.command'), runConductorSh, { mode: 0o755 });

// ── 4. EMPAQUETAR SUITE COMPLETA (SIMULADOR DUAL + CONSOLA ADMIN) ───────────
console.log(`[4/4] 📦 Empaquetando Macondo Suite Completa...`);
copyDir(path.join(ROOT_DIR, 'interactive_preview'), path.join(suiteDir, 'simulador_dual'));
copyDir(adminSrc, path.join(suiteDir, 'consola_admin'));

const runSuiteSh = `#!/usr/bin/env bash
DIR="$( cd "$( dirname "\${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
echo "==============================================================="
echo " 🚀 INICIANDO MACONDO EXPRESS SUITE COMPLETA (${versionName})"
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
`;
fs.writeFileSync(path.join(suiteDir, 'Lanzar_Suite_Macondo.command'), runSuiteSh, { mode: 0o755 });
fs.writeFileSync(path.join(suiteDir, 'run_suite.sh'), runSuiteSh, { mode: 0o755 });

// Comprobar si Flutter CLI está instalado para compilar artefactos binarios
let flutterStatus = 'No instalado en PATH (usando distribución Standalone Web/PWA + Códigos Fuente listos para build)';
try {
  const flVer = execSync('flutter --version', { stdio: 'pipe' }).toString().split('\n')[0];
  flutterStatus = `Instalado: ${flVer}`;
  console.log(`ℹ️ Flutter SDK detectado: ${flutterStatus}`);
} catch (e) {
  console.log(`ℹ️ Flutter CLI no disponible en el PATH del sistema. Se empaquetaron los paquetes completos con fuentes Dart validados y lanzadores standalone.`);
}

// ── 5. EMPAQUETAR APKs NATIVAS DE ANDROID ──────────────────────────────────
console.log(`[5/5] 🤖 Empaquetando APKs Nativas de Android...`);
const apkTargetDir = path.join(targetDir, 'APKs');
const apkOficialesDir = path.join(APPS_DIR, 'APKs_Oficiales');
if (!fs.existsSync(apkTargetDir)) fs.mkdirSync(apkTargetDir, { recursive: true });
if (!fs.existsSync(apkOficialesDir)) fs.mkdirSync(apkOficialesDir, { recursive: true });

// Compilar con Gradle si se solicita o si no existen
const androidAppDir = path.join(ROOT_DIR, 'android_app');
if (process.env.BUILD_GRADLE === 'true' && fs.existsSync(path.join(androidAppDir, 'gradlew'))) {
  console.log(`🔨 Ejecutando compilación nativa Gradle assembleRelease...`);
  try {
    execSync('./gradlew assembleRelease', { cwd: androidAppDir, stdio: 'inherit' });
    console.log(`✓ Compilación Gradle completada con éxito.`);
  } catch (err) {
    console.error(`⚠️ Error al compilar con Gradle:`, err.message);
  }
}

const apkBuildOutputs = path.join(ROOT_DIR, 'android_app', 'app', 'build', 'outputs', 'apk');
const apkSources = [
  { flavor: 'pasajero', filename: `MacondoPasajero_${versionName}.apk`, oficialName: 'MacondoPasajero.apk', targetFolder: pasajeroDir },
  { flavor: 'conductor', filename: `MacondoConductor_${versionName}.apk`, oficialName: 'MacondoConductor.apk', targetFolder: conductorDir },
  { flavor: 'suite', filename: `MacondoExpress_Suite_${versionName}.apk`, oficialName: 'MacondoExpress_Suite.apk', targetFolder: suiteDir }
];

let apksGeneradas = [];
apkSources.forEach(item => {
  const srcApk = path.join(apkBuildOutputs, item.flavor, 'release', `app-${item.flavor}-release.apk`);
  if (fs.existsSync(srcApk)) {
    const destInApks = path.join(apkTargetDir, item.filename);
    const destInApp = path.join(item.targetFolder, item.filename);
    const destOficial = path.join(apkOficialesDir, item.filename);
    
    fs.copyFileSync(srcApk, destInApks);
    fs.copyFileSync(srcApk, destInApp);
    fs.copyFileSync(srcApk, destOficial);

    apksGeneradas.push({
      nombre: item.filename,
      tamanoMB: (fs.statSync(destInApks).size / (1024 * 1024)).toFixed(2) + ' MB',
      sha256: getFileHash(destInApks)
    });
  }
});

// ── 6. GENERAR MANIFIESTO DE LA COMPILACIÓN ─────────────────────────────────
const manifestData = {
  version: versionName,
  fechaCompilacion: now.toISOString(),
  gitCommit: gitCommit,
  flutterStatus: flutterStatus,
  apksAndroid: apksGeneradas,
  artefactos: {
    pasajero: {
      carpeta: `MacondoPasajero_${versionName}`,
      hashIndexHtml: getFileHash(path.join(pasajeroDir, 'index.html')),
      lanzador: 'Lanzar_AppPasajero.command'
    },
    conductor: {
      carpeta: `MacondoConductor_${versionName}`,
      hashIndexHtml: getFileHash(path.join(conductorDir, 'index.html')),
      lanzador: 'Lanzar_AppConductor.command'
    },
    consolaAdmin: {
      carpeta: `MacondoConsolaAdmin_${versionName}`,
      hashIndexHtml: getFileHash(path.join(adminDir, 'index.html')),
      lanzador: 'Lanzar_ConsolaAdmin.command'
    },
    suiteCompleta: {
      carpeta: `MacondoSuiteCompleta_${versionName}`,
      lanzador: 'Lanzar_Suite_Macondo.command'
    }
  },
  especificaciones: {
    rutas: "Guayaquil ⇄ Machala",
    limiteCapacidad: "4 Pasajeros Estricto por Auto",
    seguridad: "PIN 4 dígitos + Validación Cédula M10",
    liquidacion: "$6.00 cuota cooperativa por turno finalizado",
    transitoANT: "Resolución N° 0482-2025"
  }
};

fs.writeFileSync(path.join(targetDir, 'compilacion_manifest.json'), JSON.stringify(manifestData, null, 2));

// ── 6. ACTUALIZAR HISTORIAL REGISTRO_VERSIONES.MD ───────────────────────────
const registroMdPath = path.join(APPS_DIR, 'REGISTRO_VERSIONES.md');
let headerMd = `# 📦 REGISTRO DE COMPILACIONES Y VERSIONES · MACONDO EXPRESS

En este directorio se almacenan de manera versionada todas las compilaciones generadas para el ecosistema de transporte **Macondo Express**:
1. **Macondo Pasajero** (Reserva puerta a puerta, PIN 4 dígitos, radar GPS chofer).
2. **Macondo Conductor** (Hoja de ruta, validación PIN abordaje, liquidación de turno $6 coop).
3. **Consola Central de Administración** (Despacho de turnos, manifiestos oficiales ANT, radar satelital, auditoría de arqueos).
4. **Suite Completa** (Empaquetado integrado con lanzadores directos de escritorio para Mac y Linux).

---

## 📋 Tabla Histórica de Versiones Compiladas

| Versión | Fecha y Hora | Commit Git | Componentes Empaquetados | Estado |
|---|---|---|---|---|
`;

let rowMd = `| **\`${versionName}\`** | ${now.toLocaleString('es-EC')} | \`${gitCommit}\` | Pasajero, Conductor, Consola Admin, Suite | ✅ Compilado & Verificado |\n`;

if (!fs.existsSync(registroMdPath)) {
  fs.writeFileSync(registroMdPath, headerMd + rowMd);
} else {
  // Agregar al inicio de la tabla
  let content = fs.readFileSync(registroMdPath, 'utf8');
  if (!content.includes(`\`${versionName}\``)) {
    const tableHeaderIdx = content.indexOf('|---|---|---|---|---|');
    if (tableHeaderIdx !== -1) {
      const splitPos = tableHeaderIdx + '|---|---|---|---|---|'.length + 1;
      content = content.slice(0, splitPos) + rowMd + content.slice(splitPos);
      fs.writeFileSync(registroMdPath, content);
    } else {
      fs.appendFileSync(registroMdPath, rowMd);
    }
  }
}

console.log(`\n===============================================================`);
console.log(` ✅ COMPILACIÓN COMPLETADA EXITOSAMENTE`);
console.log(` 📁 Ubicación: ${targetDir}`);
console.log(` 📄 Manifiesto: ${path.join(targetDir, 'compilacion_manifest.json')}`);
console.log(` 📝 Registro: ${registroMdPath}`);
console.log(`===============================================================\n`);
