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
  LIQUIDACIONES: 'macondo_liquidaciones',
  ENCOMIENDAS: 'macondo_encomiendas'
};

const adminState = {
  activeTab: 'despacho',
  currentUser: null,
  selectedTurnoManifiestoId: null,
  turnoEnEdicionId: null,
  encomiendaParaAsignarId: null,
  kpis: {
    pasajerosHoy: 0,
    unidadesEnRuta: 0,
    efectivoRecaudado: 0.00,
    cuotasCooperativa: 0.00,
    ocupacionPromedio: 0.0,
    encomiendasTotal: 0,
    encomiendasBodega: 0,
    encomiendasTransito: 0,
    encomiendasEntregadas: 0,
    encomiendasRecaudacion: 0.00
  },
  ciudades: [],
  turnos: [],
  liquidaciones: [],
  choferes: [],
  vehiculos: [],
  usuarios: [],
  encomiendas: []
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

  // Métricas de Encomiendas & Carga
  let totalEnc = adminState.encomiendas ? adminState.encomiendas.length : 0;
  let bodegaEnc = 0;
  let transitoEnc = 0;
  let entregadasEnc = 0;
  let recaudacionEnc = 0;

  if (adminState.encomiendas && Array.isArray(adminState.encomiendas)) {
    adminState.encomiendas.forEach(enc => {
      const tarifa = parseFloat(enc.paquete ? enc.paquete.tarifa : enc.tarifa) || 0;
      recaudacionEnc += tarifa;
      if (enc.estado === 'En Bodega') {
        bodegaEnc++;
      } else if (enc.estado === 'En Tránsito' || enc.estado === 'Asignada a Unidad') {
        transitoEnc++;
      } else if (enc.estado === 'Entregada') {
        entregadasEnc++;
      }
    });
  }

  // Se incorpora la recaudación de encomiendas al total de efectivo recaudado de la cooperativa
  recaudado += recaudacionEnc;

  adminState.kpis = {
    pasajerosHoy: pasajeros,
    unidadesEnRuta: unidadesEnRuta,
    efectivoRecaudado: recaudado,
    cuotasCooperativa: cuotas,
    ocupacionPromedio: turnosTotales > 0 ? (puestosOcupados / turnosTotales).toFixed(1) : '0.0',
    encomiendasTotal: totalEnc,
    encomiendasBodega: bodegaEnc,
    encomiendasTransito: transitoEnc,
    encomiendasEntregadas: entregadasEnc,
    encomiendasRecaudacion: recaudacionEnc
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

  // KPIs de la sección Encomiendas & Carga
  const elEncTotal = document.getElementById('kpiEncTotal');
  const elEncBodega = document.getElementById('kpiEncBodega');
  const elEncTransito = document.getElementById('kpiEncTransito');
  const elEncEntregadas = document.getElementById('kpiEncEntregadas');
  const elEncRecaudacion = document.getElementById('kpiEncRecaudacion');
  const elBadgeNavEnc = document.getElementById('badgeNavEncomiendas');

  if (elEncTotal) elEncTotal.innerText = adminState.kpis.encomiendasTotal || 0;
  if (elEncBodega) elEncBodega.innerText = adminState.kpis.encomiendasBodega || 0;
  if (elEncTransito) elEncTransito.innerText = adminState.kpis.encomiendasTransito || 0;
  if (elEncEntregadas) elEncEntregadas.innerText = adminState.kpis.encomiendasEntregadas || 0;
  if (elEncRecaudacion) elEncRecaudacion.innerText = `$${(adminState.kpis.encomiendasRecaudacion || 0).toFixed(2)}`;
  if (elBadgeNavEnc) elBadgeNavEnc.innerText = (adminState.kpis.encomiendasBodega || 0) + (adminState.kpis.encomiendasTransito || 0);
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

  // Encomiendas & Carga (vacío hasta que se registren reales)
  const storedEnc = localStorage.getItem(STORAGE_KEYS.ENCOMIENDAS);
  adminState.encomiendas = storedEnc ? JSON.parse(storedEnc) : [];
  if (!storedEnc) localStorage.setItem(STORAGE_KEYS.ENCOMIENDAS, JSON.stringify([]));

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
  if (key === 'encomiendas') localStorage.setItem(STORAGE_KEYS.ENCOMIENDAS, JSON.stringify(adminState.encomiendas));
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
  if (pageId === 'crear-encomienda') prepararPaginaCrearEncomienda();
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
  if (tabName === 'encomiendas') renderEncomiendasTable();
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

// ── 13. MÓDULO DE ENCOMIENDAS & PAQUETERÍA PUERTA A PUERTA ─────────────────
function renderEncomiendasTable(listaFiltrada) {
  const tbody = document.getElementById('tbodyEncomiendas');
  if (!tbody) return;

  // Actualizar opciones del filtro de destinos si están vacías
  const filtroDest = document.getElementById('filtroEncDestino');
  if (filtroDest && filtroDest.options.length <= 1) {
    const ciudadesActivas = adminState.ciudades.filter(c => c.estado === 'Activa');
    ciudadesActivas.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.nombre;
      opt.textContent = c.nombre;
      filtroDest.appendChild(opt);
    });
  }

  const items = listaFiltrada !== undefined ? listaFiltrada : adminState.encomiendas;

  if (!items || items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 42px 20px; color: var(--text-dim);">
          <div style="font-size: 38px; margin-bottom: 10px;">📦</div>
          <strong style="color: #fff; font-size: 15px;">No hay encomiendas registradas en el sistema</strong>
          <p style="font-size: 12px; margin-top: 6px; max-width: 480px; margin-left: auto; margin-right: auto; line-height: 1.5;">
            Registre sobres notariales, paquetes pequeños o valijas de carga para generar automáticamente su guía oficial con código QR antifraude y asignarla a una unidad.
          </p>
          <button class="btn btn-primary" style="margin-top: 16px; font-size: 12px;" onclick="irAPagina('crear-encomienda', 'encomiendas')">
            <span>+</span> Registrar Nueva Encomienda
          </button>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = items.map(enc => {
    // Badge de estado
    let badgeEstado = '<span class="badge badge-amber">🏢 En Bodega</span>';
    if (enc.estado === 'Asignada a Unidad') {
      badgeEstado = '<span class="badge badge-blue">🚕 Asignada</span>';
    } else if (enc.estado === 'En Tránsito') {
      badgeEstado = '<span class="badge badge-purple">🛣️ En Tránsito</span>';
    } else if (enc.estado === 'Entregada') {
      badgeEstado = '<span class="badge badge-green">✓ Entregada</span>';
    }

    // Modalidad entrega
    const badgeModalidad = enc.destinatario.modalidad === 'Puerta a Puerta'
      ? '<span class="badge badge-amber" style="font-size: 10px; padding: 1px 6px;">🏠 Domicilio</span>'
      : '<span class="badge badge-blue" style="font-size: 10px; padding: 1px 6px;">🏢 Agencia</span>';

    // Asignación de unidad
    let unidadHtml = '';
    if (enc.asignacion && enc.asignacion.placa) {
      unidadHtml = `
        <strong style="font-family: monospace; color: var(--amber); font-size: 12px;">${enc.asignacion.placa}</strong><br>
        <span style="font-size: 11px; color: #fff;">${enc.asignacion.chofer || 'Chofer'}</span><br>
        <span style="font-size: 10px; color: var(--text-dim);">Turno: ${enc.asignacion.turnoCodigo || 'S/N'}</span>
      `;
    } else {
      unidadHtml = `
        <span class="badge badge-amber" style="font-size: 10px;">En Bodega</span><br>
        <button class="btn-secondary" style="margin-top: 4px; padding: 2px 6px; font-size: 10px;" onclick="abrirModalAsignarTurnoEncomienda('${enc.id}')">
          🚕 Asignar Turno
        </button>
      `;
    }

    // Acciones disponibles
    let accionesHtml = `
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <button class="btn btn-outline" style="padding: 3px 8px; font-size: 11px;" onclick="abrirModalGuiaEncomienda('${enc.id}')">
          🖨️ Ver Guía QR
        </button>
    `;

    if (enc.estado !== 'Entregada') {
      accionesHtml += `
        <button class="btn btn-primary" style="padding: 3px 8px; font-size: 11px;" onclick="marcarEncomiendaEntregada('${enc.id}')">
          ✓ Confirmar Entrega
        </button>
      `;
    }

    if (enc.estado === 'En Bodega') {
      accionesHtml += `
        <button class="btn-secondary" style="padding: 3px 8px; font-size: 11px;" onclick="abrirModalAsignarTurnoEncomienda('${enc.id}')">
          🚕 Asignar a Unidad
        </button>
      `;
    }

    accionesHtml += `</div>`;

    const tarifaValor = parseFloat(enc.paquete ? enc.paquete.tarifa : enc.tarifa) || 0;
    const valorDeclarado = parseFloat(enc.paquete ? enc.paquete.valorDeclarado : enc.valorDeclarado) || 0;

    return `
      <tr>
        <td>
          <strong style="font-family: monospace; color: var(--accent); font-size: 13px;">${enc.numeroGuia}</strong><br>
          <button class="badge badge-purple" style="font-size: 10px; border: none; cursor: pointer; margin-top: 4px;" onclick="abrirModalGuiaEncomienda('${enc.id}')">
            🔍 Código QR
          </button>
        </td>
        <td>
          <span style="color: #fff; font-size: 12px; font-weight: 600;">${enc.fechaFormateada || enc.fechaCreacion.slice(0, 16).replace('T', ' ')}</span><br>
          <span style="font-size: 10px; color: var(--text-dim);">Recepción Cooperativa</span>
        </td>
        <td>
          <strong style="color: #fff; font-size: 13px;">${enc.remitente.nombre}</strong><br>
          <span style="font-size: 11px; color: var(--text-dim);">CI: ${enc.remitente.cedula} · 📱 ${enc.remitente.telefono}</span><br>
          <span style="font-size: 11px; color: var(--accent-light);">📍 Origen: <strong>${enc.remitente.origen}</strong></span>
        </td>
        <td>
          <strong style="color: #fff; font-size: 13px;">${enc.destinatario.nombre}</strong><br>
          <span style="font-size: 11px; color: var(--text-dim);">CI: ${enc.destinatario.cedula} · 📱 ${enc.destinatario.telefono}</span><br>
          <div style="margin-top: 2px;">
            ${badgeModalidad}
            <span style="font-size: 11px; color: var(--accent); font-weight: bold;">➔ ${enc.destinatario.destino}</span>
          </div>
          <span style="font-size: 10px; color: var(--text-dim); display: block; margin-top: 2px; max-width: 220px; line-height: 1.2;">
            ${enc.destinatario.direccion || 'Retiro en Terminal'}
          </span>
        </td>
        <td>
          <span style="color: #fff; font-weight: 700; font-size: 12px;">${enc.paquete.tipo}</span><br>
          <span style="font-size: 11px; color: var(--text-muted); display: block; max-width: 180px;">${enc.paquete.descripcion}</span>
          <span style="font-size: 10px; color: var(--amber);">Val. Decl.: $${valorDeclarado.toFixed(2)}</span>
        </td>
        <td>
          ${unidadHtml}
        </td>
        <td>
          <strong style="font-size: 15px; color: var(--accent); font-weight: 900;">$${tarifaValor.toFixed(2)}</strong><br>
          <span style="font-size: 10px; color: var(--text-dim);">100% Efectivo</span>
        </td>
        <td>
          ${badgeEstado}
        </td>
        <td>
          ${accionesHtml}
        </td>
      </tr>
    `;
  }).join('');
}

function filtrarEncomiendas() {
  const query = (document.getElementById('filtroEncBusqueda')?.value || '').toLowerCase().trim();
  const estado = document.getElementById('filtroEncEstado')?.value || 'TODOS';
  const destino = document.getElementById('filtroEncDestino')?.value || 'TODOS';

  const filtradas = adminState.encomiendas.filter(enc => {
    // Filtro por texto
    if (query) {
      const matchGuia = (enc.numeroGuia || '').toLowerCase().includes(query);
      const matchRemNom = (enc.remitente?.nombre || '').toLowerCase().includes(query);
      const matchRemCed = (enc.remitente?.cedula || '').toLowerCase().includes(query);
      const matchRemTel = (enc.remitente?.telefono || '').toLowerCase().includes(query);
      const matchDestNom = (enc.destinatario?.nombre || '').toLowerCase().includes(query);
      const matchDestCed = (enc.destinatario?.cedula || '').toLowerCase().includes(query);
      const matchDestTel = (enc.destinatario?.telefono || '').toLowerCase().includes(query);
      const matchDesc = (enc.paquete?.descripcion || '').toLowerCase().includes(query);
      if (!matchGuia && !matchRemNom && !matchRemCed && !matchRemTel && !matchDestNom && !matchDestCed && !matchDestTel && !matchDesc) {
        return false;
      }
    }

    // Filtro por estado
    if (estado !== 'TODOS' && enc.estado !== estado) {
      return false;
    }

    // Filtro por destino
    if (destino !== 'TODOS' && enc.destinatario?.destino !== destino) {
      return false;
    }

    return true;
  });

  renderEncomiendasTable(filtradas);
}

function prepararPaginaCrearEncomienda() {
  // Limpieza total obligatoria de campos (Regla de formularios limpios)
  const inputsToClear = [
    'pageEncRemitenteNombre',
    'pageEncRemitenteCedula',
    'pageEncRemitenteTelefono',
    'pageEncRemitenteDireccion',
    'pageEncDestinatarioNombre',
    'pageEncDestinatarioCedula',
    'pageEncDestinatarioTelefono',
    'pageEncDestinatarioDireccion',
    'pageEncDestinatarioReferencia',
    'pageEncValorDeclarado',
    'pageEncDescripcion',
    'pageEncTarifa',
    'pageEncObservaciones'
  ];

  inputsToClear.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  // Ciudades activas para Origen y Destino
  const ciudadesActivas = adminState.ciudades.filter(c => c.estado === 'Activa');
  const selOrigen = document.getElementById('pageEncOrigen');
  const selDestino = document.getElementById('pageEncDestino');

  if (selOrigen && selDestino) {
    selOrigen.innerHTML = ciudadesActivas.map(c => `<option value="${c.nombre}">${c.nombre} (${c.provincia})</option>`).join('');
    selDestino.innerHTML = ciudadesActivas.map(c => `<option value="${c.nombre}">${c.nombre} (${c.provincia})</option>`).join('');

    // Valores por omisión naturales del corredor vial
    if (ciudadesActivas.length > 1) {
      selOrigen.value = ciudadesActivas[0].nombre;
      selDestino.value = ciudadesActivas[1].nombre;
    }
  }

  // Modalidad de entrega inicial
  const selModalidad = document.getElementById('pageEncModalidad');
  if (selModalidad) selModalidad.value = 'Puerta a Puerta';

  // Tipo inicial y sugerencia de tarifa
  const selTipo = document.getElementById('pageEncTipo');
  if (selTipo) selTipo.selectedIndex = 0;

  toggleModalidadEntrega();
  sugerirTarifaEncomienda();
  actualizarTurnosDisponiblesEncomienda();
}

function toggleModalidadEntrega() {
  const modalidad = document.getElementById('pageEncModalidad')?.value || 'Puerta a Puerta';
  const inpDir = document.getElementById('pageEncDestinatarioDireccion');
  const grpRef = document.getElementById('grpEncReferenciaEntrega');

  if (inpDir) {
    if (modalidad === 'Terminal') {
      inpDir.placeholder = 'Retiro en Oficina / Agencia de la Cooperativa en destino';
      if (grpRef) grpRef.style.opacity = '0.5';
    } else {
      inpDir.placeholder = 'Ej: Av. 25 de Junio y Junín #402 (Entrega a Domicilio u Oficina)';
      if (grpRef) grpRef.style.opacity = '1';
    }
  }
}

function sugerirTarifaEncomienda() {
  const tipo = document.getElementById('pageEncTipo')?.value;
  const inpTarifa = document.getElementById('pageEncTarifa');
  if (!inpTarifa) return;

  const tarifasBase = {
    'Sobre / Documentos': '4.00',
    'Paquete Pequeño (< 2kg)': '5.00',
    'Paquete Mediano (2 - 5kg)': '7.00',
    'Caja / Bulto (5 - 10kg)': '10.00',
    'Valija Delicada / Carga': '15.00'
  };

  if (tipo && tarifasBase[tipo]) {
    inpTarifa.value = tarifasBase[tipo];
  }
}

function actualizarTurnosDisponiblesEncomienda() {
  const origen = document.getElementById('pageEncOrigen')?.value;
  const destino = document.getElementById('pageEncDestino')?.value;
  const selTurno = document.getElementById('pageEncTurnoAsignado');
  if (!selTurno) return;

  selTurno.innerHTML = `
    <option value="">-- Dejar en Bodega (Despacho posterior en siguiente salida) --</option>
  `;

  // Turnos activos o programados
  const turnosDisponibles = adminState.turnos.filter(t => t.estado === 'programado' || t.estado === 'en_ruta');

  turnosDisponibles.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    const esMismaRuta = (t.rutaOrigen === origen && t.rutaDestino === destino);
    opt.textContent = `${esMismaRuta ? '★ ' : ''}Turno ${t.codigo} · ${t.vehiculoPlaca} (${t.choferNombre}) · Salida: ${t.horaSalida || 'Hoy'} [${t.rutaOrigen} ➔ ${t.rutaDestino}]`;
    selTurno.appendChild(opt);
  });
}

function guardarNuevaEncomiendaPagina() {
  const remNombre = (document.getElementById('pageEncRemitenteNombre')?.value || '').trim();
  const remCedula = (document.getElementById('pageEncRemitenteCedula')?.value || '').trim();
  const remTelefono = (document.getElementById('pageEncRemitenteTelefono')?.value || '').trim();
  const remOrigen = document.getElementById('pageEncOrigen')?.value;
  const remDireccion = (document.getElementById('pageEncRemitenteDireccion')?.value || '').trim();

  const destNombre = (document.getElementById('pageEncDestinatarioNombre')?.value || '').trim();
  const destCedula = (document.getElementById('pageEncDestinatarioCedula')?.value || '').trim();
  const destTelefono = (document.getElementById('pageEncDestinatarioTelefono')?.value || '').trim();
  const destDestino = document.getElementById('pageEncDestino')?.value;
  const modalidad = document.getElementById('pageEncModalidad')?.value || 'Puerta a Puerta';
  const destDireccion = (document.getElementById('pageEncDestinatarioDireccion')?.value || '').trim();
  const destReferencia = (document.getElementById('pageEncDestinatarioReferencia')?.value || '').trim();

  const tipo = document.getElementById('pageEncTipo')?.value || 'Paquete Pequeño (< 2kg)';
  const valorDeclarado = parseFloat(document.getElementById('pageEncValorDeclarado')?.value) || 0.00;
  const descripcion = (document.getElementById('pageEncDescripcion')?.value || '').trim();
  const tarifa = parseFloat(document.getElementById('pageEncTarifa')?.value) || 0.00;

  const turnoId = document.getElementById('pageEncTurnoAsignado')?.value;
  const observaciones = (document.getElementById('pageEncObservaciones')?.value || '').trim();

  // Validaciones estrictas
  if (!remNombre || !remCedula || !remTelefono) {
    alert('Por favor complete todos los datos obligatorios del Remitente (Nombre, Cédula/RUC y Teléfono Móvil).');
    return;
  }

  if (remCedula.length === 10 && !validarCedulaEcuatoriana(remCedula)) {
    alert('La cédula del Remitente no es válida según el algoritmo oficial del Registro Civil.');
    return;
  }

  if (!destNombre || !destCedula || !destTelefono) {
    alert('Por favor complete todos los datos obligatorios del Destinatario (Nombre, Cédula y Teléfono Móvil).');
    return;
  }

  if (destCedula.length === 10 && !validarCedulaEcuatoriana(destCedula)) {
    alert('La cédula del Destinatario no es válida según el algoritmo oficial del Registro Civil.');
    return;
  }

  if (remOrigen === destDestino) {
    alert('La Ciudad de Origen y la Ciudad de Destino deben ser diferentes.');
    return;
  }

  if (modalidad === 'Puerta a Puerta' && !destDireccion) {
    alert('Para entrega Puerta a Puerta es obligatorio ingresar la dirección exacta del destinatario.');
    return;
  }

  if (!descripcion) {
    alert('Debe ingresar una descripción detallada del contenido del paquete o sobre.');
    return;
  }

  if (tarifa <= 0) {
    alert('La tarifa de envío debe ser un valor positivo mayor a $0.00.');
    return;
  }

  // Generar Código de Guía oficial y Token QR Antifraude
  const fechaHoy = new Date();
  const yymmdd = fechaHoy.toISOString().slice(2, 10).replace(/-/g, '');
  const correlativo = String(adminState.encomiendas.length + 1).padStart(3, '0');
  const numeroGuia = `ENC-${yymmdd}-${correlativo}`;
  const qrCode = `MCND-ENC-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`;

  // Determinar asignación de turno
  let turnoObj = null;
  let estadoInicial = 'En Bodega';

  if (turnoId) {
    turnoObj = adminState.turnos.find(t => t.id === turnoId);
    if (turnoObj) {
      estadoInicial = (turnoObj.estado === 'en_ruta') ? 'En Tránsito' : 'Asignada a Unidad';
    }
  }

  const nuevaEncomienda = {
    id: `enc-${Date.now()}`,
    numeroGuia: numeroGuia,
    qrCode: qrCode,
    fechaCreacion: new Date().toISOString(),
    fechaFormateada: new Date().toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' }),
    remitente: {
      nombre: remNombre,
      cedula: remCedula,
      telefono: remTelefono,
      origen: remOrigen,
      puntoRecepcion: remDireccion || 'Recepción en Agencia'
    },
    destinatario: {
      nombre: destNombre,
      cedula: destCedula,
      telefono: destTelefono,
      destino: destDestino,
      modalidad: modalidad,
      direccion: destDireccion || `Agencia Terminal ${destDestino}`,
      referencia: destReferencia
    },
    paquete: {
      tipo: tipo,
      valorDeclarado: valorDeclarado,
      descripcion: descripcion,
      tarifa: tarifa,
      modalidadPago: '100% Efectivo en Ventanilla'
    },
    asignacion: {
      turnoId: turnoObj ? turnoObj.id : null,
      turnoCodigo: turnoObj ? turnoObj.codigo : null,
      placa: turnoObj ? turnoObj.vehiculoPlaca : null,
      chofer: turnoObj ? turnoObj.choferNombre : null,
      observaciones: observaciones || 'Sin observaciones'
    },
    estado: estadoInicial,
    historial: [
      {
        fecha: new Date().toLocaleString('es-EC'),
        evento: 'Recepción en Agencia, Cobro de Tarifa y Emisión de Guía con QR',
        usuario: adminState.currentUser ? adminState.currentUser.nombre : 'Operador de Despacho'
      }
    ]
  };

  adminState.encomiendas.unshift(nuevaEncomienda);
  saveState('encomiendas');
  recalcularKPIs();

  alert(`✓ ¡Encomienda ${numeroGuia} registrada con éxito!\n\nCobro en Ventanilla: $${tarifa.toFixed(2)} USD (100% Efectivo)\nEstado inicial: ${estadoInicial}\n\nA continuación se desplegará la Guía Oficial con Código QR para su impresión térmica.`);

  // Volver a la pestaña principal de Encomiendas y abrir la guía
  switchAdminTab('encomiendas');
  abrirModalGuiaEncomienda(nuevaEncomienda.id);
}

function abrirModalGuiaEncomienda(id) {
  const enc = adminState.encomiendas.find(e => e.id === id);
  if (!enc) return;

  const container = document.getElementById('imprimibleGuiaContenido');
  const modal = document.getElementById('modalGuiaEncomienda');
  if (!container || !modal) return;

  const tarifa = parseFloat(enc.paquete ? enc.paquete.tarifa : enc.tarifa) || 0;
  const valorDeclarado = parseFloat(enc.paquete ? enc.paquete.valorDeclarado : enc.valorDeclarado) || 0;

  container.innerHTML = `
    <div style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 10px;">
      <strong style="font-size: 11px; text-transform: uppercase; color: #111;">COOPERATIVA DE TRANSPORTE Y TURISMO</strong><br>
      <strong style="font-size: 16px; color: #047857; letter-spacing: 0.5px;">"MACONDO EXPRESS"</strong><br>
      <span style="font-size: 9.5px; color: #444;">R.U.C.: 0992348571001 · RESOLUCIÓN ANT N° 048-2026</span><br>
      <span style="font-size: 9px; color: #555;">Servicio Especial Puerta a Puerta & Encomiendas</span><br>
      <div style="margin-top: 6px; background: #000; color: #fff; font-size: 11px; font-weight: bold; padding: 2px 4px; border-radius: 3px;">
        GUÍA DE ENCOMIENDA & CARGA
      </div>
      <div style="font-size: 14px; font-weight: 900; color: #000; margin-top: 4px; font-family: monospace;">
        N° ${enc.numeroGuia}
      </div>
      <div style="font-size: 9.5px; color: #555;">
        Emisión: ${enc.fechaFormateada || enc.fechaCreacion.slice(0, 16)}
      </div>
    </div>

    <!-- CONTENEDOR DEL CÓDIGO QR -->
    <div style="text-align: center; margin: 10px 0; padding: 8px; background: #fdfdfd; border: 1px dashed #999; border-radius: 6px;">
      <div id="qrcodeDisplayModal" style="display: inline-block; padding: 6px; background: #fff; border: 1px solid #eee;"></div>
      <div style="font-size: 9.5px; color: #222; margin-top: 5px; font-weight: bold;">
        CÓDIGO DE VERIFICACIÓN QR:<br>
        <span style="font-family: monospace; color: #047857; font-size: 11px;">${enc.qrCode}</span>
      </div>
      <div style="font-size: 8.5px; color: #666; margin-top: 1px;">
        Escaneo obligatorio por el conductor al entregar al destinatario
      </div>
    </div>

    <!-- REMITENTE -->
    <div style="border-bottom: 1px dashed #bbb; padding-bottom: 6px; margin-bottom: 6px;">
      <strong style="font-size: 10.5px; color: #047857;">[1] REMITENTE (ORIGEN):</strong><br>
      <strong>Nombre:</strong> ${enc.remitente.nombre}<br>
      <strong>C.I./RUC:</strong> ${enc.remitente.cedula} · <strong>Telf:</strong> ${enc.remitente.telefono}<br>
      <strong>Origen:</strong> ${enc.remitente.origen} (${enc.remitente.puntoRecepcion || 'Agencia'})
    </div>

    <!-- DESTINATARIO -->
    <div style="border-bottom: 1px dashed #bbb; padding-bottom: 6px; margin-bottom: 6px;">
      <strong style="font-size: 10.5px; color: #047857;">[2] DESTINATARIO (DESTINO):</strong><br>
      <strong>Nombre:</strong> ${enc.destinatario.nombre}<br>
      <strong>C.I.:</strong> ${enc.destinatario.cedula} · <strong>Telf:</strong> ${enc.destinatario.telefono}<br>
      <strong>Destino:</strong> ${enc.destinatario.destino} · <strong>Modalidad:</strong> ${enc.destinatario.modalidad}<br>
      <strong>Dirección:</strong> ${enc.destinatario.direccion || 'Retiro en Agencia / Terminal'}<br>
      ${enc.destinatario.referencia ? `<strong>Referencia:</strong> ${enc.destinatario.referencia}<br>` : ''}
    </div>

    <!-- DETALLE DEL PAQUETE -->
    <div style="border-bottom: 1px dashed #bbb; padding-bottom: 6px; margin-bottom: 6px;">
      <strong style="font-size: 10.5px; color: #047857;">[3] CONTENIDO DEL ENVÍO:</strong><br>
      <strong>Categoría:</strong> ${enc.paquete.tipo}<br>
      <strong>Descripción:</strong> ${enc.paquete.descripcion}<br>
      <strong>Valor Declarado:</strong> $${valorDeclarado.toFixed(2)} USD<br>
      ${enc.asignacion.observaciones ? `<strong>Observaciones:</strong> ${enc.asignacion.observaciones}<br>` : ''}
    </div>

    <!-- UNIDAD ASIGNADA -->
    <div style="border-bottom: 1px dashed #bbb; padding-bottom: 6px; margin-bottom: 6px;">
      <strong style="font-size: 10.5px; color: #047857;">[4] DATOS DEL TRANSPORTE:</strong><br>
      ${enc.asignacion.placa ? `
        <strong>Unidad:</strong> ${enc.asignacion.placa} · <strong>Turno:</strong> ${enc.asignacion.turnoCodigo || 'N/A'}<br>
        <strong>Chofer Asignado:</strong> ${enc.asignacion.chofer || 'Conductor Autorizado'}
      ` : `
        <span style="color: #b45309; font-weight: bold;">En Bodega Central (Pendiente de Asignación a Turno)</span>
      `}
    </div>

    <!-- TOTAL Y PAGO -->
    <div style="padding: 6px 0; border-bottom: 2px solid #000; text-align: right;">
      <span style="font-size: 10px; color: #555;">FORMA DE PAGO: <strong>100% EFECTIVO EN VENTANILLA</strong></span><br>
      <strong style="font-size: 16px; color: #000;">TOTAL COBRADO: $${tarifa.toFixed(2)} USD</strong>
    </div>

    <!-- FIRMAS DE CONFORMIDAD -->
    <div style="display: flex; justify-content: space-between; margin-top: 24px; text-align: center; font-size: 9px;">
      <div style="width: 44%; border-top: 1px solid #000; padding-top: 3px;">
        Firma Remitente / Agente
      </div>
      <div style="width: 44%; border-top: 1px solid #000; padding-top: 3px;">
        Firma / Cédula Receptor
      </div>
    </div>

    <div style="text-align: center; margin-top: 10px; font-size: 8px; color: #777; line-height: 1.2;">
      * La Cooperativa no responde por dinero en efectivo o joyas no declaradas expresamente.<br>
      Presente este ticket original y su cédula física para el retiro de encomienda.
    </div>
  `;

  // Generación nativa del código QR
  setTimeout(() => {
    const qrHolder = document.getElementById('qrcodeDisplayModal');
    if (qrHolder && typeof QRCode !== 'undefined') {
      qrHolder.innerHTML = '';
      try {
        new QRCode(qrHolder, {
          text: enc.qrCode || enc.numeroGuia,
          width: 130,
          height: 130,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        });
      } catch (err) {
        console.warn('Error al generar QRCode:', err);
      }
    }
  }, 50);

  modal.style.display = 'flex';
}

function cerrarModalGuiaEncomienda() {
  const modal = document.getElementById('modalGuiaEncomienda');
  if (modal) modal.style.display = 'none';
}

function imprimirGuiaTermica() {
  const source = document.getElementById('imprimibleGuiaContenido');
  const target = document.getElementById('printableGuiaArea');
  if (!source || !target) return;

  target.innerHTML = source.innerHTML;
  window.print();
}

function abrirModalAsignarTurnoEncomienda(id) {
  adminState.encomiendaParaAsignarId = id;
  const enc = adminState.encomiendas.find(e => e.id === id);
  if (!enc) return;

  const lbl = document.getElementById('lblAsignarGuia');
  if (lbl) {
    lbl.innerText = `Guía: ${enc.numeroGuia} · Ruta: ${enc.remitente.origen} ➔ ${enc.destinatario.destino}`;
  }

  const select = document.getElementById('selectTurnoAsignarModal');
  if (select) {
    select.innerHTML = '';
    const turnosDisponibles = adminState.turnos.filter(t => t.estado === 'programado' || t.estado === 'en_ruta');

    if (turnosDisponibles.length === 0) {
      select.innerHTML = '<option value="">-- No hay turnos programados ni en ruta actualmente --</option>';
    } else {
      turnosDisponibles.forEach(t => {
        const esMismaRuta = (t.rutaOrigen === enc.remitente.origen && t.rutaDestino === enc.destinatario.destino);
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = `${esMismaRuta ? '★ ' : ''}Turno ${t.codigo} · ${t.vehiculoPlaca} (${t.choferNombre}) · Salida: ${t.horaSalida || 'Hoy'} [${t.rutaOrigen} ➔ ${t.rutaDestino}]`;
        select.appendChild(opt);
      });
    }
  }

  const modal = document.getElementById('modalAsignarTurnoEncomienda');
  if (modal) modal.style.display = 'flex';
}

function cerrarModalAsignarTurnoEncomienda() {
  const modal = document.getElementById('modalAsignarTurnoEncomienda');
  if (modal) modal.style.display = 'none';
  adminState.encomiendaParaAsignarId = null;
}

function ejecutarAsignacionTurnoEncomienda() {
  const encId = adminState.encomiendaParaAsignarId;
  const turnoId = document.getElementById('selectTurnoAsignarModal')?.value;

  if (!encId || !turnoId) {
    alert('Por favor seleccione un turno de transporte válido para asignar la encomienda.');
    return;
  }

  const enc = adminState.encomiendas.find(e => e.id === encId);
  const turno = adminState.turnos.find(t => t.id === turnoId);

  if (!enc || !turno) {
    alert('No se encontró la encomienda o el turno seleccionado.');
    return;
  }

  enc.asignacion.turnoId = turno.id;
  enc.asignacion.turnoCodigo = turno.codigo;
  enc.asignacion.placa = turno.vehiculoPlaca;
  enc.asignacion.chofer = turno.choferNombre;
  enc.estado = (turno.estado === 'en_ruta') ? 'En Tránsito' : 'Asignada a Unidad';

  enc.historial.push({
    fecha: new Date().toLocaleString('es-EC'),
    evento: `Asignada para despacho en Unidad ${turno.vehiculoPlaca} (${turno.choferNombre}) en Turno ${turno.codigo}`,
    usuario: adminState.currentUser ? adminState.currentUser.nombre : 'Operador de Despacho'
  });

  saveState('encomiendas');
  recalcularKPIs();
  renderEncomiendasTable();
  cerrarModalAsignarTurnoEncomienda();

  alert(`✓ ¡Encomienda ${enc.numeroGuia} asignada con éxito a la Unidad ${turno.vehiculoPlaca}!\nChofer responsable: ${turno.choferNombre}\nNuevo Estado: ${enc.estado}`);
}

function marcarEncomiendaEntregada(id) {
  const enc = adminState.encomiendas.find(e => e.id === id);
  if (!enc) return;

  const confirmar = confirm(`¿Confirmar la entrega definitiva de la encomienda ${enc.numeroGuia} a ${enc.destinatario.nombre}?\n\n(Se ha verificado la cédula física del receptor y el escaneo del Código QR)`);
  if (!confirmar) return;

  enc.estado = 'Entregada';
  enc.fechaEntrega = new Date().toLocaleString('es-EC');
  enc.historial.push({
    fecha: new Date().toLocaleString('es-EC'),
    evento: 'Entrega final confirmada al destinatario con código QR y recepción conforme',
    usuario: adminState.currentUser ? adminState.currentUser.nombre : 'Operador de Despacho'
  });

  saveState('encomiendas');
  recalcularKPIs();
  renderEncomiendasTable();

  alert(`✓ ¡Encomienda ${enc.numeroGuia} marcada como ENTREGADA exitosamente!\nRegistrada entrega conforme a ${enc.destinatario.nombre}.`);
}

// ── INICIALIZACIÓN GENERAL AL CARGAR EL DOM ──────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initLocalStorageData();
  checkSuperUserSetup();
  switchAdminTab('despacho');
});
