// ── MACONDO EXPRESS · CONSOLA CENTRAL DE ADMINISTRACIÓN Y DESPACHO ──
// Lógica de Gestión para Despachadores, Auditores y Directivos de Cooperativa

const adminState = {
  activeTab: 'despacho',
  selectedTurnoManifiestoId: 'trn-01',
  kpis: {
    pasajerosHoy: 19,
    unidadesEnRuta: 3,
    efectivoRecaudado: 268.00,
    cuotasCooperativa: 36.00, // 6 turnos despachados x $6.00
    ocupacionPromedio: 3.8
  },
  turnos: [
    {
      id: 'trn-01',
      codigo: 'TRN-GYE-MCH-01',
      rutaOrigen: 'Guayaquil',
      rutaDestino: 'Machala',
      fechaSalida: '2026-09-21',
      horaSalida: '09:30',
      choferNombre: 'Manuel Palacios',
      choferCedula: '0703849201',
      choferLicencia: 'Tipo C (Profesional)',
      choferTelefono: '0991234567',
      vehiculoPlaca: 'GBA-4123',
      vehiculoModelo: 'Chevrolet Aveo Activo',
      cuposTotales: 4,
      cuposOcupados: 3,
      totalEfectivo: 41.00,
      estado: 'en_ruta', // 'programado', 'en_ruta', 'liquidado'
      pasajeros: [
        {
          id: 'p-1',
          nombre: 'Elena Viteri',
          cedula: '0928374615',
          telefono: '0995544332',
          puestos: 1,
          direccion: 'Boyacá 1204 y 9 de Octubre',
          monto: 12.00,
          pin: '7392',
          aBordo: true,
          horaAbordaje: '09:18'
        },
        {
          id: 'p-2',
          nombre: 'Roberto Gómez',
          cedula: '0704928172',
          telefono: '0981234567',
          puestos: 2,
          direccion: 'Av. Kennedy y Olimpo #310',
          monto: 24.00,
          pin: '4821',
          aBordo: true,
          horaAbordaje: '09:27'
        }
      ]
    },
    {
      id: 'trn-02',
      codigo: 'TRN-MCH-GYE-02',
      rutaOrigen: 'Machala',
      rutaDestino: 'Guayaquil',
      fechaSalida: '2026-09-21',
      horaSalida: '10:15',
      choferNombre: 'Carlos Zambrano',
      choferCedula: '0701928374',
      choferLicencia: 'Tipo C (Profesional)',
      choferTelefono: '0983344556',
      vehiculoPlaca: 'OBA-5892',
      vehiculoModelo: 'Toyota Yaris Sedan',
      cuposTotales: 4,
      cuposOcupados: 4,
      totalEfectivo: 48.00,
      estado: 'en_ruta',
      pasajeros: [
        {
          id: 'p-3',
          nombre: 'Mariana Córdova',
          cedula: '0709827361',
          telefono: '0978899001',
          puestos: 2,
          direccion: 'Av. 25 de Junio y Palmeras',
          monto: 24.00,
          pin: '3910',
          aBordo: true,
          horaAbordaje: '10:05'
        },
        {
          id: 'p-4',
          nombre: 'Jorge Loaiza',
          cedula: '0705647382',
          telefono: '0987766554',
          puestos: 2,
          direccion: 'Calle Junín y Rocafuerte',
          monto: 24.00,
          pin: '8520',
          aBordo: true,
          horaAbordaje: '10:12'
        }
      ]
    },
    {
      id: 'trn-03',
      codigo: 'TRN-GYE-MCH-03',
      rutaOrigen: 'Guayaquil',
      rutaDestino: 'Machala',
      fechaSalida: '2026-09-21',
      horaSalida: '11:45',
      choferNombre: 'Víctor Hugo Mendoza',
      choferCedula: '0912837465',
      choferLicencia: 'Tipo D (Pasajeros)',
      choferTelefono: '0994455667',
      vehiculoPlaca: 'GBC-9041',
      vehiculoModelo: 'Nissan Versa Advance',
      cuposTotales: 4,
      cuposOcupados: 2,
      totalEfectivo: 24.00,
      estado: 'programado',
      pasajeros: [
        {
          id: 'p-5',
          nombre: 'Diana Paredes',
          cedula: '0923847561',
          telefono: '0984433221',
          puestos: 2,
          direccion: 'Alborada 12va etapa, Mz 14 v 8',
          monto: 24.00,
          pin: '6194',
          aBordo: false,
          horaAbordaje: null
        }
      ]
    },
    {
      id: 'trn-04',
      codigo: 'TRN-MCH-GYE-04',
      rutaOrigen: 'Machala',
      rutaDestino: 'Guayaquil',
      fechaSalida: '2026-09-21',
      horaSalida: '07:00',
      choferNombre: 'Guillermo Cárdenas',
      choferCedula: '0703819284',
      choferLicencia: 'Tipo C (Profesional)',
      choferTelefono: '0998877665',
      vehiculoPlaca: 'OBA-3120',
      vehiculoModelo: 'Chevrolet D-Max Doble Cabina',
      cuposTotales: 4,
      cuposOcupados: 4,
      totalEfectivo: 53.00, // 4 pasajes ($48) + 1 encomienda ($5)
      estado: 'liquidado',
      pasajeros: []
    }
  ],
  liquidaciones: [
    {
      id: 'liq-01',
      turnoCodigo: 'TRN-MCH-GYE-04',
      fecha: '2026-09-21 10:15',
      chofer: 'Guillermo Cárdenas',
      placa: 'OBA-3120',
      totalPasajes: 48.00,
      totalEncomiendas: 5.00,
      totalRecaudado: 53.00,
      cuotaCooperativa: 6.00,
      gastosPeaje: 2.00,
      gastosCombustible: 10.00,
      gananciaNetaChofer: 35.00,
      estado: 'auditado'
    },
    {
      id: 'liq-02',
      turnoCodigo: 'TRN-GYE-MCH-00',
      fecha: '2026-09-21 09:10',
      chofer: 'Segundo Alvarado',
      placa: 'GBA-7781',
      totalPasajes: 48.00,
      totalEncomiendas: 10.00,
      totalRecaudado: 58.00,
      cuotaCooperativa: 6.00,
      gastosPeaje: 2.00,
      gastosCombustible: 12.00,
      gananciaNetaChofer: 38.00,
      estado: 'auditado'
    }
  ],
  choferes: [
    { id: 'ch-1', nombre: 'Manuel Palacios', cedula: '0703849201', licencia: 'Tipo C (Profesional)', telefono: '0991234567', estado: 'En Ruta', viajesHoy: 1 },
    { id: 'ch-2', nombre: 'Carlos Zambrano', cedula: '0701928374', licencia: 'Tipo C (Profesional)', telefono: '0983344556', estado: 'En Ruta', viajesHoy: 1 },
    { id: 'ch-3', nombre: 'Víctor Hugo Mendoza', cedula: '0912837465', licencia: 'Tipo D (Pasajeros)', telefono: '0994455667', estado: 'Disponible', viajesHoy: 0 },
    { id: 'ch-4', nombre: 'Guillermo Cárdenas', cedula: '0703819284', licencia: 'Tipo C (Profesional)', telefono: '0998877665', estado: 'Descanso', viajesHoy: 1 },
    { id: 'ch-5', nombre: 'Segundo Alvarado', cedula: '0702847192', licencia: 'Tipo C (Profesional)', telefono: '0981122334', estado: 'Disponible', viajesHoy: 1 }
  ],
  vehiculos: [
    { placa: 'GBA-4123', tipo: 'Sedán', modelo: 'Chevrolet Aveo Activo', anio: 2022, cupos: 4, estado: 'En Ruta', soatVigente: true },
    { placa: 'OBA-5892', tipo: 'Sedán', modelo: 'Toyota Yaris Sedan', anio: 2023, cupos: 4, estado: 'En Ruta', soatVigente: true },
    { placa: 'GBC-9041', tipo: 'Sedán', modelo: 'Nissan Versa Advance', anio: 2024, cupos: 4, estado: 'En Espera', soatVigente: true },
    { placa: 'OBA-3120', tipo: 'Camioneta', modelo: 'Chevrolet D-Max Doble Cabina', anio: 2021, cupos: 4, estado: 'En Terminal', soatVigente: true }
  ]
};

// ── NAVEGACIÓN ENTRE SECCIONES ───────────────────────────────────────────────
function switchAdminTab(tabName) {
  adminState.activeTab = tabName;

  // Actualizar clases de nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  const activeNavItem = document.getElementById(`nav-${tabName}`);
  if (activeNavItem) activeNavItem.classList.add('active');

  // Ocultar todas las secciones
  document.querySelectorAll('.admin-section').forEach(sec => {
    sec.style.display = 'none';
  });

  // Mostrar la sección seleccionada
  const targetSec = document.getElementById(`section-${tabName}`);
  if (targetSec) targetSec.style.display = 'flex';

  // Ejecutar renders específicos
  if (tabName === 'despacho') renderDespachoTable();
  if (tabName === 'manifiesto') renderManifiestoANT();
  if (tabName === 'liquidaciones') renderLiquidacionesTable();
  if (tabName === 'flota') renderFlotaTables();
  if (tabName === 'radar') renderRadarTelemetria();
}

// ── RENDER DE DESPACHO DE TURNOS ────────────────────────────────────────────
function renderDespachoTable() {
  const tbody = document.getElementById('tbodyDespacho');
  if (!tbody) return;
  tbody.innerHTML = '';

  adminState.turnos.forEach(t => {
    const tr = document.createElement('tr');
    const libres = t.cuposTotales - t.cuposOcupados;

    let badgeClass = 'badge-green';
    let estadoLabel = 'EN RUTA';
    if (t.estado === 'programado') {
      badgeClass = 'badge-amber';
      estadoLabel = 'PROGRAMADO';
    } else if (t.estado === 'liquidado') {
      badgeClass = 'badge-blue';
      estadoLabel = 'LIQUIDADO';
    }

    tr.innerHTML = `
      <td>
        <strong style="color: #fff; font-family: monospace;">${t.codigo}</strong>
      </td>
      <td>
        <strong style="color: var(--accent);">${t.rutaOrigen} ➔ ${t.rutaDestino}</strong><br>
        <span style="font-size: 11px; color: var(--text-dim);">${t.fechaSalida} · ${t.horaSalida}</span>
      </td>
      <td>
        <strong style="color: #fff;">${t.choferNombre}</strong><br>
        <span style="font-size: 11px; color: var(--amber);">${t.choferLicencia} · 📞 ${t.choferTelefono}</span>
      </td>
      <td>
        <span style="background: var(--bg-elevated); padding: 4px 8px; border-radius: 6px; font-weight: bold; font-family: monospace; border: 1px solid var(--border);">
          ${t.vehiculoPlaca}
        </span><br>
        <span style="font-size: 11px; color: var(--text-muted);">${t.vehiculoModelo}</span>
      </td>
      <td>
        <div class="seat-capsule">
          <span>${t.cuposOcupados}/4</span>
          ${[1, 2, 3, 4].map(i => `<div class="seat-dot ${i <= t.cuposOcupados ? 'filled' : 'empty'}"></div>`).join('')}
        </div>
        <div style="font-size: 10px; color: ${libres === 0 ? 'var(--amber)' : 'var(--text-dim)'}; margin-top: 2px;">
          ${libres === 0 ? 'Completo' : `${libres} libres`}
        </div>
      </td>
      <td>
        <strong style="color: var(--amber); font-size: 13px;">$${t.totalEfectivo.toFixed(2)}</strong>
      </td>
      <td>
        <span class="badge ${badgeClass}">${estadoLabel}</span>
      </td>
      <td>
        <button class="btn btn-outline" style="padding: 4px 8px; font-size: 11px;" onclick="verManifiestoDeTurno('${t.id}')">
          📋 Manifiesto
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function verManifiestoDeTurno(turnoId) {
  adminState.selectedTurnoManifiestoId = turnoId;
  switchAdminTab('manifiesto');
}

// ── RENDER DE MANIFIESTO OFICIAL DE TRÁNSITO ANT ────────────────────────────
function renderManifiestoANT() {
  const turno = adminState.turnos.find(t => t.id === adminState.selectedTurnoManifiestoId) || adminState.turnos[0];
  if (!turno) return;

  // Llenar selector de turno
  const selector = document.getElementById('selectTurnoManifiesto');
  if (selector) {
    selector.innerHTML = adminState.turnos.map(t => `
      <option value="${t.id}" ${t.id === turno.id ? 'selected' : ''}>
        ${t.codigo} (${t.rutaOrigen} ➔ ${t.rutaDestino} · ${t.horaSalida})
      </option>
    `).join('');
  }

  // Actualizar metadatos en pantalla
  document.getElementById('mftRuta').innerText = `${turno.rutaOrigen} ➔ ${turno.rutaDestino}`;
  document.getElementById('mftFechaHora').innerText = `${turno.fechaSalida} a las ${turno.horaSalida}`;
  document.getElementById('mftChofer').innerText = `${turno.choferNombre} (Céd: ${turno.choferCedula}) - ${turno.choferLicencia}`;
  document.getElementById('mftVehiculo').innerText = `Placa ${turno.vehiculoPlaca} (${turno.vehiculoModelo} · Capacidad: 4 Puestos)`;
  document.getElementById('mftOcupacion').innerText = `${turno.cuposOcupados} de 4 puestos reservados`;

  // Render de la tabla de pasajeros con PIN y Cédula
  const tbody = document.getElementById('tbodyManifiestoPasajeros');
  tbody.innerHTML = '';

  if (turno.pasajeros.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-dim); padding: 20px;">No hay registros de pasajeros cargados en este turno.</td></tr>`;
    return;
  }

  turno.pasajeros.forEach((p, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>
        <strong style="color: #fff;">${p.nombre}</strong><br>
        <span style="font-size: 11px; color: var(--text-dim);">Cédula: ${p.cedula} (Validada M10)</span>
      </td>
      <td>📞 ${p.telefono}</td>
      <td>
        <span style="color: var(--amber); font-weight: 600;">📍 ${p.direccion}</span>
      </td>
      <td>
        <strong style="font-size: 13px; color: #fff;">${p.puestos} ${p.puestos === 1 ? 'cupo' : 'cupos'}</strong>
      </td>
      <td>
        <span style="font-family: monospace; font-weight: bold; background: var(--bg-elevated); padding: 3px 6px; border-radius: 4px; color: var(--accent-light); border: 1px solid var(--accent);">
          PIN: ${p.pin}
        </span>
      </td>
      <td>
        <strong style="color: var(--amber);">$${p.monto.toFixed(2)}</strong> (Efectivo)
      </td>
      <td>
        ${p.aBordo 
          ? `<span class="badge badge-green">✓ A Bordo (${p.horaAbordaje})</span>` 
          : `<span class="badge badge-amber">⏳ Por Recoger</span>`}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function cambiarTurnoManifiesto(turnoId) {
  adminState.selectedTurnoManifiestoId = turnoId;
  renderManifiestoANT();
}

function imprimirManifiestoANT() {
  const turno = adminState.turnos.find(t => t.id === adminState.selectedTurnoManifiestoId) || adminState.turnos[0];
  const printContainer = document.getElementById('printableArea');
  
  printContainer.innerHTML = `
    <div class="manifest-header">
      <div class="manifest-logo">
        <h2>COOPERATIVA DE TRANSPORTE MACONDO EXPRESS</h2>
        <p style="font-size: 11px; color: #334155; margin-top: 2px;">
          Servicio Interprovincial Puerta a Puerta Homologado · Resolución ANT N° 0482-2025<br>
          RUC: 0992384756001 · Guayaquil - El Oro - Ecuador
        </p>
      </div>
      <div class="manifest-meta">
        <strong>MANIFIESTO OFICIAL DE TRÁNSITO</strong><br>
        <span style="font-family: monospace; font-weight: bold; font-size: 13px;">${turno.codigo}</span><br>
        Fecha Emisión: ${new Date().toLocaleString('es-EC')}
      </div>
    </div>

    <div class="manifest-grid-info">
      <div>
        <strong>RUTA:</strong> ${turno.rutaOrigen} ➔ ${turno.rutaDestino}<br>
        <strong>HORA SALIDA:</strong> ${turno.horaSalida} (${turno.fechaSalida})
      </div>
      <div>
        <strong>CONDUCTOR:</strong> ${turno.choferNombre}<br>
        <strong>CÉDULA / LICENCIA:</strong> ${turno.choferCedula} (${turno.choferLicencia})
      </div>
      <div>
        <strong>UNIDAD ASIGNADA:</strong> ${turno.vehiculoPlaca} (${turno.vehiculoModelo})<br>
        <strong>CAPACIDAD MÁXIMA:</strong> 4 Pasajeros (Sedán/Pickup)
      </div>
    </div>

    <table class="manifest-table">
      <thead>
        <tr>
          <th>N°</th>
          <th>Nombres y Apellidos</th>
          <th>Cédula / DNI</th>
          <th>Teléfono</th>
          <th>Punto de Recogida Puerta a Puerta</th>
          <th>Puestos</th>
          <th>PIN Abordaje</th>
          <th>Firma / Verif.</th>
        </tr>
      </thead>
      <tbody>
        ${turno.pasajeros.map((p, i) => `
          <tr>
            <td>${i + 1}</td>
            <td><strong>${p.nombre}</strong></td>
            <td>${p.cedula}</td>
            <td>${p.telefono}</td>
            <td>${p.direccion}</td>
            <td>${p.puestos}</td>
            <td style="font-family: monospace; font-weight: bold;">${p.pin}</td>
            <td>${p.aBordo ? `✓ A Bordo (${p.horaAbordaje})` : 'Pendiente'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div style="display: flex; justify-content: space-between; margin-top: 40px; text-align: center; font-size: 11px;">
      <div style="width: 200px; border-top: 1px solid #000; padding-top: 4px;">
        Firma Chofer Conductor<br>
        <strong>${turno.choferNombre}</strong>
      </div>
      <div style="width: 200px; border-top: 1px solid #000; padding-top: 4px;">
        Despacho Cooperativa Macondo<br>
        <strong>Control & Terminal</strong>
      </div>
      <div style="width: 200px; border-top: 1px solid #000; padding-top: 4px;">
        Sello Agente de Tránsito<br>
        <strong>Comisión de Tránsito (CTE)</strong>
      </div>
    </div>
  `;

  window.print();
}

// ── RENDER DE AUDITORÍA DE ARQUEOS Y LIQUIDACIONES ──────────────────────────
function renderLiquidacionesTable() {
  const tbody = document.getElementById('tbodyLiquidaciones');
  if (!tbody) return;
  tbody.innerHTML = '';

  adminState.liquidaciones.forEach(l => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong style="color: #fff; font-family: monospace;">${l.turnoCodigo}</strong></td>
      <td>${l.fecha}</td>
      <td>
        <strong style="color: #fff;">${l.chofer}</strong><br>
        <span style="font-size: 11px; color: var(--text-dim); font-family: monospace;">Placa: ${l.placa}</span>
      </td>
      <td>
        <strong style="color: var(--amber); font-size: 13px;">$${l.totalRecaudado.toFixed(2)}</strong><br>
        <span style="font-size: 10px; color: var(--text-dim);">Pasajes: $${l.totalPasajes} | Enc: $${l.totalEncomiendas}</span>
      </td>
      <td>
        <strong style="color: var(--accent);">$${l.cuotaCooperativa.toFixed(2)}</strong>
      </td>
      <td>
        <span style="color: var(--red);">-$${l.gastosPeaje.toFixed(2)}</span>
      </td>
      <td>
        <span style="color: var(--red);">-$${l.gastosCombustible.toFixed(2)}</span>
      </td>
      <td>
        <strong style="color: var(--accent-light); font-size: 15px;">$${l.gananciaNetaChofer.toFixed(2)}</strong>
      </td>
      <td>
        <span class="badge badge-green">AUDITADO & RECIBIDO</span>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ── RENDER DE FLOTA Y CHOFERES ───────────────────────────────────────────────
function renderFlotaTables() {
  const tbodyCh = document.getElementById('tbodyChoferes');
  if (tbodyCh) {
    tbodyCh.innerHTML = adminState.choferes.map((c, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong style="color: #fff;">${c.nombre}</strong></td>
        <td>${c.cedula}</td>
        <td><span class="badge badge-blue">${c.licencia}</span></td>
        <td>📞 ${c.telefono}</td>
        <td><span class="badge ${c.estado === 'En Ruta' ? 'badge-green' : (c.estado === 'Disponible' ? 'badge-amber' : 'badge-blue')}">${c.estado}</span></td>
        <td><strong>${c.viajesHoy}</strong></td>
      </tr>
    `).join('');
  }

  const tbodyVeh = document.getElementById('tbodyVehiculos');
  if (tbodyVeh) {
    tbodyVeh.innerHTML = adminState.vehiculos.map(v => `
      <tr>
        <td><strong style="font-family: monospace; color: var(--amber); font-size: 13px;">${v.placa}</strong></td>
        <td>${v.modelo}</td>
        <td>${v.tipo} (${v.anio})</td>
        <td>
          <span style="background: var(--bg-space); padding: 4px 8px; border-radius: 6px; font-weight: bold; border: 1px solid var(--accent); color: var(--accent);">
            Máx 4 Puestos
          </span>
        </td>
        <td><span class="badge badge-green">✓ SOAT Vigente</span></td>
        <td><span class="badge ${v.estado === 'En Ruta' ? 'badge-green' : 'badge-amber'}">${v.estado}</span></td>
      </tr>
    `).join('');
  }
}

// ── RADAR GPS & TELEMETRÍA SATELITAL ─────────────────────────────────────────
function renderRadarTelemetria() {
  const feed = document.getElementById('telemetriaFeed');
  if (!feed) return;

  const telemetryPoints = [
    { placa: 'GBA-4123', chofer: 'Manuel Palacios', ruta: 'Guayaquil ➔ Machala', km: 'Km 68 (Troncal E25)', vel: '78 km/h', estado: 'En Carretera normal', badge: 'badge-green' },
    { placa: 'OBA-5892', chofer: 'Carlos Zambrano', ruta: 'Machala ➔ Guayaquil', km: 'Km 112 (Naranjal)', vel: '82 km/h', estado: 'En Carretera normal', badge: 'badge-green' },
    { placa: 'GBC-9041', chofer: 'Víctor Hugo Mendoza', ruta: 'Guayaquil (Sector Alborada)', km: 'Recogida puerta a puerta', vel: '25 km/h', estado: 'Aproximación a puerta', badge: 'badge-amber' }
  ];

  feed.innerHTML = telemetryPoints.map(p => `
    <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 14px; display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(16,185,129,0.15); display: flex; align-items: center; justify-content: center; font-size: 18px;">
          🚗
        </div>
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <strong style="color: #fff; font-size: 14px;">Unidad: ${p.placa}</strong>
            <span class="badge ${p.badge}">${p.estado}</span>
          </div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
            Chofer: ${p.chofer} · Ruta: <strong style="color: var(--accent);">${p.ruta}</strong>
          </div>
          <div style="font-size: 11px; color: var(--amber); margin-top: 2px;">
            📍 Ubicación Satelital: ${p.km}
          </div>
        </div>
      </div>
      <div style="text-align: right;">
        <span style="font-size: 10px; color: var(--text-dim); text-transform: uppercase;">Velocidad GPS</span>
        <div style="font-size: 18px; font-weight: 900; color: var(--accent);">${p.vel}</div>
      </div>
    </div>
  `).join('');
}

// ── MODAL: NUEVO TURNO / DESPACHO ────────────────────────────────────────────
function abrirModalNuevoTurno() {
  document.getElementById('modalNuevoTurno').style.display = 'flex';
}

function cerrarModalNuevoTurno() {
  document.getElementById('modalNuevoTurno').style.display = 'none';
}

function crearNuevoTurno() {
  const origen = document.getElementById('nuevoTurnoOrigen').value;
  const destino = document.getElementById('nuevoTurnoDestino').value;
  const chofer = document.getElementById('nuevoTurnoChofer').value;
  const placa = document.getElementById('nuevoTurnoPlaca').value;
  const hora = document.getElementById('nuevoTurnoHora').value || '14:00';

  if (origen === destino) {
    alert('El origen y destino no pueden ser iguales.');
    return;
  }

  const codigo = `TRN-${origen.substring(0,3).toUpperCase()}-${destino.substring(0,3).toUpperCase()}-0${adminState.turnos.length + 1}`;
  
  const nuevoTurno = {
    id: `trn-${Date.now()}`,
    codigo: codigo,
    rutaOrigen: origen,
    rutaDestino: destino,
    fechaSalida: new Date().toISOString().split('T')[0],
    horaSalida: hora,
    choferNombre: chofer,
    choferCedula: '0709988771',
    choferLicencia: 'Tipo C (Profesional)',
    choferTelefono: '0990011223',
    vehiculoPlaca: placa,
    vehiculoModelo: 'Automóvil Homologado',
    cuposTotales: 4,
    cuposOcupados: 0,
    totalEfectivo: 0.00,
    estado: 'programado',
    pasajeros: []
  };

  adminState.turnos.unshift(nuevoTurno);
  cerrarModalNuevoTurno();
  renderDespachoTable();
  alert(`✓ ¡Turno ${codigo} despachado exitosamente! Disponible de inmediato para reservas en la App de Pasajeros.`);
}

// Inicialización en carga
document.addEventListener('DOMContentLoaded', () => {
  switchAdminTab('despacho');
});
