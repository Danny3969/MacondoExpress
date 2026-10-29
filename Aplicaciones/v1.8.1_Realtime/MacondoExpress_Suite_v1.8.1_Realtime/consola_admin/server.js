// ── MACONDO EXPRESS · SERVIDOR CENTRAL DE ADMINISTRACIÓN, API Y REALTIME ──
// Servidor HTTP con endpoints REST y SSE (Server-Sent Events) para sincronización en tiempo real.

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8094;
const BASE_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.apk': 'application/vnd.android.package-archive'
};

const APKS_DIR = path.resolve(BASE_DIR, '..', 'Aplicaciones', 'APKs_Oficiales');

// ── ESTADO CENTRAL EN MEMORIA (SINCRONIZACIÓN EN TIEMPO REAL) ────────────────
const centralState = {
  // Lista oficial de choferes autorizados de la cooperativa
  choferes: [
    {
      id: 'chofer-carlos',
      nombre_completo: 'Carlos Méndez',
      telefono: '0987654321',
      cedula: '1204859632',
      pin: '1234',
      rol: 'chofer',
      unidad: 'Unidad 14 (Chevrolet D-Max)',
      placa: 'GSG-4521',
      licencia: 'Tipo E Profesional',
      activo: true
    },
    {
      id: 'chofer-manuel',
      nombre_completo: 'Manuel Loor',
      telefono: '0991234567',
      cedula: '0928374651',
      pin: '5678',
      rol: 'chofer',
      unidad: 'Unidad 07 (Toyota Hilux)',
      placa: 'GBA-8812',
      licencia: 'Tipo E Profesional',
      activo: true
    },
    {
      id: 'chofer-javier',
      nombre_completo: 'Javier Intriago',
      telefono: '0983344556',
      cedula: '1209876543',
      pin: '4321',
      rol: 'chofer',
      unidad: 'Unidad 22 (Renault Duster)',
      placa: 'RBA-3401',
      licencia: 'Tipo C Profesional',
      activo: true
    }
  ],
  reservas: [],
  telemetriaUltima: {},
  sseClients: new Set()
};

// Función para emitir eventos en tiempo real a todos los clientes conectados
function broadcastSSE(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of centralState.sseClients) {
    try {
      client.write(payload);
    } catch (e) {
      centralState.sseClients.delete(client);
    }
  }
}

// Helper para parsear JSON de peticiones POST
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1e6) { // Limite 1MB
        req.destroy();
        reject(new Error('Payload demasiado grande'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  // Manejo de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Parsear URL limpia
  const urlParts = req.url.split('?');
  let reqUrl = urlParts[0];
  const queryString = urlParts[1] || '';

  // ── 1. API: REALTIME SERVER-SENT EVENTS (SSE) ───────────────────────────────
  if (reqUrl === '/api/realtime/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write('event: connected\ndata: {"status":"ok"}\n\n');

    centralState.sseClients.add(res);

    req.on('close', () => {
      centralState.sseClients.delete(res);
    });
    return;
  }

  // ── 2. API: AUTENTICACIÓN REAL DE CHOFERES ──────────────────────────────────
  if (reqUrl === '/api/choferes/login' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const tel = (body.telefono || '').trim().replace(/\s+/g, '');
      const pin = (body.pin || '').trim();

      const chofer = centralState.choferes.find(c => 
        (c.telefono === tel || c.telefono.endsWith(tel) || tel.endsWith(c.telefono)) &&
        c.activo
      );

      if (!chofer) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Número celular no registrado como chofer activo en la cooperativa.' }));
        return;
      }

      if (chofer.pin !== pin) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'PIN de chofer incorrecto.' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: true,
        chofer: {
          id: chofer.id,
          nombre_completo: chofer.nombre_completo,
          telefono: chofer.telefono,
          cedula: chofer.cedula,
          unidad: chofer.unidad,
          placa: chofer.placa,
          licencia: chofer.licencia,
          rol: 'chofer'
        }
      }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Petición inválida' }));
    }
    return;
  }

  // ── 3. API: RESERVAS DE PASAJEROS (CREAR Y LISTAR) ──────────────────────────
  if (reqUrl === '/api/reservas') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, reservas: centralState.reservas }));
      return;
    }

    if (req.method === 'POST') {
      try {
        const body = await parseJsonBody(req);
        const reserva = {
          id: 'res-' + Date.now(),
          turno_id: body.turno_id || 'turno-activo-01',
          pasajero_nombre: body.pasajero_nombre || 'Pasajero',
          pasajero_telefono: body.pasajero_telefono || body.telefono || '',
          cantidad_puestos: parseInt(body.cantidad_puestos || 1, 10),
          origen_ciudad: body.origen_ciudad || 'Babahoyo',
          destino_ciudad: body.destino_ciudad || 'Guayaquil',
          direccion_recogida: body.direccion_recogida || 'Punto acordado',
          referencia_recogida: body.referencia_recogida || '',
          monto_total_efectivo: parseFloat(body.monto_total_efectivo || 12.00),
          codigo_abordaje_pin: body.codigo_abordaje_pin || Math.floor(1000 + Math.random() * 9000).toString(),
          latitud: parseFloat(body.latitud_recogida || body.lat || -1.8022),
          longitud: parseFloat(body.longitud_recogida || body.lng || -79.5344),
          estado: 'confirmada',
          created_at: new Date().toISOString()
        };

        centralState.reservas.unshift(reserva);
        // Limitar a últimas 50 reservas en memoria
        if (centralState.reservas.length > 50) centralState.reservas.pop();

        // Emitir evento Realtime a Choferes y Administración
        broadcastSSE('reserva_nueva', reserva);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, reserva: reserva }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Error procesando reserva' }));
      }
      return;
    }
  }

  // ── 4. API: TELEMETRÍA GPS EN RUTA (CADA 15 SEGUNDOS) ───────────────────────
  if (reqUrl === '/api/telemetria') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, telemetria: centralState.telemetriaUltima }));
      return;
    }

    if (req.method === 'POST') {
      try {
        const body = await parseJsonBody(req);
        const telemetria = {
          turno_id: body.turno_id || 'turno-activo-01',
          chofer_id: body.chofer_id || 'chofer-carlos',
          chofer_nombre: body.chofer_nombre || 'Carlos Méndez',
          unidad: body.unidad || 'Unidad 14',
          latitud: parseFloat(body.latitud || body.lat),
          longitud: parseFloat(body.longitud || body.lng),
          velocidad_kmh: parseFloat(body.velocidad_kmh || body.velocidad || 60),
          rumbo_grados: parseFloat(body.rumbo_grados || body.rumbo || 195),
          lugar: body.lugar || '',
          timestamp: new Date().toISOString()
        };

        centralState.telemetriaUltima[telemetria.turno_id] = telemetria;

        // Emitir a la consola para mover el marcador en el Radar Leaflet en vivo
        broadcastSSE('gps_update', telemetria);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, mensaje: 'Telemetría GPS recibida' }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Datos de telemetría inválidos' }));
      }
      return;
    }
  }

  // ── 5. SERVIDOR DE ARCHIVOS ESTÁTICOS Y DESCARGAS ───────────────────────────
  if (reqUrl === '/' || reqUrl === '') {
    reqUrl = '/index.html';
  } else if (reqUrl === '/descargas' || reqUrl === '/descargar' || reqUrl === '/apps' || reqUrl === '/apks') {
    reqUrl = '/descargas.html';
  }

  let filePath;
  // Ruta especial para descargar APKs compiladas
  if (reqUrl.startsWith('/apks/')) {
    const apkFileName = reqUrl.replace('/apks/', '');
    filePath = path.normalize(path.join(APKS_DIR, apkFileName));
    if (!filePath.startsWith(APKS_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('403 Prohibido: Acceso no permitido fuera del directorio de APKs.');
      return;
    }
  } else {
    filePath = path.normalize(path.join(BASE_DIR, reqUrl));
    // Protección contra Path Traversal
    if (!filePath.startsWith(BASE_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('403 Prohibido: Acceso no permitido fuera del directorio raíz.');
      return;
    }
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('404 No Encontrado: ' + reqUrl);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` 🚐 MACONDO EXPRESS · CONSOLA CENTRAL & REALTIME BACKEND`);
  console.log(` 🌐 Panel y API Activo en: http://localhost:${PORT}`);
  console.log(` 📡 Realtime SSE: http://localhost:${PORT}/api/realtime/stream`);
  console.log(` 🚗 Telemetría GPS: Ingesta periódica 15s activa`);
  console.log(`=======================================================`);
});
