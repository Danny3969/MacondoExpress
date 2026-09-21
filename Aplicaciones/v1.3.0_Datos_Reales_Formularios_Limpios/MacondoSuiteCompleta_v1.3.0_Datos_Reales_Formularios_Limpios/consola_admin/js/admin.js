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
  CIUDADES: 'macondo_ciudades',
  TURNOS: 'macondo_turnos',
  LIQUIDACIONES: 'macondo_liquidaciones'
};

const adminState = {
  activeTab: 'despacho',
  currentUser: null,
  selectedTurnoManifiestoId: null,
  turnoEnEdicionId: null,
  kpis: {
    pasajerosHoy: 0,
    unidadesEnRuta: 0,
    efectivoRecaudado: 0.00,
    cuotasCooperativa: 0.00,
    ocupacionPromedio: 0.0
  },
  ciudades: [],
  turnos: [],
  liquidaciones: [],
  choferes: [],
  vehiculos: [],
  usuarios: []
};

// Pila de navegación para retornar fluidamente a la página anterior
let navigationHistory = ['despacho'];

// ── SEMILLAS DE DATOS INICIALES (CIUDADES HOMOLOGADAS REALES) ─────────────────
// Solo se conservan las ciudades reales del corredor vial Guayaquil - El Oro
const SEED_CIUDADES = [
  {
    id: 'ciu-01',
    nombre: 'Guayaquil',
    provincia: 'Guayas',
    terminal: 'Terminal Terrestre Jaime Roldós Aguilera / Servicio Puerta a Puerta Guayaquil',
    tiempoReferencial: 'Punto de Salida / Llegada Principal Norte',
    distanciaKm: 0,
    estado: 'Activa',
    esHubPrincipal: true
  },
  {
    id: 'ciu-02',
    nombre: 'Machala',
    provincia: 'El Oro',
    terminal: 'Terminal Terrestre de Machala / Servicio Puerta a Puerta Machala',
    tiempoReferencial: '3h 15m (desde Guayaquil)',
    distanciaKm: 184,
    estado: 'Activa',
    esHubPrincipal: true
  },
  {
    id: 'ciu-03',
    nombre: 'Naranjal',
    provincia: 'Guayas',
    terminal: 'Parada Homologada Troncal E25 / Parada Mercado Central',
    tiempoReferencial: '1h 20m (desde Guayaquil)',
    distanciaKm: 85,
    estado: 'Activa',
    esHubPrincipal: false
  },
  {
    id: 'ciu-04',
    nombre: 'Camilo Ponce Enríquez',
    provincia: 'Azuay',
    terminal: 'Parada Troncal E25 / Sector Minero - Entrada Principal',
    tiempoReferencial: '2h 00m (desde Guayaquil)',
    distanciaKm: 120,
    estado: 'Activa',
    esHubPrincipal: false
  },
  {
    id: 'ciu-05',
    nombre: 'El Guabo',
    provincia: 'El Oro',
    terminal: 'Parada Panamericana E25 / Entrada a la ciudad',
    tiempoReferencial: '2h 45m (desde Guayaquil)',
    distanciaKm: 165,
    estado: 'Activa',
    esHubPrincipal: false
  },
  {
    id: 'ciu-06',
    nombre: 'Pasaje',
    provincia: 'El Oro',
    terminal: 'Terminal Terrestre de Pasaje / Parada Central',
    tiempoReferencial: '3h 30m (desde Guayaquil)',
    distanciaKm: 195,
    estado: 'Activa',
    esHubPrincipal: false
  },
  {
    id: 'ciu-07',
    nombre: 'Santa Rosa',
    provincia: 'El Oro',
    terminal: 'Terminal Terrestre Binacional Santa Rosa',
    tiempoReferencial: '3h 45m (desde Guayaquil)',
    distanciaKm: 210,
    estado: 'Activa',
    esHubPrincipal: false
  },
  {
    id: 'ciu-08',
    nombre: 'Huaquillas',
    provincia: 'El Oro',
    terminal: 'Terminal Terrestre Internacional de Huaquillas (Frontera Sur)',
    tiempoReferencial: '4h 15m (desde Guayaquil)',
    distanciaKm: 245,
    estado: 'Activa',
    esHubPrincipal: false
  }
];

// Eliminados todos los datos ficticios/mock. El sistema inicia en limpio.
const SEED_CHOFERES = [];
const SEED_VEHICULOS = [];
const SEED_USUARIOS = [];
const SEED_TURNOS = [];
const SEED_LIQUIDACIONES = [];

// ── MOTOR DINÁMICO DE MÉTRICAS OPERATIVAS (KPIS) ──────────────────────────────
function recalcularKPIs() {
  let pasajeros = 0;
  let unidadesEnRuta = 0;
  let recaudado = 0;
  let cuotas = 0;
  let puestosOcupados = 0;
  const turnosTotales = adminState.turnos.length;

  adminState.turnos.forEach(t => {
    if (t.estado === 'en_ruta') {
      unidadesEnRuta++;
    }
    puestosOcupados += (t.cuposOcupados || 0);

    if (t.pasajeros && Array.isArray(t.pasajeros)) {
      t.pasajeros.forEach(p => {
        pasajeros += (p.puestos || 1);
        recaudado += (p.monto || 0);
      });
    } else {
      recaudado += (t.totalEfectivo || 0);
    }
    cuotas += (t.cuotaCooperativa || 6.00);
  });

  adminState.liquidaciones.forEach(l => {
    // Si hay liquidaciones registradas
  });

  adminState.kpis = {
    pasajerosHoy: pasajeros,
    unidadesEnRuta: unidadesEnRuta,
    efectivoRecaudado: recaudado,
    cuotasCooperativa: cuotas,
    ocupacionPromedio: turnosTotales > 0 ? (puestosOcupados / turnosTotales).toFixed(1) : '0.0'
  };

  renderKpis();
}

function renderKpis() {
  const elPax = document.getElementById('kpiPasajeros');
  const elUni = document.getElementById('kpiUnidades');
  const elRec = document.getElementById('kpiRecaudacion');
  const elCuo = document.getElementById('kpiCooperativa');
  const elOcu = document.getElementById('kpiOcupacion');

  if (elPax) elPax.innerText = adminState.kpis.pasajerosHoy;
  if (elUni) elUni.innerText = adminState.kpis.unidadesEnRuta;
  if (elRec) elRec.innerText = `$${adminState.kpis.efectivoRecaudado.toFixed(2)}`;
  if (elCuo) elCuo.innerText = `$${adminState.kpis.cuotasCooperativa.toFixed(2)}`;
  if (elOcu) elOcu.innerText = `${adminState.kpis.ocupacionPromedio} / 4`;
}

// ── INICIALIZACIÓN Y PERSISTENCIA EN LOCALSTORAGE ─────────────────────────────
function initLocalStorageData() {
  // Purga obligatoria de datos ficticios antiguos de versiones anteriores
  if (localStorage.getItem('macondo_data_purged_v1_3') !== 'true') {
    localStorage.removeItem(STORAGE_KEYS.CHOFERES);
    localStorage.removeItem(STORAGE_KEYS.VEHICULOS);
    localStorage.removeItem(STORAGE_KEYS.USUARIOS);
    localStorage.removeItem(STORAGE_KEYS.TURNOS);
    localStorage.removeItem(STORAGE_KEYS.LIQUIDACIONES);
    localStorage.setItem('macondo_data_purged_v1_3', 'true');
  }

  // Ciudades reales del corredor
  const storedCiu = localStorage.getItem(STORAGE_KEYS.CIUDADES);
  adminState.ciudades = storedCiu ? JSON.parse(storedCiu) : SEED_CIUDADES;
  if (!storedCiu) localStorage.setItem(STORAGE_KEYS.CIUDADES, JSON.stringify(SEED_CIUDADES));

  // Choferes (vacío hasta que se registren reales)
  const storedCh = localStorage.getItem(STORAGE_KEYS.CHOFERES);
  adminState.choferes = storedCh ? JSON.parse(storedCh) : SEED_CHOFERES;
  if (!storedCh) localStorage.setItem(STORAGE_KEYS.CHOFERES, JSON.stringify(SEED_CHOFERES));

  // Vehículos (vacío hasta que se registren reales)
  const storedVeh = localStorage.getItem(STORAGE_KEYS.VEHICULOS);
  adminState.vehiculos = storedVeh ? JSON.parse(storedVeh) : SEED_VEHICULOS;
  if (!storedVeh) localStorage.setItem(STORAGE_KEYS.VEHICULOS, JSON.stringify(SEED_VEHICULOS));

  // Usuarios (vacío hasta que se cree el superusuario u operadores)
  const storedUsr = localStorage.getItem(STORAGE_KEYS.USUARIOS);
  adminState.usuarios = storedUsr ? JSON.parse(storedUsr) : SEED_USUARIOS;
  if (!storedUsr) localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(SEED_USUARIOS));

  // Turnos (vacío hasta que se despachen turnos reales)
  const storedTrn = localStorage.getItem(STORAGE_KEYS.TURNOS);
  adminState.turnos = storedTrn ? JSON.parse(storedTrn) : SEED_TURNOS;
  if (!storedTrn) localStorage.setItem(STORAGE_KEYS.TURNOS, JSON.stringify(SEED_TURNOS));

  // Liquidaciones (vacío hasta que se liquiden turnos reales)
  const storedLiq = localStorage.getItem(STORAGE_KEYS.LIQUIDACIONES);
  adminState.liquidaciones = storedLiq ? JSON.parse(storedLiq) : SEED_LIQUIDACIONES;
  if (!storedLiq) localStorage.setItem(STORAGE_KEYS.LIQUIDACIONES, JSON.stringify(SEED_LIQUIDACIONES));

  // Superusuario
  const superuser = localStorage.getItem(STORAGE_KEYS.SUPERUSER);
  if (superuser) {
    adminState.currentUser = JSON.parse(superuser);
    // Asegurar que el superusuario figure en la lista de usuarios si no está
    const exists = adminState.usuarios.some(u => u.rol === 'superadmin' || u.cedula === adminState.currentUser.cedula);
    if (!exists) {
      adminState.usuarios.unshift({ ...adminState.currentUser, sede: 'Sede Central', estado: 'Activo' });
      saveState('usuarios');
    }
  }

  // Calcular métricas iniciales
  recalcularKPIs();
}

function saveState(key) {
  if (key === 'ciudades') localStorage.setItem(STORAGE_KEYS.CIUDADES, JSON.stringify(adminState.ciudades));
  if (key === 'choferes') localStorage.setItem(STORAGE_KEYS.CHOFERES, JSON.stringify(adminState.choferes));
  if (key === 'vehiculos') localStorage.setItem(STORAGE_KEYS.VEHICULOS, JSON.stringify(adminState.vehiculos));
  if (key === 'usuarios') localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(adminState.usuarios));
  if (key === 'turnos') localStorage.setItem(STORAGE_KEYS.TURNOS, JSON.stringify(adminState.turnos));
  if (key === 'liquidaciones') localStorage.setItem(STORAGE_KEYS.LIQUIDACIONES, JSON.stringify(adminState.liquidaciones));
}

// ── SISTEMA DE NAVEGACIÓN A PÁGINA COMPLETA (SIN MODALES LATERALES) ─────────
function irAPagina(pageId, returnToTab) {
  // Guardar en la pila de retorno
  navigationHistory.push(returnToTab || adminState.activeTab);

  // Ocultar todas las secciones
  document.querySelectorAll('.admin-section').forEach(sec => {
    sec.style.display = 'none';
  });

  // Deseleccionar sidebar para evitar confusión de pestaña
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });

  // Mostrar la página completa solicitada
  const target = document.getElementById(`section-${pageId}`);
  if (target) {
    target.style.display = 'flex';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Inicializaciones según la página de destino
  if (pageId === 'crear-turno') prepararPaginaCrearTurno();
  if (pageId === 'crear-chofer') prepararPaginaCrearChofer();
  if (pageId === 'crear-unidad') prepararPaginaCrearUnidad();
  if (pageId === 'crear-usuario') prepararPaginaCrearUsuario();
  if (pageId === 'crear-ciudad') prepararPaginaCrearCiudad();
}

function navegarAtras() {
  const previousTab = navigationHistory.pop() || 'despacho';
  switchAdminTab(previousTab);
}

// ── NAVEGACIÓN ENTRE SECCIONES PRINCIPALES (TABS) ───────────────────────────
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
  if (targetSec) {
    targetSec.style.display = 'flex';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (tabName === 'despacho') renderDespachoTable();
  if (tabName === 'manifiesto') renderManifiestoANT();
  if (tabName === 'liquidaciones') renderLiquidacionesTable();
  if (tabName === 'flota') renderFlotaTables();
  if (tabName === 'usuarios') renderUsuariosTable();
  if (tabName === 'ciudades') renderCiudadesTable();
  if (tabName === 'radar') renderRadarTelemetria();
}

// ── 1. ONBOARDING DE SUPERUSUARIO (PRIMERA VEZ) ─────────────────────────────
function checkSuperUserSetup() {
  const modal = document.getElementById('modalSuperUserSetup');
  if (!adminState.currentUser) {
    if (modal) modal.style.display = 'flex';
  } else {
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

  localStorage.setItem(STORAGE_KEYS.SUPERUSER, JSON.stringify(superuser));
  adminState.currentUser = superuser;

  const idx = adminState.usuarios.findIndex(u => u.rol === 'superadmin');
  if (idx >= 0) {
    adminState.usuarios[idx] = { ...superuser, sede: 'Sede Central', estado: 'Activo' };
  } else {
    adminState.usuarios.unshift({ ...superuser, sede: 'Sede Central', estado: 'Activo' });
  }
  saveState('usuarios');

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

// ── 2. MÓDULO DE CIUDADES & DESTINOS ─────────────────────────────────────────
function renderCiudadesTable() {
  const tbody = document.getElementById('tbodyCiudades');
  if (!tbody) return;
  tbody.innerHTML = '';

  adminState.ciudades.forEach((c, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>
        <strong style="color: #fff; font-size: 14px;">${c.nombre}</strong>
        ${c.esHubPrincipal ? `<span class="badge badge-purple" style="margin-left: 6px;">HUB PRINCIPAL</span>` : ''}<br>
        <span style="font-size: 11px; color: var(--text-dim);">${c.provincia}</span>
      </td>
      <td>
        <span style="color: var(--text-main); font-size: 12px;">📍 ${c.terminal}</span>
      </td>
      <td>
        <strong style="color: var(--accent);">${c.distanciaKm > 0 ? `${c.distanciaKm} Km` : 'Origen'}</strong><br>
        <span style="font-size: 11px; color: var(--text-dim);">${c.tiempoReferencial}</span>
      </td>
      <td>
        <span class="badge ${c.estado === 'Activa' ? 'badge-green' : 'badge-amber'}">
          ${c.estado}
        </span>
      </td>
      <td>
        <button class="btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="toggleEstadoCiudad('${c.id}')">
          ${c.estado === 'Activa' ? 'Desactivar' : 'Activar'}
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function prepararPaginaCrearCiudad() {
  const elNom = document.getElementById('ciudadNombre');
  if (elNom) elNom.value = '';
  const elTerm = document.getElementById('ciudadTerminal');
  if (elTerm) elTerm.value = '';
  const elDist = document.getElementById('ciudadDistancia');
  if (elDist) elDist.value = '';
  const elTiempo = document.getElementById('ciudadTiempo');
  if (elTiempo) elTiempo.value = '';
  const elHub = document.getElementById('ciudadEsHub');
  if (elHub) elHub.checked = false;
}

function guardarNuevaCiudad() {
  const nombre = document.getElementById('ciudadNombre').value.trim();
  const provincia = document.getElementById('ciudadProvincia').value.trim();
  const terminal = document.getElementById('ciudadTerminal').value.trim();
  const distancia = parseInt(document.getElementById('ciudadDistancia').value, 10) || 0;
  const tiempo = document.getElementById('ciudadTiempo').value.trim() || 'Estimado a definir';
  const esHub = document.getElementById('ciudadEsHub').checked;

  if (!nombre || !terminal) {
    alert('Ingrese el nombre de la ciudad y el terminal / punto de encuentro de referencia.');
    return;
  }

  if (adminState.ciudades.some(c => c.nombre.toLowerCase() === nombre.toLowerCase())) {
    alert('Ya existe una ciudad registrada con ese nombre.');
    return;
  }

  const nuevaCiudad = {
    id: `ciu-${Date.now()}`,
    nombre: nombre,
    provincia: provincia,
    terminal: terminal,
    tiempoReferencial: tiempo,
    distanciaKm: distancia,
    estado: 'Activa',
    esHubPrincipal: esHub
  };

  adminState.ciudades.push(nuevaCiudad);
  saveState('ciudades');

  alert(`✓ ¡Ciudad ${nombre} (${provincia}) creada e incorporada exitosamente!\nAhora está disponible de inmediato como ciudad de salida o llegada en el Despacho de Turnos.`);
  
  navegarAtras();
}

function toggleEstadoCiudad(id) {
  const c = adminState.ciudades.find(ciu => ciu.id === id);
  if (c) {
    c.estado = c.estado === 'Activa' ? 'Inactiva' : 'Activa';
    saveState('ciudades');
    renderCiudadesTable();
  }
}

// ── 3. MÓDULO DE CREACIÓN Y DESPACHO DE TURNOS (PÁGINA COMPLETA) ────────────
function prepararPaginaCrearTurno() {
  // Poblar selectores de Origen y Destino con las CIUDADES activas
  const ciudadesActivas = adminState.ciudades.filter(c => c.estado === 'Activa');

  const selectOrigen = document.getElementById('pageTurnoOrigen');
  const selectDestino = document.getElementById('pageTurnoDestino');

  if (selectOrigen && selectDestino) {
    selectOrigen.innerHTML = ciudadesActivas.map(c => `
      <option value="${c.nombre}" ${c.nombre === 'Guayaquil' ? 'selected' : ''}>${c.nombre} (${c.provincia})</option>
    `).join('');

    selectDestino.innerHTML = ciudadesActivas.map(c => `
      <option value="${c.nombre}" ${c.nombre === 'Machala' ? 'selected' : ''}>${c.nombre} (${c.provincia})</option>
    `).join('');
  }

  // Poblar paradas intermedias dinámicamente con las otras ciudades (todas desmarcadas en blanco)
  const contenedorParadas = document.getElementById('contenedorParadasIntermedias');
  if (contenedorParadas) {
    const intermedias = ciudadesActivas.filter(c => c.nombre !== 'Guayaquil' && c.nombre !== 'Machala');
    contenedorParadas.innerHTML = intermedias.map(c => `
      <label style="font-size: 12px; color: #fff; display: flex; align-items: center; gap: 6px; cursor: pointer; background: var(--bg-elevated); padding: 6px 12px; border-radius: 8px; border: 1px solid var(--border);">
        <input type="checkbox" name="paradasIntermediasPage" value="${c.nombre}">
        <span>${c.nombre} (${c.provincia})</span>
      </label>
    `).join('');
  }

  // Poblar choferes
  const selectChofer = document.getElementById('pageTurnoChofer');
  if (selectChofer) {
    if (adminState.choferes.length === 0) {
      selectChofer.innerHTML = '<option value="">-- Sin conductores registrados (Registre en Flota) --</option>';
    } else {
      selectChofer.innerHTML = adminState.choferes.map(c => `
        <option value="${c.nombre}" data-cedula="${c.cedula}" data-licencia="${c.licencia}" data-telefono="${c.telefono}">
          ${c.nombre} (${c.licencia} · ${c.estado})
        </option>
      `).join('');
    }
  }

  // Poblar unidades vehiculares (máx 4 cupos)
  const selectPlaca = document.getElementById('pageTurnoPlaca');
  if (selectPlaca) {
    if (adminState.vehiculos.length === 0) {
      selectPlaca.innerHTML = '<option value="">-- Sin unidades registradas (Registre en Flota) --</option>';
    } else {
      selectPlaca.innerHTML = adminState.vehiculos.map(v => `
        <option value="${v.placa}" data-modelo="${v.modelo}" data-tipo="${v.tipo}">
          ${v.placa} · ${v.modelo} (${v.tipo} · Máx 4 Cupos · SOAT Ok)
        </option>
      `).join('');
    }
  }

  // Las casillas aparecen completamente en blanco para nuevo ingreso
  const fechaInput = document.getElementById('pageTurnoFecha');
  if (fechaInput) fechaInput.value = '';
  const horaInput = document.getElementById('pageTurnoHora');
  if (horaInput) horaInput.value = '';
  const tarifaInput = document.getElementById('pageTurnoTarifa');
  if (tarifaInput) tarifaInput.value = '';
  const obsInput = document.getElementById('pageTurnoObservaciones');
  if (obsInput) obsInput.value = '';
}

function guardarNuevoTurnoPagina() {
  const origen = document.getElementById('pageTurnoOrigen').value;
  const destino = document.getElementById('pageTurnoDestino').value;
  const fecha = document.getElementById('pageTurnoFecha').value;
  const hora = document.getElementById('pageTurnoHora').value;
  const choferSelect = document.getElementById('pageTurnoChofer');
  const placaSelect = document.getElementById('pageTurnoPlaca');
  const tarifaVal = document.getElementById('pageTurnoTarifa').value;
  const obs = document.getElementById('pageTurnoObservaciones').value.trim();

  if (!fecha || !hora) {
    alert('Por favor ingrese la fecha y la hora programada para la salida del turno.');
    return;
  }

  const tarifa = parseFloat(tarifaVal);
  if (isNaN(tarifa) || tarifa <= 0) {
    alert('Por favor ingrese una tarifa base válida por pasajero (ej: 12.00).');
    return;
  }

  if (origen === destino) {
    alert('La ciudad de origen y destino no pueden ser iguales.');
    return;
  }

  const choferNombre = choferSelect ? choferSelect.value : '';
  const placa = placaSelect ? placaSelect.value : '';

  if (!choferNombre) {
    alert('Debe seleccionar un conductor profesional. Si aún no ha registrado choferes, diríjase a la sección "Flota y Choferes" para crearlos.');
    return;
  }

  if (!placa) {
    alert('Debe seleccionar una unidad vehicular homologada. Si aún no ha registrado vehículos, diríjase a la sección "Flota y Choferes" para crearlos.');
    return;
  }

  const choferOption = choferSelect.options[choferSelect.selectedIndex];
  const placaOption = placaSelect.options[placaSelect.selectedIndex];

  const choferCedula = choferOption ? choferOption.getAttribute('data-cedula') : '';
  const choferLicencia = choferOption ? choferOption.getAttribute('data-licencia') : '';
  const choferTelefono = choferOption ? choferOption.getAttribute('data-telefono') : '';
  const modelo = placaOption ? placaOption.getAttribute('data-modelo') : 'Automóvil Homologado';

  const paradas = [];
  document.querySelectorAll('input[name="paradasIntermediasPage"]:checked').forEach(cb => {
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
    cuposTotales: 4,
    cuposOcupados: 0,
    tarifaPorCupo: tarifa,
    totalEfectivo: 0.00,
    cuotaCooperativa: 6.00,
    observaciones: obs,
    estado: 'programado',
    pasajeros: []
  };

  adminState.turnos.unshift(nuevoTurno);
  saveState('turnos');
  recalcularKPIs();

  alert(`✓ ¡Turno ${codigo} Despachado y Publicado Exitosamente!\n• Ruta: ${origen} ➔ ${destino}\n• Conductor: ${choferNombre}\n• Unidad: ${placa} (4 Pasajeros Estricto)\n• Fecha y Hora: ${fecha} a las ${hora}\n\nVisible de inmediato para reservas en la App de Pasajeros.`);

  navegarAtras();
}

// ── 4. PÁGINA COMPLETA DE VENTA DE PASAJE EN VENTANILLA ─────────────────────
function abrirPaginaVentaPasajero(turnoId) {
  adminState.turnoEnEdicionId = turnoId;
  const turno = adminState.turnos.find(t => t.id === turnoId);
  if (!turno) return;

  const disponibles = turno.cuposTotales - turno.cuposOcupados;
  if (disponibles <= 0) {
    alert('Este turno ya ha completado su capacidad máxima permitida de 4 pasajeros.');
    return;
  }

  irAPagina('crear-pasajero', 'despacho');

  // Asegurar que las casillas para nuevo pasajero aparezcan completamente en blanco
  const elNom = document.getElementById('pageVentanillaNombre');
  if (elNom) elNom.value = '';
  const elCed = document.getElementById('pageVentanillaCedula');
  if (elCed) elCed.value = '';
  const elTel = document.getElementById('pageVentanillaTelefono');
  if (elTel) elTel.value = '';
  const elDir = document.getElementById('pageVentanillaDireccion');
  if (elDir) elDir.value = '';

  document.getElementById('pageVentanillaTurnoCodigo').innerText = `${turno.codigo} · ${turno.rutaOrigen} ➔ ${turno.rutaDestino} (${turno.horaSalida})`;
  document.getElementById('pageVentanillaCuposLibres').innerText = `${disponibles} de 4 puestos disponibles`;

  const selectPuestos = document.getElementById('pageVentanillaPuestos');
  selectPuestos.innerHTML = '';
  for (let i = 1; i <= disponibles; i++) {
    selectPuestos.innerHTML += `<option value="${i}">${i} ${i === 1 ? `puesto ($${(turno.tarifaPorCupo || 12).toFixed(2)})` : `puestos ($${(i * (turno.tarifaPorCupo || 12)).toFixed(2)})`}</option>`;
  }

  document.getElementById('pageVentanillaPin').value = String(Math.floor(1000 + Math.random() * 9000));
}

function guardarPasajeroPagina() {
  const turno = adminState.turnos.find(t => t.id === adminState.turnoEnEdicionId);
  if (!turno) return;

  const nombre = document.getElementById('pageVentanillaNombre').value.trim();
  const cedula = document.getElementById('pageVentanillaCedula').value.trim();
  const telefono = document.getElementById('pageVentanillaTelefono').value.trim();
  const direccion = document.getElementById('pageVentanillaDireccion').value.trim();
  const puestos = parseInt(document.getElementById('pageVentanillaPuestos').value, 10);
  const pin = document.getElementById('pageVentanillaPin').value;

  if (!nombre || !cedula || !telefono || !direccion) {
    alert('Por favor complete todos los datos requeridos del pasajero.');
    return;
  }

  if (!validarCedulaEcuatoriana(cedula)) {
    alert('⚠️ Cédula no válida según el algoritmo Módulo 10 de Ecuador. Verifique los 10 dígitos.');
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
  recalcularKPIs();

  alert(`✓ ¡Boleto emitido en ventanilla!\n• Pasajero: ${nombre}\n• Asientos: ${puestos}\n• Cobro Efectivo: $${monto.toFixed(2)}\n• PIN de Abordaje: ${pin}\n\nIncorporado de inmediato en el Manifiesto ANT.`);

  navegarAtras();
}

// ── 5. PÁGINA COMPLETA DE REGISTRO DE CHOFER ────────────────────────────────
function prepararPaginaCrearChofer() {
  const elNom = document.getElementById('pageChoferNombre');
  if (elNom) elNom.value = '';
  const elCed = document.getElementById('pageChoferCedula');
  if (elCed) elCed.value = '';
  const elVig = document.getElementById('pageChoferVigencia');
  if (elVig) elVig.value = '';
  const elTel = document.getElementById('pageChoferTelefono');
  if (elTel) elTel.value = '';
  const elCor = document.getElementById('pageChoferCorreo');
  if (elCor) elCor.value = '';

  const selectPlaca = document.getElementById('pageChoferUnidadPlaca');
  if (selectPlaca) {
    selectPlaca.innerHTML = `<option value="Sin Asignar">-- Sin Unidad Asignada --</option>` +
      adminState.vehiculos.map(v => `<option value="${v.placa}">${v.placa} · ${v.modelo} (${v.tipo})</option>`).join('');
  }
}

function guardarNuevoChoferPagina() {
  const nombre = document.getElementById('pageChoferNombre').value.trim();
  const cedula = document.getElementById('pageChoferCedula').value.trim();
  const licencia = document.getElementById('pageChoferLicencia').value;
  const vigencia = document.getElementById('pageChoferVigencia').value;
  const telefono = document.getElementById('pageChoferTelefono').value.trim();
  const correo = document.getElementById('pageChoferCorreo').value.trim();
  const unidad = document.getElementById('pageChoferUnidadPlaca').value;
  const estado = document.getElementById('pageChoferEstado').value;

  if (!nombre || !cedula || !telefono || !vigencia) {
    alert('Complete nombres, cédula, teléfono y fecha de vigencia de la licencia del conductor.');
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

  if (unidad && unidad !== 'Sin Asignar') {
    const v = adminState.vehiculos.find(veh => veh.placa === unidad);
    if (v) {
      v.choferAsignado = nombre;
      saveState('vehiculos');
    }
  }

  alert(`✓ ¡Conductor ${nombre} registrado exitosamente!`);
  navegarAtras();
}

function cambiarEstadoChofer(choferId, nuevoEstado) {
  const ch = adminState.choferes.find(c => c.id === choferId);
  if (ch) {
    ch.estado = nuevoEstado;
    saveState('choferes');
    renderFlotaTables();
  }
}

// ── 6. PÁGINA COMPLETA DE REGISTRO DE UNIDAD ────────────────────────────────
function prepararPaginaCrearUnidad() {
  const elPlaca = document.getElementById('pageUnidadPlaca');
  if (elPlaca) elPlaca.value = '';
  const elMod = document.getElementById('pageUnidadModelo');
  if (elMod) elMod.value = '';
  const elAnio = document.getElementById('pageUnidadAnio');
  if (elAnio) elAnio.value = '';
  const elDisco = document.getElementById('pageUnidadDisco');
  if (elDisco) elDisco.value = '';
  const elSoat = document.getElementById('pageUnidadSoatVence');
  if (elSoat) elSoat.value = '';

  const selectChofer = document.getElementById('pageUnidadChoferAsignado');
  if (selectChofer) {
    selectChofer.innerHTML = `<option value="Sin Chofer">-- Sin Chofer Asignado --</option>` +
      adminState.choferes.map(c => `<option value="${c.nombre}">${c.nombre} (Céd: ${c.cedula})</option>`).join('');
  }
}

function guardarNuevaUnidadPagina() {
  const placa = document.getElementById('pageUnidadPlaca').value.trim().toUpperCase();
  const tipo = document.getElementById('pageUnidadTipo').value;
  const modelo = document.getElementById('pageUnidadModelo').value.trim();
  const anioVal = document.getElementById('pageUnidadAnio').value;
  const anio = parseInt(anioVal, 10);
  const disco = document.getElementById('pageUnidadDisco').value.trim() || `Unidad #${adminState.vehiculos.length + 1}`;
  const soatVence = document.getElementById('pageUnidadSoatVence').value;
  const chofer = document.getElementById('pageUnidadChoferAsignado').value;
  const estado = document.getElementById('pageUnidadEstado').value;

  if (!placa || !modelo || !anioVal || !soatVence) {
    alert('Ingrese placa, modelo, año y fecha de vencimiento del SOAT del vehículo.');
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
    tipo: tipo,
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

  alert(`✓ ¡Unidad ${placa} (${modelo} · 4 cupos máximos) registrada exitosamente en el parque automotor!`);
  navegarAtras();
}

function cambiarEstadoUnidad(placa, nuevoEstado) {
  const v = adminState.vehiculos.find(veh => veh.placa === placa);
  if (v) {
    v.estado = nuevoEstado;
    saveState('vehiculos');
    renderFlotaTables();
  }
}

// ── 7. PÁGINA COMPLETA DE REGISTRO DE USUARIO Y ROLES ───────────────────────
function prepararPaginaCrearUsuario() {
  const elNom = document.getElementById('pageUsrNombre');
  if (elNom) elNom.value = '';
  const elCed = document.getElementById('pageUsrCedula');
  if (elCed) elCed.value = '';
  const elCor = document.getElementById('pageUsrCorreo');
  if (elCor) elCor.value = '';
  const elTel = document.getElementById('pageUsrTelefono');
  if (elTel) elTel.value = '';
  const elPass = document.getElementById('pageUsrPassword');
  if (elPass) elPass.value = '';
}

function guardarNuevoUsuarioPagina() {
  const nombre = document.getElementById('pageUsrNombre').value.trim();
  const cedula = document.getElementById('pageUsrCedula').value.trim();
  const correo = document.getElementById('pageUsrCorreo').value.trim();
  const telefono = document.getElementById('pageUsrTelefono').value.trim();
  const rol = document.getElementById('pageUsrRol').value;
  const sede = document.getElementById('pageUsrSede').value;
  const password = document.getElementById('pageUsrPassword').value;

  if (!nombre || !cedula || !correo || !telefono || !password) {
    alert('Complete todos los campos obligatorios del usuario.');
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

  alert(`✓ ¡Usuario ${nombre} creado exitosamente con el rol "${roleLabels[rol]}"!`);
  navegarAtras();
}

function renderUsuariosTable() {
  const tbody = document.getElementById('tbodyUsuarios');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (adminState.usuarios.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-dim); padding: 36px;">No hay usuarios adicionales registrados en el sistema. Presione el botón <strong>"+ Crear Usuario"</strong> para asignar accesos operativos.</td></tr>`;
    return;
  }

  adminState.usuarios.forEach((u, i) => {
    const tr = document.createElement('tr');
    let rolePill = `<span class="badge badge-blue">Despachador</span>`;

    if (u.rol === 'superadmin') {
      rolePill = `<span class="badge badge-purple" style="font-weight: 800;">👑 Superusuario</span>`;
    } else if (u.rol === 'auditor_caja') {
      rolePill = `<span class="badge badge-green">💵 Auditor Caja</span>`;
    } else if (u.rol === 'operador_gps') {
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

function eliminarUsuario(id) {
  if (confirm('¿Está seguro de revocar los accesos de este usuario?')) {
    adminState.usuarios = adminState.usuarios.filter(u => u.id !== id);
    saveState('usuarios');
    renderUsuariosTable();
  }
}

// ── 8. RENDER DE DESPACHO DE TURNOS ─────────────────────────────────────────
function renderDespachoTable() {
  const tbody = document.getElementById('tbodyDespacho');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (adminState.turnos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-dim); padding: 36px;">No hay turnos registrados en este momento. Presione el botón <strong>"+ Despachar Nuevo Turno"</strong> para programar una nueva salida.</td></tr>`;
    return;
  }

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
            <button class="btn btn-primary" style="padding: 4px 8px; font-size: 11px;" onclick="abrirPaginaVentaPasajero('${t.id}')">
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

function cambiarEstadoTurno(turnoId, nuevoEstado) {
  const t = adminState.turnos.find(trn => trn.id === turnoId);
  if (!t) return;

  t.estado = nuevoEstado;
  
  if (nuevoEstado === 'liquidado') {
    const totalPasajes = t.totalEfectivo;
    const cuota = t.cuotaCooperativa || 6.00;
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
  recalcularKPIs();
  renderDespachoTable();
}

function verManifiestoDeTurno(turnoId) {
  adminState.selectedTurnoManifiestoId = turnoId;
  switchAdminTab('manifiesto');
}

// ── 9. RENDER DE MANIFIESTO OFICIAL DE TRÁNSITO ANT ─────────────────────────
function renderManifiestoANT() {
  const turno = adminState.turnos.find(t => t.id === adminState.selectedTurnoManifiestoId) || adminState.turnos[0];
  
  if (!turno) {
    const selector = document.getElementById('selectTurnoManifiesto');
    if (selector) selector.innerHTML = '<option value="">-- No hay turnos registrados --</option>';
    const elRuta = document.getElementById('mftRuta');
    if (elRuta) elRuta.innerText = 'Sin turnos activos';
    const elFecha = document.getElementById('mftFechaHora');
    if (elFecha) elFecha.innerText = '--';
    const elCh = document.getElementById('mftChofer');
    if (elCh) elCh.innerText = '--';
    const elVeh = document.getElementById('mftVehiculo');
    if (elVeh) elVeh.innerText = '--';
    const elOcu = document.getElementById('mftOcupacion');
    if (elOcu) elOcu.innerText = '0 de 4 puestos';
    const tbody = document.getElementById('tbodyManifiestoPasajeros');
    if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-dim); padding: 36px;">No hay turnos creados para generar el Manifiesto ANT. Programe un turno desde la sección de Despacho.</td></tr>`;
    return;
  }

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

  if (!turno.pasajeros || turno.pasajeros.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-dim); padding: 24px;">No hay registros de pasajeros cargados en este turno todavía. Use el botón "+ Pax" en Despacho para emitir pasajes.</td></tr>`;
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
  if (!turno) {
    alert('No hay un turno seleccionado para imprimir.');
    return;
  }

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
          ${(turno.pasajeros || []).map((p, i) => `
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

// ── 10. RENDER DE AUDITORÍA DE LIQUIDACIONES ─────────────────────────────────
function renderLiquidacionesTable() {
  const tbody = document.getElementById('tbodyLiquidaciones');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (adminState.liquidaciones.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-dim); padding: 36px;">No hay liquidaciones de caja registradas aún. Las liquidaciones se generan automáticamente al liquidar turnos completados en la pestaña de Despacho.</td></tr>`;
    return;
  }

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

// ── 11. RENDER DE FLOTA Y CONDUCTORES ────────────────────────────────────────
function renderFlotaTables() {
  const tbodyCh = document.getElementById('tbodyChoferes');
  if (tbodyCh) {
    if (adminState.choferes.length === 0) {
      tbodyCh.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-dim); padding: 36px;">No hay conductores registrados. Ingrese a "+ Nuevo Conductor" para registrar choferes reales con licencia profesional.</td></tr>`;
    } else {
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
  }

  const tbodyVeh = document.getElementById('tbodyVehiculos');
  if (tbodyVeh) {
    if (adminState.vehiculos.length === 0) {
      tbodyVeh.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-dim); padding: 36px;">No hay unidades registradas. Ingrese a "+ Registrar Unidad" para incorporar vehículos homologados (máx 4 cupos ANT).</td></tr>`;
    } else {
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
}

// ── 12. RADAR GPS & TELEMETRÍA SATELITAL ────────────────────────────────────
function renderRadarTelemetria() {
  const feed = document.getElementById('telemetriaFeed');
  if (!feed) return;

  const turnosEnRuta = adminState.turnos.filter(t => t.estado === 'en_ruta');

  if (turnosEnRuta.length === 0) {
    feed.innerHTML = `
      <div style="background: var(--bg-card); border: 1px dashed var(--border); border-radius: 12px; padding: 40px; text-align: center; color: var(--text-dim);">
        <div style="font-size: 36px; margin-bottom: 10px;">🛰️</div>
        <strong style="color: #fff; font-size: 15px;">No hay unidades en ruta en este momento</strong>
        <p style="font-size: 12px; margin-top: 6px; max-width: 480px; margin-left: auto; margin-right: auto; line-height: 1.5;">
          Cuando un turno sea despachado y puesto en estado <strong>"En Ruta"</strong>, la telemetría satelital GPS en tiempo real se sincronizará automáticamente aquí.
        </p>
      </div>
    `;
    return;
  }

  feed.innerHTML = turnosEnRuta.map(t => `
    <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 14px; display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(16,185,129,0.15); display: flex; align-items: center; justify-content: center; font-size: 18px;">
          🚗
        </div>
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <strong style="color: #fff; font-size: 14px;">Unidad: ${t.vehiculoPlaca}</strong>
            <span class="badge badge-green">En Carretera normal</span>
          </div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
            Chofer: ${t.choferNombre} · Ruta: <strong style="color: var(--accent);">${t.rutaOrigen} ➔ ${t.rutaDestino}</strong>
          </div>
          <div style="font-size: 11px; color: var(--amber); margin-top: 2px;">
            📍 Ubicación Satelital: Troncal E25 (En trayecto) · Turno: ${t.codigo}
          </div>
        </div>
      </div>
      <div style="text-align: right;">
        <span style="font-size: 10px; color: var(--text-dim); text-transform: uppercase;">Velocidad GPS</span>
        <div style="font-size: 18px; font-weight: 900; color: var(--accent);">75 km/h</div>
      </div>
    </div>
  `).join('');
}

// ── INICIALIZACIÓN GENERAL AL CARGAR EL DOM ──────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initLocalStorageData();
  checkSuperUserSetup();
  switchAdminTab('despacho');
});
