// ── MACONDO EXPRESS · CONSOLA CENTRAL DE ADMINISTRACIÓN Y DESPACHO ──
// Lógica de Gestión para Despachadores, Auditores y Directivos de Cooperativa

// ── UTILITARIO: VALIDADOR DE CÉDULA ECUATORIANA (MÓDULO 10) ──────────────────
function validarCedulaEcuatoriana(cedula) {
  if (!cedula || typeof cedula !== 'string') return false;
  cedula = cedula.trim();
  if (cedula.length !== 10 || !/^\d+$/.test(cedula)) return false;

  const prov = parseInt(cedula.substring(0, 2), 10);
  if ((prov < 1 || prov > 24) && prov !== 30) return false;

  const tercerDigito = parseInt(cedula[2], 10);
  if (tercerDigito >= 6) return false;

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let val = parseInt(cedula[i], 10) * coeficientes[i];
    if (val >= 10) val -= 9;
    suma += val;
  }

  const digitoVerificador = parseInt(cedula[9], 10);
  const decenaSuperior = Math.ceil(suma / 10) * 10;
  let resultado = decenaSuperior - suma;
  if (resultado === 10) resultado = 0;

  return resultado === digitoVerificador;
}

// ── ESTADO GLOBAL PERSISTENTE DE LA CONSOLA ──────────────────────────────────
const STORAGE_KEYS = {
  SUPERUSER: 'macondo_superuser',
  CHOFERES: 'macondo_choferes',
  VEHICULOS: 'macondo_vehiculos',
  USUARIOS: 'macondo_usuarios',
  TURNOS: 'macondo_turnos',
  LIQUIDACIONES: 'macondo_liquidaciones'
};

const adminState = {
  activeTab: 'despacho',
  currentUser: null,
  selectedTurnoManifiestoId: 'trn-01',
  turnoEnEdicionId: null,
  kpis: {
    pasajerosHoy: 19,
    unidadesEnRuta: 3,
    efectivoRecaudado: 268.00,
    cuotasCooperativa: 36.00,
    ocupacionPromedio: 3.8
  },
  turnos: [],
  liquidaciones: [],
  choferes: [],
  vehiculos: [],
  usuarios: []
};

// ── SEMILLAS DE DATOS INICIALES (SI NO EXISTEN EN LOCALSTORAGE) ──────────────
const SEED_CHOFERES = [
  { id: 'ch-1', nombre: 'Manuel Palacios', cedula: '0703849201', licencia: 'Tipo C (Profesional)', vigenciaLicencia: '2028-04-15', telefono: '0991234567', correo: 'manuel.palacios@macondo.ec', unidadAsignada: 'GBA-4123', estado: 'En Ruta', viajesHoy: 1 },
  { id: 'ch-2', nombre: 'Carlos Zambrano', cedula: '0701928374', licencia: 'Tipo C (Profesional)', vigenciaLicencia: '2027-11-20', telefono: '0983344556', correo: 'carlos.zambrano@macondo.ec', unidadAsignada: 'OBA-5892', estado: 'En Ruta', viajesHoy: 1 },
  { id: 'ch-3', nombre: 'Víctor Hugo Mendoza', cedula: '0912837465', licencia: 'Tipo D (Pasajeros)', vigenciaLicencia: '2029-01-10', telefono: '0994455667', correo: 'victor.mendoza@macondo.ec', unidadAsignada: 'GBC-9041', estado: 'Disponible', viajesHoy: 0 },
  { id: 'ch-4', nombre: 'Guillermo Cárdenas', cedula: '0703819284', licencia: 'Tipo C (Profesional)', vigenciaLicencia: '2026-12-30', telefono: '0998877665', correo: 'guillermo.cardenas@macondo.ec', unidadAsignada: 'OBA-3120', estado: 'Descanso', viajesHoy: 1 },
  { id: 'ch-5', nombre: 'Segundo Alvarado', cedula: '0702847192', licencia: 'Tipo C (Profesional)', vigenciaLicencia: '2028-09-18', telefono: '0981122334', correo: 'segundo.alvarado@macondo.ec', unidadAsignada: 'Sin Asignar', estado: 'Disponible', viajesHoy: 1 }
];

const SEED_VEHICULOS = [
  { placa: 'GBA-4123', tipo: 'Sedán', modelo: 'Chevrolet Aveo Activo', anio: 2022, disco: 'Unidad #01', cupos: 4, choferAsignado: 'Manuel Palacios', estado: 'En Ruta', soatVigente: true, soatVence: '2027-05-10', rtvVigente: true },
  { placa: 'OBA-5892', tipo: 'Sedán', modelo: 'Toyota Yaris Sedan', anio: 2023, disco: 'Unidad #02', cupos: 4, choferAsignado: 'Carlos Zambrano', estado: 'En Ruta', soatVigente: true, soatVence: '2027-08-22', rtvVigente: true },
  { placa: 'GBC-9041', tipo: 'Sedán', modelo: 'Nissan Versa Advance', anio: 2024, disco: 'Unidad #03', cupos: 4, choferAsignado: 'Víctor Hugo Mendoza', estado: 'En Espera', soatVigente: true, soatVence: '2028-02-14', rtvVigente: true },
  { placa: 'OBA-3120', tipo: 'Camioneta Doble Cabina', modelo: 'Chevrolet D-Max 4x2', anio: 2021, disco: 'Unidad #04', cupos: 4, choferAsignado: 'Guillermo Cárdenas', estado: 'En Terminal', soatVigente: true, soatVence: '2026-11-30', rtvVigente: true }
];

const SEED_USUARIOS = [
  { id: 'usr-01', nombre: 'Patricio Valarezo', cedula: '0702938471', correo: 'despacho.machala@macondo.ec', telefono: '0981122334', rol: 'despachador', rolLabel: 'Despachador Terminal', sede: 'Terminal Machala', estado: 'Activo' },
  { id: 'usr-02', nombre: 'Juan Carlos Morales', cedula: '0928374610', correo: 'despacho.guayaquil@macondo.ec', telefono: '0995544332', rol: 'despachador', rolLabel: 'Despachador Terminal', sede: 'Terminal Guayaquil', estado: 'Activo' },
  { id: 'usr-03', nombre: 'Lcda. Carmen Benítez', cedula: '0704839201', correo: 'auditoria@macondo.ec', telefono: '0987766554', rol: 'auditor_caja', rolLabel: 'Auditor de Caja & Liquidaciones', sede: 'Caja Central', estado: 'Activo' },
  { id: 'usr-04', nombre: 'Ing. Andrés Solís', cedula: '0918273645', correo: 'gps.telemetria@macondo.ec', telefono: '0993344556', rol: 'operador_gps', rolLabel: 'Operador Telemetría GPS', sede: 'Centro de Monitoreo', estado: 'Activo' }
];

const SEED_TURNOS = [
  {
    id: 'trn-01',
    codigo: 'TRN-GYE-MCH-01',
    rutaOrigen: 'Guayaquil',
    rutaDestino: 'Machala',
    paradas: ['Naranjal', 'Ponce Enríquez'],
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
    tarifaPorCupo: 12.00,
    totalEfectivo: 41.00,
    cuotaCooperativa: 6.00,
    estado: 'en_ruta',
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
    paradas: ['El Guabo', 'Naranjal'],
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
    tarifaPorCupo: 12.00,
    totalEfectivo: 48.00,
    cuotaCooperativa: 6.00,
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
    paradas: ['Naranjal'],
    fechaSalida: '2026-09-21',
    horaSalida: '14:30',
    choferNombre: 'Víctor Hugo Mendoza',
    choferCedula: '0912837465',
    choferLicencia: 'Tipo D (Pasajeros)',
    choferTelefono: '0994455667',
    vehiculoPlaca: 'GBC-9041',
    vehiculoModelo: 'Nissan Versa Advance',
    cuposTotales: 4,
    cuposOcupados: 2,
    tarifaPorCupo: 12.00,
    totalEfectivo: 24.00,
    cuotaCooperativa: 6.00,
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
  }
];

const SEED_LIQUIDACIONES = [
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
];

// ── INICIALIZACIÓN Y PERSISTENCIA EN LOCALSTORAGE ─────────────────────────────
function initLocalStorageData() {
  // Choferes
  const storedCh = localStorage.getItem(STORAGE_KEYS.CHOFERES);
  adminState.choferes = storedCh ? JSON.parse(storedCh) : SEED_CHOFERES;
  if (!storedCh) localStorage.setItem(STORAGE_KEYS.CHOFERES, JSON.stringify(SEED_CHOFERES));

  // Vehículos
  const storedVeh = localStorage.getItem(STORAGE_KEYS.VEHICULOS);
  adminState.vehiculos = storedVeh ? JSON.parse(storedVeh) : SEED_VEHICULOS;
  if (!storedVeh) localStorage.setItem(STORAGE_KEYS.VEHICULOS, JSON.stringify(SEED_VEHICULOS));

  // Usuarios
  const storedUsr = localStorage.getItem(STORAGE_KEYS.USUARIOS);
  adminState.usuarios = storedUsr ? JSON.parse(storedUsr) : SEED_USUARIOS;
  if (!storedUsr) localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(SEED_USUARIOS));

  // Turnos
  const storedTrn = localStorage.getItem(STORAGE_KEYS.TURNOS);
  adminState.turnos = storedTrn ? JSON.parse(storedTrn) : SEED_TURNOS;
  if (!storedTrn) localStorage.setItem(STORAGE_KEYS.TURNOS, JSON.stringify(SEED_TURNOS));

  // Liquidaciones
  const storedLiq = localStorage.getItem(STORAGE_KEYS.LIQUIDACIONES);
  adminState.liquidaciones = storedLiq ? JSON.parse(storedLiq) : SEED_LIQUIDACIONES;
  if (!storedLiq) localStorage.setItem(STORAGE_KEYS.LIQUIDACIONES, JSON.stringify(SEED_LIQUIDACIONES));

  // Superusuario
  const superuser = localStorage.getItem(STORAGE_KEYS.SUPERUSER);
  if (superuser) {
    adminState.currentUser = JSON.parse(superuser);
  }
}

function saveState(key) {
  if (key === 'choferes') localStorage.setItem(STORAGE_KEYS.CHOFERES, JSON.stringify(adminState.choferes));
  if (key === 'vehiculos') localStorage.setItem(STORAGE_KEYS.VEHICULOS, JSON.stringify(adminState.vehiculos));
  if (key === 'usuarios') localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(adminState.usuarios));
  if (key === 'turnos') localStorage.setItem(STORAGE_KEYS.TURNOS, JSON.stringify(adminState.turnos));
  if (key === 'liquidaciones') localStorage.setItem(STORAGE_KEYS.LIQUIDACIONES, JSON.stringify(adminState.liquidaciones));
}

// ── 1. MODAL ONBOARDING DE SUPERUSUARIO (PRIMERA VEZ) ────────────────────────
function checkSuperUserSetup() {
  const modal = document.getElementById('modalSuperUserSetup');
  if (!adminState.currentUser) {
    // Primera vez: mostrar modal de onboarding
    if (modal) modal.style.display = 'flex';
  } else {
    // Ya registrado: ocultar modal y mostrar información en el topbar
    if (modal) modal.style.display = 'none';
    renderUserProfileBadge();
  }
}

function registrarSuperUsuario() {
  const nombre = document.getElementById('suNombre').value.trim();
  const cedula = document.getElementById('suCedula').value.trim();
  const correo = document.getElementById('suCorreo').value.trim();
  const telefono = document.getElementById('suTelefono').value.trim();
  const cargo = document.getElementById('suCargo').value.trim();
  const password = document.getElementById('suPassword').value;
  const confirm = document.getElementById('suPasswordConfirm').value;

  if (!nombre || !cedula || !correo || !telefono || !password) {
    alert('Por favor complete todos los campos obligatorios del Superusuario.');
    return;
  }

  if (!validarCedulaEcuatoriana(cedula)) {
    alert('⚠️ La Cédula de Identidad ingresada NO es válida según el algoritmo oficial Módulo 10 de Ecuador. Por favor verifíquela.');
    return;
  }

  if (password.length < 6) {
    alert('La contraseña maestra debe tener al menos 6 caracteres.');
    return;
  }

  if (password !== confirm) {
    alert('Las contraseñas ingresadas no coinciden.');
    return;
  }

  const superuser = {
    id: 'su-admin',
    nombre: nombre,
    cedula: cedula,
    correo: correo,
    telefono: telefono,
    cargo: cargo || 'Gerente General / Superusuario',
    rol: 'superadmin',
    rolLabel: 'Superusuario (Acceso Total)',
    fechaRegistro: new Date().toISOString()
  };

  // Guardar en persistencia
  localStorage.setItem(STORAGE_KEYS.SUPERUSER, JSON.stringify(superuser));
  adminState.currentUser = superuser;

  // Registrar en la lista de usuarios si no está
  const idx = adminState.usuarios.findIndex(u => u.rol === 'superadmin');
  if (idx >= 0) {
    adminState.usuarios[idx] = { ...superuser, sede: 'Sede Central', estado: 'Activo' };
  } else {
    adminState.usuarios.unshift({ ...superuser, sede: 'Sede Central', estado: 'Activo' });
  }
  saveState('usuarios');

  // Cerrar modal y renderizar
  const modal = document.getElementById('modalSuperUserSetup');
  if (modal) modal.style.display = 'none';

  renderUserProfileBadge();
  renderUsuariosTable();

  alert(`👑 ¡Bienvenido, ${nombre}!\nEl Superusuario ha sido registrado exitosamente con control total. De ahora en adelante, la consola iniciará directamente con tu sesión activa.`);
}

function renderUserProfileBadge() {
  const container = document.getElementById('userProfileArea');
  if (!container || !adminState.currentUser) return;

  const u = adminState.currentUser;
  const initials = u.nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  container.innerHTML = `
    <div class="user-profile-pill">
      <div class="user-avatar-circle">${initials}</div>
      <div style="line-height: 1.2;">
        <strong style="color: #fff; font-size: 12px;">${u.nombre}</strong>
        <div style="font-size: 10px; color: var(--amber); font-weight: 600;">👑 ${u.cargo || 'Superusuario'}</div>
      </div>
      <button class="btn-secondary" style="padding: 2px 8px; font-size: 10px;" onclick="restablecerSuperusuario()" title="Reiniciar credenciales para pruebas">
        Reiniciar
      </button>
    </div>
  `;
}

function restablecerSuperusuario() {
  if (confirm('¿Desea cerrar la sesión del Superusuario y volver a habilitar el formulario de Registro Inicial?')) {
    localStorage.removeItem(STORAGE_KEYS.SUPERUSER);
    adminState.currentUser = null;
    location.reload();
  }
}

// ── 2. NAVEGACIÓN ENTRE SECCIONES ───────────────────────────────────────────
function switchAdminTab(tabName) {
  adminState.activeTab = tabName;

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  const activeNavItem = document.getElementById(`nav-${tabName}`);
  if (activeNavItem) activeNavItem.classList.add('active');

  document.querySelectorAll('.admin-section').forEach(sec => {
    sec.style.display = 'none';
  });

  const targetSec = document.getElementById(`section-${tabName}`);
  if (targetSec) targetSec.style.display = 'flex';

  if (tabName === 'despacho') renderDespachoTable();
  if (tabName === 'manifiesto') renderManifiestoANT();
  if (tabName === 'liquidaciones') renderLiquidacionesTable();
  if (tabName === 'flota') renderFlotaTables();
  if (tabName === 'usuarios') renderUsuariosTable();
  if (tabName === 'radar') renderRadarTelemetria();
}

// ── 3. MÓDULO DE REGISTRO DE CHOFERES ───────────────────────────────────────
function abrirModalNuevoChofer() {
  // Poblar select de unidades vehiculares disponibles
  const selectPlaca = document.getElementById('choferUnidadPlaca');
  if (selectPlaca) {
    selectPlaca.innerHTML = `<option value="Sin Asignar">-- Sin Unidad Asignada --</option>` +
      adminState.vehiculos.map(v => `<option value="${v.placa}">${v.placa} · ${v.modelo} (${v.tipo})</option>`).join('');
  }
  document.getElementById('modalNuevoChofer').style.display = 'flex';
}

function cerrarModalNuevoChofer() {
  document.getElementById('modalNuevoChofer').style.display = 'none';
}

function guardarNuevoChofer() {
  const nombre = document.getElementById('choferNombre').value.trim();
  const cedula = document.getElementById('choferCedula').value.trim();
  const licencia = document.getElementById('choferLicencia').value;
  const vigencia = document.getElementById('choferVigencia').value || '2028-12-31';
  const telefono = document.getElementById('choferTelefono').value.trim();
  const correo = document.getElementById('choferCorreo').value.trim();
  const unidad = document.getElementById('choferUnidadPlaca').value;
  const estado = document.getElementById('choferEstado').value;

  if (!nombre || !cedula || !telefono) {
    alert('Complete los nombres, cédula y teléfono del conductor.');
    return;
  }

  if (!validarCedulaEcuatoriana(cedula)) {
    alert('⚠️ Cédula de Identidad no válida (Módulo 10). Verifique los 10 dígitos.');
    return;
  }

  if (adminState.choferes.some(c => c.cedula === cedula)) {
    alert('Ya existe un chofer registrado con este número de cédula.');
    return;
  }

  const nuevoChofer = {
    id: `ch-${Date.now()}`,
    nombre: nombre,
    cedula: cedula,
    licencia: licencia,
    vigenciaLicencia: vigencia,
    telefono: telefono,
    correo: correo || `${nombre.toLowerCase().replace(/\s+/g, '.')}@macondo.ec`,
    unidadAsignada: unidad,
    estado: estado,
    viajesHoy: 0
  };

  adminState.choferes.push(nuevoChofer);
  saveState('choferes');

  // Si asignó unidad, actualizar el vehículo
  if (unidad && unidad !== 'Sin Asignar') {
    const v = adminState.vehiculos.find(veh => veh.placa === unidad);
    if (v) {
      v.choferAsignado = nombre;
      saveState('vehiculos');
    }
  }

  cerrarModalNuevoChofer();
  renderFlotaTables();
  poblarSelectoresTurno();

  alert(`✓ ¡Conductor profesional ${nombre} registrado exitosamente en la Cooperativa Macondo Express!`);
}

function cambiarEstadoChofer(choferId, nuevoEstado) {
  const ch = adminState.choferes.find(c => c.id === choferId);
  if (ch) {
    ch.estado = nuevoEstado;
    saveState('choferes');
    renderFlotaTables();
  }
}

// ── 4. MÓDULO DE REGISTRO DE UNIDADES DE TRANSPORTE ──────────────────────────
function abrirModalNuevaUnidad() {
  const selectChofer = document.getElementById('unidadChoferAsignado');
  if (selectChofer) {
    selectChofer.innerHTML = `<option value="Sin Chofer">-- Sin Chofer Asignado --</option>` +
      adminState.choferes.map(c => `<option value="${c.nombre}">${c.nombre} (Céd: ${c.cedula})</option>`).join('');
  }
  document.getElementById('modalNuevaUnidad').style.display = 'flex';
}

function cerrarModalNuevaUnidad() {
  document.getElementById('modalNuevaUnidad').style.display = 'none';
}

function guardarNuevaUnidad() {
  const placa = document.getElementById('unidadPlaca').value.trim().toUpperCase();
  const tipo = document.getElementById('unidadTipo').value;
  const modelo = document.getElementById('unidadModelo').value.trim();
  const anio = parseInt(document.getElementById('unidadAnio').value, 10) || 2023;
  const disco = document.getElementById('unidadDisco').value.trim() || `Unidad #${adminState.vehiculos.length + 1}`;
  const soatVence = document.getElementById('unidadSoatVence').value || '2027-12-31';
  const chofer = document.getElementById('unidadChoferAsignado').value;
  const estado = document.getElementById('unidadEstado').value;

  if (!placa || !modelo) {
    alert('Ingrese la placa oficial y el modelo del vehículo.');
    return;
  }

  if (!/^[A-Z]{3}-\d{3,4}$/.test(placa)) {
    alert('⚠️ Formato de placa no válido para Ecuador. Debe ser tres letras, guión y 3 o 4 dígitos (ej: GBA-4123 u OBA-589).');
    return;
  }

  if (adminState.vehiculos.some(v => v.placa === placa)) {
    alert('Ya existe una unidad de transporte registrada con esa placa.');
    return;
  }

  const nuevaUnidad = {
    placa: placa,
    tipo: tipo, // Sedán o Camioneta Doble Cabina
    modelo: modelo,
    anio: anio,
    disco: disco,
    cupos: 4, // Bloqueado estrictamente por regulación ANT
    choferAsignado: chofer,
    estado: estado,
    soatVigente: true,
    soatVence: soatVence,
    rtvVigente: true
  };

  adminState.vehiculos.push(nuevaUnidad);
  saveState('vehiculos');

  cerrarModalNuevaUnidad();
  renderFlotaTables();
  poblarSelectoresTurno();

  alert(`✓ ¡Unidad ${placa} (${modelo} · 4 cupos máximos) registrada exitosamente en el parque automotor homologado!`);
}

function cambiarEstadoUnidad(placa, nuevoEstado) {
  const v = adminState.vehiculos.find(veh => veh.placa === placa);
  if (v) {
    v.estado = nuevoEstado;
    saveState('vehiculos');
    renderFlotaTables();
  }
}

// ── 5. MÓDULO DE USUARIOS DEL SISTEMA & ROLES DE INGRESO ─────────────────────
function renderUsuariosTable() {
  const tbody = document.getElementById('tbodyUsuarios');
  if (!tbody) return;
  tbody.innerHTML = '';

  adminState.usuarios.forEach((u, i) => {
    const tr = document.createElement('tr');
    let badgeClass = 'badge-blue';
    let rolePill = `<span class="badge badge-blue">Despachador</span>`;

    if (u.rol === 'superadmin') {
      badgeClass = 'badge-purple';
      rolePill = `<span class="badge badge-purple" style="font-weight: 800;">👑 Superusuario</span>`;
    } else if (u.rol === 'auditor_caja') {
      badgeClass = 'badge-green';
      rolePill = `<span class="badge badge-green">💵 Auditor Caja</span>`;
    } else if (u.rol === 'operador_gps') {
      badgeClass = 'badge-amber';
      rolePill = `<span class="badge badge-amber">🛰️ Operador GPS</span>`;
    }

    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>
        <strong style="color: #fff;">${u.nombre}</strong><br>
        <span style="font-size: 11px; color: var(--text-dim);">Cédula: ${u.cedula}</span>
      </td>
      <td>${rolePill}</td>
      <td>📞 ${u.telefono}<br><span style="font-size: 11px; color: var(--text-dim);">${u.correo}</span></td>
      <td><span style="color: var(--accent); font-weight: 600;">${u.sede}</span></td>
      <td><span class="badge badge-green">${u.estado || 'Activo'}</span></td>
      <td>
        ${u.rol === 'superadmin' 
          ? `<span style="font-size: 11px; color: var(--amber);">Cuenta Maestra</span>` 
          : `<button class="btn-secondary" style="padding: 3px 8px; font-size: 11px;" onclick="eliminarUsuario('${u.id}')">Eliminar</button>`}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function abrirModalNuevoUsuario() {
  document.getElementById('modalNuevoUsuario').style.display = 'flex';
}

function cerrarModalNuevoUsuario() {
  document.getElementById('modalNuevoUsuario').style.display = 'none';
}

function guardarNuevoUsuario() {
  const nombre = document.getElementById('usrNombre').value.trim();
  const cedula = document.getElementById('usrCedula').value.trim();
  const correo = document.getElementById('usrCorreo').value.trim();
  const telefono = document.getElementById('usrTelefono').value.trim();
  const rol = document.getElementById('usrRol').value;
  const sede = document.getElementById('usrSede').value;
  const password = document.getElementById('usrPassword').value;

  if (!nombre || !cedula || !correo || !password) {
    alert('Complete los campos obligatorios del usuario.');
    return;
  }

  if (!validarCedulaEcuatoriana(cedula)) {
    alert('⚠️ Cédula no válida según el algoritmo Módulo 10 de Ecuador.');
    return;
  }

  const roleLabels = {
    superadmin: 'Superusuario (Acceso Total)',
    despachador: 'Despachador de Terminal',
    auditor_caja: 'Auditor de Caja & Liquidaciones',
    operador_gps: 'Operador Telemetría GPS'
  };

  const nuevoUsr = {
    id: `usr-${Date.now()}`,
    nombre: nombre,
    cedula: cedula,
    correo: correo,
    telefono: telefono,
    rol: rol,
    rolLabel: roleLabels[rol] || rol,
    sede: sede,
    estado: 'Activo',
    fechaCreacion: new Date().toISOString()
  };

  adminState.usuarios.push(nuevoUsr);
  saveState('usuarios');

  cerrarModalNuevoUsuario();
  renderUsuariosTable();

  alert(`✓ ¡Usuario ${nombre} creado exitosamente con el rol "${roleLabels[rol]}"!`);
}

function eliminarUsuario(id) {
  if (confirm('¿Está seguro de revocar los accesos de este usuario?')) {
    adminState.usuarios = adminState.usuarios.filter(u => u.id !== id);
    saveState('usuarios');
    renderUsuariosTable();
  }
}

// ── 6. MÓDULO COMPLETO PARA CREAR Y DESPACHAR TURNOS ────────────────────────
function poblarSelectoresTurno() {
  // Poblar choferes disponibles
  const selectChofer = document.getElementById('nuevoTurnoChofer');
  if (selectChofer) {
    selectChofer.innerHTML = adminState.choferes.map(c => `
      <option value="${c.nombre}" data-cedula="${c.cedula}" data-licencia="${c.licencia}" data-telefono="${c.telefono}">
        ${c.nombre} (${c.licencia} · ${c.estado})
      </option>
    `).join('');
  }

  // Poblar vehículos homologados (máx 4 pax)
  const selectPlaca = document.getElementById('nuevoTurnoPlaca');
  if (selectPlaca) {
    selectPlaca.innerHTML = adminState.vehiculos.map(v => `
      <option value="${v.placa}" data-modelo="${v.modelo}" data-tipo="${v.tipo}">
        ${v.placa} · ${v.modelo} (${v.tipo} · Máx 4 Cupos · SOAT Ok)
      </option>
    `).join('');
  }
}

function abrirModalNuevoTurno() {
  poblarSelectoresTurno();
  const fechaInput = document.getElementById('nuevoTurnoFecha');
  if (fechaInput && !fechaInput.value) {
    fechaInput.value = new Date().toISOString().split('T')[0];
  }
  document.getElementById('modalNuevoTurno').style.display = 'flex';
}

function cerrarModalNuevoTurno() {
  document.getElementById('modalNuevoTurno').style.display = 'none';
}

function crearNuevoTurno() {
  const origen = document.getElementById('nuevoTurnoOrigen').value;
  const destino = document.getElementById('nuevoTurnoDestino').value;
  const fecha = document.getElementById('nuevoTurnoFecha').value || new Date().toISOString().split('T')[0];
  const hora = document.getElementById('nuevoTurnoHora').value || '14:30';
  const choferSelect = document.getElementById('nuevoTurnoChofer');
  const placaSelect = document.getElementById('nuevoTurnoPlaca');
  const tarifa = parseFloat(document.getElementById('nuevoTurnoTarifa').value) || 12.00;
  const obs = document.getElementById('nuevoTurnoObservaciones').value.trim();

  if (origen === destino) {
    alert('La ciudad de origen y destino no pueden ser iguales.');
    return;
  }

  const choferOption = choferSelect.options[choferSelect.selectedIndex];
  const placaOption = placaSelect.options[placaSelect.selectedIndex];

  const choferNombre = choferSelect.value;
  const choferCedula = choferOption ? choferOption.getAttribute('data-cedula') : '0703849201';
  const choferLicencia = choferOption ? choferOption.getAttribute('data-licencia') : 'Tipo C (Profesional)';
  const choferTelefono = choferOption ? choferOption.getAttribute('data-telefono') : '0990011223';

  const placa = placaSelect.value;
  const modelo = placaOption ? placaOption.getAttribute('data-modelo') : 'Automóvil Homologado';

  // Paradas intermedias seleccionadas
  const paradas = [];
  document.querySelectorAll('input[name="paradasIntermedias"]:checked').forEach(cb => {
    paradas.push(cb.value);
  });

  const num = String(adminState.turnos.length + 1).padStart(2, '0');
  const codigo = `TRN-${origen.substring(0,3).toUpperCase()}-${destino.substring(0,3).toUpperCase()}-${num}`;

  const nuevoTurno = {
    id: `trn-${Date.now()}`,
    codigo: codigo,
    rutaOrigen: origen,
    rutaDestino: destino,
    paradas: paradas.length > 0 ? paradas : ['Ruta Directa E25'],
    fechaSalida: fecha,
    horaSalida: hora,
    choferNombre: choferNombre,
    choferCedula: choferCedula,
    choferLicencia: choferLicencia,
    choferTelefono: choferTelefono,
    vehiculoPlaca: placa,
    vehiculoModelo: modelo,
    cuposTotales: 4, // 4 pasajeros estricto
    cuposOcupados: 0,
    tarifaPorCupo: tarifa,
    totalEfectivo: 0.00,
    cuotaCooperativa: 6.00,
    observaciones: obs,
    estado: 'programado', // 'programado', 'en_abordaje', 'en_ruta', 'liquidado'
    pasajeros: []
  };

  adminState.turnos.unshift(nuevoTurno);
  saveState('turnos');

  cerrarModalNuevoTurno();
  renderDespachoTable();

  alert(`✓ ¡Turno ${codigo} Creado Exitosamente!\n• Ruta: ${origen} ➔ ${destino}\n• Conductor: ${choferNombre}\n• Unidad: ${placa} (Máximo 4 pasajeros)\n• Hora: ${hora} (${fecha})\n\nDisponible de inmediato para reservas en la App de Pasajeros.`);
}

// ── REGISTRO DE PASAJERO EN VENTANILLA DIRECTA ──────────────────────────────
function abrirModalAgregarPasajero(turnoId) {
  adminState.turnoEnEdicionId = turnoId;
  const turno = adminState.turnos.find(t => t.id === turnoId);
  if (!turno) return;

  const disponibles = turno.cuposTotales - turno.cuposOcupados;
  if (disponibles <= 0) {
    alert('Este turno ya ha completado su capacidad máxima permitida de 4 pasajeros.');
    return;
  }

  document.getElementById('modalVentanillaTurnoCodigo').innerText = `${turno.codigo} (${turno.rutaOrigen} ➔ ${turno.rutaDestino})`;
  document.getElementById('modalVentanillaCuposLibres').innerText = `${disponibles} cupos disponibles`;

  // Poblar select de cupos
  const selectPuestos = document.getElementById('ventanillaPuestos');
  selectPuestos.innerHTML = '';
  for (let i = 1; i <= disponibles; i++) {
    selectPuestos.innerHTML += `<option value="${i}">${i} ${i === 1 ? 'puesto ($12.00)' : `puestos ($${i * 12}.00)`}</option>`;
  }

  // Generar PIN aleatorio de 4 dígitos
  document.getElementById('ventanillaPin').value = String(Math.floor(1000 + Math.random() * 9000));

  document.getElementById('modalAgregarPasajeroVentanilla').style.display = 'flex';
}

function cerrarModalAgregarPasajero() {
  document.getElementById('modalAgregarPasajeroVentanilla').style.display = 'none';
  adminState.turnoEnEdicionId = null;
}

function guardarPasajeroVentanilla() {
  const turno = adminState.turnos.find(t => t.id === adminState.turnoEnEdicionId);
  if (!turno) return;

  const nombre = document.getElementById('ventanillaNombre').value.trim();
  const cedula = document.getElementById('ventanillaCedula').value.trim();
  const telefono = document.getElementById('ventanillaTelefono').value.trim();
  const direccion = document.getElementById('ventanillaDireccion').value.trim();
  const puestos = parseInt(document.getElementById('ventanillaPuestos').value, 10);
  const pin = document.getElementById('ventanillaPin').value;

  if (!nombre || !cedula || !telefono || !direccion) {
    alert('Por favor complete todos los datos del pasajero para emitir el boleto y constar en el Manifiesto ANT.');
    return;
  }

  if (!validarCedulaEcuatoriana(cedula)) {
    alert('⚠️ Cédula no válida (Módulo 10). Para el Manifiesto Legal ANT se requiere cédula real ecuatoriana.');
    return;
  }

  const monto = puestos * (turno.tarifaPorCupo || 12.00);

  const nuevoPasajero = {
    id: `p-${Date.now()}`,
    nombre: nombre,
    cedula: cedula,
    telefono: telefono,
    direccion: direccion,
    puestos: puestos,
    monto: monto,
    pin: pin,
    aBordo: false,
    horaAbordaje: null
  };

  turno.pasajeros.push(nuevoPasajero);
  turno.cuposOcupados += puestos;
  turno.totalEfectivo += monto;

  saveState('turnos');
  cerrarModalAgregarPasajero();
  renderDespachoTable();

  alert(`✓ ¡Pasaje emitido en ventanilla!\n• Pasajero: ${nombre}\n• Puestos: ${puestos}\n• Cobro Efectivo: $${monto.toFixed(2)}\n• PIN de Abordaje: ${pin}\n\nAgregado automáticamente al Manifiesto ANT.`);
}

function cambiarEstadoTurno(turnoId, nuevoEstado) {
  const t = adminState.turnos.find(trn => trn.id === turnoId);
  if (!t) return;

  t.estado = nuevoEstado;
  
  if (nuevoEstado === 'liquidado') {
    // Generar arqueo en auditoría
    const totalPasajes = t.totalEfectivo;
    const cuota = 6.00;
    const peaje = 2.00;
    const combustible = 12.00;
    const neto = totalPasajes - cuota - peaje - combustible;

    const liq = {
      id: `liq-${Date.now()}`,
      turnoCodigo: t.codigo,
      fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
      chofer: t.choferNombre,
      placa: t.vehiculoPlaca,
      totalPasajes: totalPasajes,
      totalEncomiendas: 0.00,
      totalRecaudado: totalPasajes,
      cuotaCooperativa: cuota,
      gastosPeaje: peaje,
      gastosCombustible: combustible,
      gananciaNetaChofer: neto > 0 ? neto : 0,
      estado: 'auditado'
    };
    adminState.liquidaciones.unshift(liq);
    saveState('liquidaciones');
  }

  saveState('turnos');
  renderDespachoTable();
}

// ── 7. RENDER DE TABLA DE DESPACHO ──────────────────────────────────────────
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
    } else if (t.estado === 'en_abordaje') {
      badgeClass = 'badge-blue';
      estadoLabel = 'ABORDAJE';
    } else if (t.estado === 'liquidado') {
      badgeClass = 'badge-purple';
      estadoLabel = 'LIQUIDADO';
    }

    tr.innerHTML = `
      <td>
        <strong style="color: #fff; font-family: monospace; font-size: 13px;">${t.codigo}</strong><br>
        <span style="font-size: 10px; color: var(--text-dim);">${t.paradas ? t.paradas.join(' · ') : 'Directo'}</span>
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
          ${libres === 0 ? '⚠️ Lleno (4 pax)' : `${libres} puestos libres`}
        </div>
      </td>
      <td>
        <strong style="color: var(--amber); font-size: 13px;">$${t.totalEfectivo.toFixed(2)}</strong><br>
        <span style="font-size: 10px; color: var(--accent);">Cuota: $${(t.cuotaCooperativa || 6).toFixed(2)}</span>
      </td>
      <td>
        <span class="badge ${badgeClass}">${estadoLabel}</span>
      </td>
      <td>
        <div style="display: flex; gap: 4px; flex-wrap: wrap;">
          <button class="btn btn-outline" style="padding: 4px 8px; font-size: 11px;" onclick="verManifiestoDeTurno('${t.id}')">
            📋 Manifiesto
          </button>
          ${libres > 0 && t.estado !== 'liquidado' ? `
            <button class="btn btn-primary" style="padding: 4px 8px; font-size: 11px;" onclick="abrirModalAgregarPasajero('${t.id}')">
              + Pax
            </button>
          ` : ''}
          ${t.estado === 'programado' ? `
            <button class="btn-secondary" style="padding: 4px 6px; font-size: 10px;" onclick="cambiarEstadoTurno('${t.id}', 'en_ruta')">
              🚀 En Ruta
            </button>
          ` : ''}
          ${t.estado === 'en_ruta' ? `
            <button class="btn-secondary" style="padding: 4px 6px; font-size: 10px; color: var(--accent);" onclick="cambiarEstadoTurno('${t.id}', 'liquidado')">
              ✓ Liquidar
            </button>
          ` : ''}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function verManifiestoDeTurno(turnoId) {
  adminState.selectedTurnoManifiestoId = turnoId;
  switchAdminTab('manifiesto');
}

// ── 8. RENDER DE MANIFIESTO OFICIAL DE TRÁNSITO ANT ─────────────────────────
function renderManifiestoANT() {
  const turno = adminState.turnos.find(t => t.id === adminState.selectedTurnoManifiestoId) || adminState.turnos[0];
  if (!turno) return;

  const selector = document.getElementById('selectTurnoManifiesto');
  if (selector) {
    selector.innerHTML = adminState.turnos.map(t => `
      <option value="${t.id}" ${t.id === turno.id ? 'selected' : ''}>
        ${t.codigo} (${t.rutaOrigen} ➔ ${t.rutaDestino} · ${t.horaSalida})
      </option>
    `).join('');
  }

  document.getElementById('mftRuta').innerText = `${turno.rutaOrigen} ➔ ${turno.rutaDestino}`;
  document.getElementById('mftFechaHora').innerText = `${turno.fechaSalida} a las ${turno.horaSalida}`;
  document.getElementById('mftChofer').innerText = `${turno.choferNombre} (Céd: ${turno.choferCedula}) - ${turno.choferLicencia}`;
  document.getElementById('mftVehiculo').innerText = `Placa ${turno.vehiculoPlaca} (${turno.vehiculoModelo} · Capacidad: 4 Puestos)`;
  document.getElementById('mftOcupacion').innerText = `${turno.cuposOcupados} de 4 puestos reservados`;

  const tbody = document.getElementById('tbodyManifiestoPasajeros');
  tbody.innerHTML = '';

  if (turno.pasajeros.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-dim); padding: 20px;">No hay registros de pasajeros cargados en este turno.</td></tr>`;
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
    <div class="printable-manifest">
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
    </div>
  `;

  window.print();
}

// ── 9. RENDER DE AUDITORÍA DE LIQUIDACIONES ──────────────────────────────────
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

// ── 10. RENDER DE FLOTA Y CONDUCTORES ────────────────────────────────────────
function renderFlotaTables() {
  const tbodyCh = document.getElementById('tbodyChoferes');
  if (tbodyCh) {
    tbodyCh.innerHTML = adminState.choferes.map((c, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>
          <strong style="color: #fff;">${c.nombre}</strong><br>
          <span style="font-size: 11px; color: var(--text-dim);">${c.correo || ''}</span>
        </td>
        <td>${c.cedula}</td>
        <td>
          <span class="badge badge-blue">${c.licencia}</span><br>
          <span style="font-size: 10px; color: var(--text-dim);">Vence: ${c.vigenciaLicencia || '2028'}</span>
        </td>
        <td>📞 ${c.telefono}</td>
        <td>
          <span style="font-family: monospace; font-weight: 700; color: var(--amber);">${c.unidadAsignada || 'Sin Asignar'}</span>
        </td>
        <td>
          <select class="admin-select" style="padding: 2px 6px; font-size: 11px; width: auto;" onchange="cambiarEstadoChofer('${c.id}', this.value)">
            <option value="Disponible" ${c.estado === 'Disponible' ? 'selected' : ''}>Disponible</option>
            <option value="En Ruta" ${c.estado === 'En Ruta' ? 'selected' : ''}>En Ruta</option>
            <option value="Descanso" ${c.estado === 'Descanso' ? 'selected' : ''}>Descanso</option>
            <option value="Inactivo" ${c.estado === 'Inactivo' ? 'selected' : ''}>Inactivo</option>
          </select>
        </td>
        <td><strong>${c.viajesHoy || 0}</strong></td>
      </tr>
    `).join('');
  }

  const tbodyVeh = document.getElementById('tbodyVehiculos');
  if (tbodyVeh) {
    tbodyVeh.innerHTML = adminState.vehiculos.map(v => `
      <tr>
        <td>
          <strong style="font-family: monospace; color: var(--amber); font-size: 13px;">${v.placa}</strong><br>
          <span style="font-size: 10px; color: var(--text-dim);">${v.disco || ''}</span>
        </td>
        <td>
          <strong style="color: #fff;">${v.modelo}</strong><br>
          <span style="font-size: 11px; color: var(--text-dim);">${v.tipo} (${v.anio})</span>
        </td>
        <td>
          <span style="background: var(--bg-space); padding: 4px 8px; border-radius: 6px; font-weight: bold; border: 1px solid var(--accent); color: var(--accent);">
            Máx 4 Puestos (ANT)
          </span>
        </td>
        <td>
          <span style="color: #fff; font-size: 12px;">${v.choferAsignado || 'Sin Asignar'}</span>
        </td>
        <td>
          <span class="badge badge-green">✓ SOAT Vigente</span><br>
          <span style="font-size: 10px; color: var(--text-dim);">Vence: ${v.soatVence || '2027'}</span>
        </td>
        <td>
          <select class="admin-select" style="padding: 2px 6px; font-size: 11px; width: auto;" onchange="cambiarEstadoUnidad('${v.placa}', this.value)">
            <option value="En Ruta" ${v.estado === 'En Ruta' ? 'selected' : ''}>En Ruta</option>
            <option value="En Espera" ${v.estado === 'En Espera' ? 'selected' : ''}>En Espera</option>
            <option value="En Terminal" ${v.estado === 'En Terminal' ? 'selected' : ''}>En Terminal</option>
            <option value="Mantenimiento" ${v.estado === 'Mantenimiento' ? 'selected' : ''}>Mantenimiento</option>
          </select>
        </td>
      </tr>
    `).join('');
  }
}

// ── 11. RADAR GPS & TELEMETRÍA SATELITAL ────────────────────────────────────
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

// ── INICIALIZACIÓN GENERAL AL CARGAR EL DOM ──────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initLocalStorageData();
  checkSuperUserSetup();
  poblarSelectoresTurno();
  switchAdminTab('despacho');
});
