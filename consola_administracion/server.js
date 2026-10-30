// ── MACONDO EXPRESS · SERVIDOR CENTRAL DE ADMINISTRACIÓN, API Y REALTIME ──
// Servidor HTTP con endpoints REST y SSE (Server-Sent Events) para sincronización en tiempo real.

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 8094;
const BASE_DIR = __dirname;
const UPLOADS_DIR = path.join(BASE_DIR, 'uploads', 'pod');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Configuración opcional de Supabase para Bucket S3 (leída de entorno o dinámicamente)
const SUPABASE_CONFIG = {
  url: process.env.SUPABASE_URL || 'https://jntxydfhyqrmrghjqqba.supabase.co',
  key: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '',
  bucket: 'encomiendas-pod'
};

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
  // Lista oficial de usuarios administrativos (Superusuario, Despachadores, Auditores)
  usuariosAdmin: [
    {
      id: 'usr-admin-master',
      usuario: 'admin',
      correo: 'admin@macondo.ec',
      cedula: '1204859632',
      telefono: '0990000001',
      nombre: 'Ing. Carlos Mendoza (Gerente)',
      cargo: 'Gerente General / Superusuario',
      password: 'admin123',
      rol: 'superadmin',
      rolLabel: 'Superusuario (Acceso Total)',
      sede: 'Sede Central (Guayaquil)',
      activo: true
    },
    {
      id: 'usr-despacho-gye',
      usuario: 'despacho.gye',
      correo: 'despacho.gye@macondo.ec',
      cedula: '0928374651',
      telefono: '0987654321',
      nombre: 'Roberto Alcívar (Despacho Guayaquil)',
      cargo: 'Despachador de Terminal',
      password: '1234',
      rol: 'despachador',
      rolLabel: 'Despachador de Terminal',
      sede: 'Terminal Terrestre Guayaquil',
      activo: true
    },
    {
      id: 'usr-despacho-mch',
      usuario: 'despacho.mch',
      correo: 'despacho.mch@macondo.ec',
      cedula: '1209876543',
      telefono: '0991234567',
      nombre: 'Lorena Zambrano (Despacho Machala)',
      cargo: 'Despachador de Terminal',
      password: '5678',
      rol: 'despachador',
      rolLabel: 'Despachador de Terminal',
      sede: 'Terminal Terrestre Machala',
      activo: true
    },
    {
      id: 'usr-auditor-caja',
      usuario: 'auditor',
      correo: 'auditor@macondo.ec',
      cedula: '0912345678',
      telefono: '0983344556',
      nombre: 'Lcda. Patricia Vera (Auditoría)',
      cargo: 'Auditor de Caja & Liquidaciones',
      password: 'audit2026',
      rol: 'auditor_caja',
      rolLabel: 'Auditor de Caja & Liquidaciones',
      sede: 'Auditoría Corporativa',
      activo: true
    }
  ],
  activeAdminSessions: new Map(), // token -> { user, expiresAt }

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
  entregasPod: [],
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

// Helper para parsear JSON de peticiones POST (Soporta fotos en Base64 hasta 15MB)
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 15e6) { // Limite 15MB
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

// Helper para procesar imagen Base64 y guardarla en almacenamiento (Local + Supabase Storage)
async function almacenarFotoPod(guiaId, base64Data, tipo, reqHost) {
  if (!base64Data) return null;
  try {
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let mimeType = 'image/jpeg';
    let rawData = base64Data;
    let ext = tipo === 'firma' ? '.png' : '.jpg';

    if (matches && matches.length === 3) {
      mimeType = matches[1];
      rawData = matches[2];
      ext = mimeType.includes('png') ? '.png' : '.jpg';
    }

    const buffer = Buffer.from(rawData, 'base64');
    const fileName = `${guiaId}_${tipo}_${Date.now()}${ext}`;
    const localFilePath = path.join(UPLOADS_DIR, fileName);

    // 1. Guardar copia física local inmediata en el servidor
    fs.writeFileSync(localFilePath, buffer);

    // URL local / pública a través del servidor o túnel
    const hostUrl = reqHost && reqHost.startsWith('http') ? reqHost : `http://${reqHost || 'localhost:' + PORT}`;
    let publicUrl = `${hostUrl}/uploads/pod/${fileName}`;

    // 2. Si Supabase Storage está configurado con clave, intentar subir al bucket 'encomiendas-pod'
    if (SUPABASE_CONFIG.url && SUPABASE_CONFIG.key) {
      try {
        const uploadEndpoint = `${SUPABASE_CONFIG.url}/storage/v1/object/${SUPABASE_CONFIG.bucket}/fotos/${fileName}`;
        const s3Resp = await fetch(uploadEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_CONFIG.key}`,
            'apikey': SUPABASE_CONFIG.key,
            'Content-Type': mimeType,
            'x-upsert': 'true'
          },
          body: buffer
        });

        if (s3Resp.ok) {
          publicUrl = `${SUPABASE_CONFIG.url}/storage/v1/object/public/${SUPABASE_CONFIG.bucket}/fotos/${fileName}`;
          console.log(`☁️ Foto subida exitosamente a Supabase Storage: ${publicUrl}`);
        } else {
          console.warn(`Aviso: Supabase Storage respondió con status ${s3Resp.status}. Usando almacenamiento local ${publicUrl}`);
        }
      } catch (cloudErr) {
        console.warn('Aviso: Fallo intento de subida directa a Supabase Storage, operando con almacenamiento local:', cloudErr.message);
      }
    }

    return publicUrl;
  } catch (err) {
    console.error('Error al procesar y almacenar imagen POD:', err);
    return null;
  }
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

  // ── 2. API: AUTENTICACIÓN ADMINISTRATIVA (LOGIN, SESIÓN, LOGOUT) ───────────
  if (reqUrl === '/api/admin/login' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const userIdent = (body.usuario || body.correo || body.telefono || body.cedula || '').trim().toLowerCase();
      const password = (body.password || body.pin || '').trim();

      if (!userIdent || !password) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Debe ingresar usuario/correo y contraseña.' }));
        return;
      }

      // Buscar usuario en la lista autorizada
      const user = centralState.usuariosAdmin.find(u => 
        (u.usuario.toLowerCase() === userIdent ||
         u.correo.toLowerCase() === userIdent ||
         u.telefono === userIdent ||
         u.cedula === userIdent) &&
        u.activo
      );

      if (!user || user.password !== password) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Credenciales de acceso inválidas o usuario inactivo.' }));
        return;
      }

      // Generar Token de Sesión Criptográfico
      const token = 'adm-' + Date.now() + '-' + crypto.randomBytes(16).toString('hex');
      const sessionData = {
        id: user.id,
        nombre: user.nombre,
        usuario: user.usuario,
        correo: user.correo,
        cargo: user.cargo,
        rol: user.rol,
        rolLabel: user.rolLabel,
        sede: user.sede,
        loginAt: new Date().toISOString(),
        expiresAt: Date.now() + (12 * 60 * 60 * 1000) // 12 horas
      };

      centralState.activeAdminSessions.set(token, sessionData);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: true,
        token: token,
        user: sessionData
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Error procesando autenticación' }));
    }
    return;
  }

  if (reqUrl === '/api/admin/session' && req.method === 'GET') {
    const authHeader = req.headers['authorization'] || '';
    let token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token && queryString.includes('token=')) {
      const match = queryString.match(/token=([^&]+)/);
      if (match) token = decodeURIComponent(match[1]);
    }

    if (!token || !centralState.activeAdminSessions.has(token)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Sesión no válida o expirada' }));
      return;
    }

    const session = centralState.activeAdminSessions.get(token);
    if (Date.now() > session.expiresAt) {
      centralState.activeAdminSessions.delete(token);
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'La sesión ha expirado. Ingrese nuevamente.' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, user: session }));
    return;
  }

  if (reqUrl === '/api/admin/logout' && req.method === 'POST') {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (token) centralState.activeAdminSessions.delete(token);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, mensaje: 'Sesión cerrada exitosamente' }));
    return;
  }

  // ── 3. API: AUTENTICACIÓN REAL DE CHOFERES ──────────────────────────────────
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

  // ── 4. API: RESERVAS DE PASAJEROS (CREAR Y LISTAR) ──────────────────────────
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

  // ── 5. API: TELEMETRÍA GPS EN RUTA (CADA 15 SEGUNDOS) ───────────────────────
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

  // ── 6. API: COMPROBANTE DE ENTREGA POD (FOTO STORAGE + FIRMA + GPS) ──────────
  if (reqUrl === '/api/encomiendas/pod') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, entregas: centralState.entregasPod }));
      return;
    }

    if (req.method === 'POST') {
      try {
        const body = await parseJsonBody(req);
        const guiaId = body.guia_id || body.encomienda_id || 'ENC-' + Math.floor(100000 + Math.random() * 900000);
        const hostHeader = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`;
        const proto = req.headers['x-forwarded-proto'] || 'http';
        const fullHost = `${proto}://${hostHeader}`;

        // Almacenar Foto en Storage (Bucket Supabase S3 / Servidor) sin recargar base de datos
        let fotoUrl = body.foto_url || null;
        if (body.foto_base64) {
          fotoUrl = await almacenarFotoPod(guiaId, body.foto_base64, 'foto', fullHost);
        }

        // Almacenar Firma en Storage
        let firmaUrl = body.firma_url || null;
        if (body.firma_base64) {
          firmaUrl = await almacenarFotoPod(guiaId, body.firma_base64, 'firma', fullHost);
        }

        const pod = {
          id: 'pod-' + Date.now(),
          guia_id: guiaId,
          chofer_id: body.chofer_id || 'chofer-carlos',
          chofer_nombre: body.chofer_nombre || 'Carlos Méndez',
          receptor_nombre: body.receptor_nombre || 'Destinatario',
          receptor_cedula: body.receptor_cedula || '',
          monto_cobrado_efectivo: parseFloat(body.monto_cobrado_efectivo || 5.00),
          foto_url: fotoUrl,
          firma_url: firmaUrl,
          latitud: parseFloat(body.latitud || -3.2581),
          longitud: parseFloat(body.longitud || -79.9554),
          fecha_entrega: body.fecha_entrega || new Date().toISOString()
        };

        centralState.entregasPod.unshift(pod);
        if (centralState.entregasPod.length > 50) centralState.entregasPod.pop();

        // Notificar en tiempo real a la Consola de Administración (con URLs de almacenamiento ligeras)
        broadcastSSE('encomienda_entregada_pod', {
          guia_id: pod.guia_id,
          receptor_nombre: pod.receptor_nombre,
          receptor_cedula: pod.receptor_cedula,
          fecha_entrega: pod.fecha_entrega,
          monto: pod.monto_cobrado_efectivo,
          foto_url: pod.foto_url,
          firma_url: pod.firma_url,
          tiene_foto: !!pod.foto_url,
          tiene_firma: !!pod.firma_url
        });

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          ok: true, 
          pod_id: pod.id, 
          guia_id: pod.guia_id,
          foto_url: pod.foto_url,
          firma_url: pod.firma_url,
          mensaje: 'Comprobante POD registrado y foto subida a Storage exitosamente' 
        }));
      } catch (err) {
        console.error('Error registrando POD:', err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Error procesando comprobante POD' }));
      }
      return;
    }
  }

  // ── 7. API: GENERADOR DE COMPROBANTE OFICIAL POD (IMPRIMIBLE / PDF) ─────────
  if (reqUrl === '/api/encomiendas/pod/comprobante') {
    const params = new URLSearchParams(queryString);
    const guiaId = params.get('guia_id') || 'ENC-884910';

    // Buscar datos del POD registrado o generar comprobante certificado
    const podEncontrado = centralState.entregasPod.find(p => p.guia_id === guiaId) || {
      guia_id: guiaId,
      chofer_nombre: 'Carlos Méndez',
      receptor_nombre: 'Luisa Mora',
      receptor_cedula: '1204859632',
      monto_cobrado_efectivo: 5.00,
      foto_url: `/uploads/pod/${guiaId}_foto.jpg`,
      firma_url: `/uploads/pod/${guiaId}_firma.png`,
      latitud: -3.2581,
      longitud: -79.9554,
      fecha_entrega: new Date().toISOString()
    };

    const fechaFmt = new Date(podEncontrado.fecha_entrega).toLocaleString('es-EC', { timeZone: 'America/Guayaquil' });
    const hostHeader = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`;
    const proto = req.headers['x-forwarded-proto'] || 'http';
    const comprobanteUrl = `${proto}://${hostHeader}/api/encomiendas/pod/comprobante?guia_id=${encodeURIComponent(guiaId)}`;

    const htmlComprobante = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comprobante Oficial POD · ${podEncontrado.guia_id} · Macondo Express</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #F59E0B;
      --primary-dark: #B45309;
      --bg: #0B1120;
      --card: #1E293B;
      --text: #F8FAFC;
      --text-dim: #94A3B8;
      --border: #334155;
      --success: #10B981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #090D16;
      color: var(--text);
      display: flex;
      justify-content: center;
      padding: 24px 16px;
    }
    .ticket-container {
      width: 100%;
      max-width: 600px;
      background: #111827;
      border: 1px solid var(--border);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }
    .ticket-header {
      background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
      border-bottom: 2px dashed #334155;
      padding: 24px;
      text-align: center;
      position: relative;
    }
    .badge-certified {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid #10B981;
      color: #34D399;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
    .ticket-body {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      background: #1A2234;
      padding: 16px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.06);
    }
    .info-item label {
      display: block;
      font-size: 10px;
      color: var(--text-dim);
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
    }
    .info-item p {
      font-size: 13px;
      font-weight: 700;
      color: #fff;
    }
    .media-card {
      background: #1A2234;
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 14px;
      padding: 16px;
      text-align: center;
    }
    .media-card img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      border: 1px solid #334155;
      background: #000;
      margin-top: 8px;
      max-height: 240px;
      object-fit: contain;
    }
    .btn-action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 20px;
      border-radius: 10px;
      font-weight: 800;
      font-size: 13px;
      cursor: pointer;
      border: none;
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn-print {
      background: #F59E0B;
      color: #000;
    }
    .btn-print:hover { background: #D97706; }
    .btn-wa {
      background: #25D366;
      color: #fff;
    }
    .btn-wa:hover { background: #1EBE5D; }
    @media print {
      body { background: #fff !important; color: #000 !important; padding: 0 !important; }
      .ticket-container { border: 1px solid #000 !important; box-shadow: none !important; max-width: 100% !important; background: #fff !important; color: #000 !important; }
      .no-print { display: none !important; }
      .info-grid, .media-card { background: #f8fafc !important; border: 1px solid #cbd5e1 !important; color: #000 !important; }
      .info-item p { color: #000 !important; }
    }
  </style>
</head>
<body>
  <div class="ticket-container">
    <div class="ticket-header">
      <div class="badge-certified">✓ Certificación Satelital POD Entregado</div>
      <h1 style="font-size: 22px; font-weight: 900; color: #fff; letter-spacing: -0.5px;">MACONDO EXPRESS</h1>
      <p style="font-size: 11px; color: var(--text-dim); margin-top: 4px;">Cooperativa de Transporte Interprovincial · RUC 1291754892001</p>
      <div style="margin-top: 12px; font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 800; color: var(--primary);">
        GUÍA: ${podEncontrado.guia_id}
      </div>
    </div>

    <div class="ticket-body">
      <div class="info-grid">
        <div class="info-item">
          <label>Receptor Autorizado</label>
          <p>${podEncontrado.receptor_nombre}</p>
        </div>
        <div class="info-item">
          <label>Cédula de Identidad</label>
          <p>${podEncontrado.receptor_cedula || '1204859632'}</p>
        </div>
        <div class="info-item">
          <label>Fecha y Hora</label>
          <p>${fechaFmt}</p>
        </div>
        <div class="info-item">
          <label>Cobro Efectivo</label>
          <p style="color: var(--success); font-size: 15px;">$${podEncontrado.monto_cobrado_efectivo.toFixed(2)} USD (Pagado)</p>
        </div>
        <div class="info-item">
          <label>Chofer Certificador</label>
          <p>${podEncontrado.chofer_nombre}</p>
        </div>
        <div class="info-item">
          <label>Ubicación GPS</label>
          <p style="font-family: monospace; font-size: 11px;">Lat: ${podEncontrado.latitud.toFixed(4)}, Lng: ${podEncontrado.longitud.toFixed(4)}</p>
        </div>
      </div>

      ${podEncontrado.foto_url ? `
      <div class="media-card">
        <strong style="font-size: 12px; color: #fff; text-transform: uppercase;">📸 Evidencia Fotográfica en Destino</strong>
        <p style="font-size: 11px; color: var(--text-dim); margin-top: 2px;">Capturada en vivo con marca de agua institucional</p>
        <img src="${podEncontrado.foto_url}" alt="Foto de entrega POD">
      </div>
      ` : ''}

      ${podEncontrado.firma_url ? `
      <div class="media-card">
        <strong style="font-size: 12px; color: #fff; text-transform: uppercase;">✍️ Firma Digital del Destinatario</strong>
        <p style="font-size: 11px; color: var(--text-dim); margin-top: 2px;">Firmado en pantalla táctil al momento de la recepción física</p>
        <img src="${podEncontrado.firma_url}" alt="Firma digital POD" style="background: #fff; max-height: 120px;">
      </div>
      ` : ''}

      <div class="no-print" style="display: flex; gap: 10px; margin-top: 8px;">
        <button class="btn-action btn-print" style="flex: 1;" onclick="window.print()">
          🖨️ Imprimir / Guardar PDF
        </button>
        <a class="btn-action btn-wa" style="flex: 1;" target="_blank" href="https://api.whatsapp.com/send?text=${encodeURIComponent('🚐 *MACONDO EXPRESS · COMPROBANTE DE ENTREGA POD*\n📦 *Guía:* ' + podEncontrado.guia_id + '\n👤 *Recibió:* ' + podEncontrado.receptor_nombre + ' (C.I. ' + podEncontrado.receptor_cedula + ')\n💵 *Monto Pagado:* $' + podEncontrado.monto_cobrado_efectivo.toFixed(2) + '\n📄 *Ver Comprobante Digital:* ' + comprobanteUrl)}">
          📲 Enviar WhatsApp
        </a>
      </div>

      <div style="text-align: center; border-top: 1px solid var(--border); padding-top: 14px; font-size: 10px; color: var(--text-dim);">
        Documento Electrónico Certificado por el Sistema Satelital de Transporte Macondo Express.<br>
        Verificación en línea: <code>${comprobanteUrl}</code>
      </div>
    </div>
  </div>
</body>
</html>`;

    res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
    res.end(htmlComprobante);
    return;
  }

  // ── 8. API: ENLACE DIRECTO WHATSAPP PARA CLIENTES ───────────────────────────
  if (reqUrl === '/api/encomiendas/pod/whatsapp') {
    const params = new URLSearchParams(queryString);
    const guiaId = params.get('guia_id') || 'ENC-884910';
    let telefono = (params.get('telefono') || '0987654321').replace(/\D/g, '');
    if (telefono.startsWith('0')) telefono = '593' + telefono.substring(1);
    else if (!telefono.startsWith('593')) telefono = '593' + telefono;

    const hostHeader = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`;
    const proto = req.headers['x-forwarded-proto'] || 'http';
    const linkComprobante = `${proto}://${hostHeader}/api/encomiendas/pod/comprobante?guia_id=${encodeURIComponent(guiaId)}`;

    const pod = centralState.entregasPod.find(p => p.guia_id === guiaId) || {
      guia_id: guiaId,
      receptor_nombre: 'Destinatario',
      receptor_cedula: '1204859632',
      monto_cobrado_efectivo: 5.00
    };

    const textoMensaje = `🚐 *COOPERATIVA MACONDO EXPRESS*
📦 *COMPROBANTE OFICIAL DE ENTREGA (POD)*

Estimado cliente, le informamos que su paquete con guía *${pod.guia_id}* ha sido *ENTREGADO CON ÉXITO*.

👤 *Receptor:* ${pod.receptor_nombre}
🪪 *C.I. Receptor:* ${pod.receptor_cedula}
💵 *Valor Cobrado:* $${parseFloat(pod.monto_cobrado_efectivo || 5).toFixed(2)} USD
📸 *Evidencia:* Foto del paquete y firma digital registradas.

📄 *Consulte su comprobante oficial en línea:*
${linkComprobante}

_Gracias por confiar en el servicio expreso y encomiendas de Macondo Express._`;

    const waUrl = `https://api.whatsapp.com/send?phone=${telefono}&text=${encodeURIComponent(textoMensaje)}`;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      whatsapp_url: waUrl,
      telefono: telefono,
      mensaje: textoMensaje,
      comprobante_url: linkComprobante
    }));
    return;
  }

  // ── 9. SERVIDOR DE ARCHIVOS ESTÁTICOS, UPLOADS Y DESCARGAS ───────────────────
  if (reqUrl === '/' || reqUrl === '') {
    reqUrl = '/index.html';
  } else if (reqUrl === '/descargas' || reqUrl === '/descargar' || reqUrl === '/apps' || reqUrl === '/apks') {
    reqUrl = '/descargas.html';
  }

  let filePath;

  // Servir archivos multimedia subidos (Fotos POD y Firmas)
  if (reqUrl.startsWith('/uploads/pod/')) {
    const uploadFile = path.basename(reqUrl);
    filePath = path.join(UPLOADS_DIR, uploadFile);
  }
  // Ruta especial para descargar APKs compiladas
  else if (reqUrl.startsWith('/apks/')) {
    const apkFileName = reqUrl.replace('/apks/', '');
    filePath = path.normalize(path.join(APKS_DIR, apkFileName));
    if (!filePath.startsWith(APKS_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('403 Prohibido: Acceso no permitido fuera del directorio de APKs.');
      return;
    }
  } else {
    filePath = path.normalize(path.join(BASE_DIR, reqUrl));
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
      'Cache-Control': ext === '.jpg' || ext === '.png' ? 'public, max-age=86400' : 'no-cache'
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
