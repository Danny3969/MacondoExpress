# 🧠 MEMORIA MAESTRA · MACONDO EXPRESS
_Cooperativa de Transporte Interurbano Puerta a Puerta & Encomiendas con QR_
_Novasyscom Ecosystem · Fundador & CEO: El Señor_
_Fecha de Inicialización: 18 de Septiembre de 2026_

---

## 🏛️ 1. Identidad y Misión del Proyecto

**Macondo Express** es una plataforma digital de dos aplicaciones móviles enlazadas, diseñada específicamente para cooperativas de transporte interprovincial e interurbano (ej. Guayaquil ↔ Machala, Cuenca ↔ Loja).

El servicio combina:
1. **Transporte de Pasajeros Puerta a Puerta:** Viajes confortables en unidades reducidas (autos y camionetas de 4 cupos máximos), donde el chofer recoge a cada pasajero directamente en su dirección y coordenadas GPS.
2. **Logística de Encomiendas con Verificación QR:** Servicio de paquetería express con recogida y entrega puerta a puerta, validado físicamente mediante escaneo de Código QR por parte del chofer al momento de la entrega, disparando una notificación instantánea al remitente.
3. **Economía 100% en Efectivo:** Cero comisiones bancarias ni pasarelas; cobros y liquidaciones en mano al momento de abordar o recibir.
4. **Gobierno y Despacho Central:** Panel administrativo para que la cooperativa programe turnos, asigne unidades/choferes y supervise la recaudación.

---

## ⚖️ 2. Reglas de Negocio Fundamentales (Directrices del Señor)

| Directriz | Regla Operativa | Implementación Técnica |
|---|---|---|
| **Capacidad de Unidades** | Estricto máximo de **4 pasajeros** por vehículo (autos y camionetas). No se requiere mapa de asientos de autobús; el cliente elige cuántos puestos necesita (1 a 4). | Componente `SeatSelector` (1..4) y función RPC `reservar_cupos_atomico` con bloqueo pesimista `FOR UPDATE` que rechaza cualquier sobreventa. |
| **Recogida Puerta a Puerta** | El pasajero fija su dirección exacta, referencia visual y coordenadas GPS. | `LocationPickerField` almacena `latitud_recogida`, `longitud_recogida`, `direccion_recogida` y `referencia_recogida`. |
| **Navegación del Chofer** | El chofer visualiza su lista ordenada de recogidas y abre la ruta de un solo toque. | `PassengerManifestScreen` con enlace directo a URL Schemes de Google Maps (`https://www.google.com/maps/dir/?api=1&destination=lat,lng`) y Waze. |
| **Encomiendas Seguras** | Entrega física confirmada mediante código QR criptográfico único. | Se genera un `codigo_qr_entrega` (token hex único de 12 bytes). El chofer lo escanea con `QRScannerScreen` ejecutando `confirmar_entrega_encomienda`. |
| **Notificación al Remitente** | Al escanear el QR, el remitente recibe confirmación inmediata. | Disparador en base de datos / notificación en tiempo real con datos de quién recibió físicamente el paquete. |
| **Forma de Pago** | **100% Efectivo**. | Todas las vistas calculan y desglosan el cobro exacto en mano al abordar o entregar. |
| **Aislamiento Total de Drivo** | Misma arquitectura de lenguaje y base de datos (Flutter + Supabase), pero **estrictamente independiente**. | Repositorio limpio y aislado en `/scratch/MacondoExpress/`, base de datos y esquemas propios sin mezclar código con Drivo. |

---

## 🏗️ 3. Arquitectura del Repositorio & Código Fuente

```text
/Users/contabilidad/.gemini/antigravity-ide/scratch/MacondoExpress/
│
├── MEMORY.md                          # Esta memoria maestra del proyecto
├── .gitignore                         # Exclusiones de Git estándar para Flutter/Dart
│
├── supabase/
│   └── macondo_schema.sql             # DDL relacional (usuarios, vehiculos, rutas, turnos, reservas, encomiendas, RPCs e índices)
│
├── macondo_core/                      # Núcleo Dart compartido
│   ├── pubspec.yaml
│   └── lib/
│       ├── constants/
│       │   └── app_colors.dart        # Paleta: Slate Navy (#090D16), Emerald (#10B981), Amber (#F59E0B)
│       ├── models/
│       │   ├── usuario.dart           # Roles: pasajero, chofer, admin
│       │   ├── vehiculo.dart          # Autos y Camionetas (4 cupos)
│       │   ├── ruta.dart              # Origen, destino, tarifas de pasaje y encomienda
│       │   ├── turno_viaje.dart       # Salidas programadas con control de ocupación
│       │   ├── reserva_pasajero.dart  # Reserva de 1..4 puestos con geolocalización
│       │   └── encomienda.dart        # Encomiendas con QR criptográfico
│       └── services/
│           └── macondo_supabase_service.dart # CRUD, RPCs de reserva y escaneo QR
│
├── macondo_pasajero/                  # Aplicación de Clientes y Encomiendas
│   ├── pubspec.yaml
│   └── lib/
│       ├── main.dart                  # Configuración Material 3 con tema oscuro corporativo
│       ├── widgets/
│       │   ├── app_header.dart        # Cabecera corporativa
│       │   ├── seat_counter.dart      # Selector visual de 4 puestos
│       │   ├── trip_card.dart         # Tarjeta de turno y horario
│       │   └── location_picker_field.dart # Campo de dirección y GPS puerta a puerta
│       └── screens/
│           ├── auth_screen.dart       # Ingreso rápido de pasajero
│           ├── home_screen.dart       # Portal de viajes y encomiendas
│           ├── turnos_screen.dart     # Listado de salidas disponibles
│           ├── booking_screen.dart    # Reserva con puerta a puerta y cobro en efectivo
│           ├── encomienda_form_screen.dart # Envío de paquetería
│           ├── encomienda_tracking_screen.dart # Visor de Código QR de seguridad
│           └── mis_viajes_screen.dart # Historial de reservas y envíos
│
├── macondo_conductor/                 # Aplicación de Choferes & Despacho
│   ├── pubspec.yaml
│   └── lib/
│       ├── main.dart                  # Entrypoint de choferes y admin
│       ├── widgets/
│       │   └── conductor_header.dart  # HUD de chofer activo y vehículo
│       └── screens/
│           ├── driver_login_screen.dart # Selector de perfil (Chofer vs Administrador)
│           ├── driver_home_screen.dart  # Métricas de turno, ocupación y recaudación
│           ├── passenger_manifest_screen.dart # Manifiesto puerta a puerta con botón GPS
│           ├── parcel_manifest_screen.dart    # Manifiesto de carga y encomiendas
│           ├── qr_scanner_screen.dart         # Escáner QR de confirmación de entrega
│           └── admin_dispatch_screen.dart     # Creación de turnos, asignación y despacho
│
└── interactive_preview/               # Simulador Dual Reactivo en Tiempo Real
    └── index.html                     # Desplegado en http://localhost:8092 con PM2
```

---

## 💾 4. Base de Datos Relacional (Supabase PostgreSQL)

### Tablas Principales
1. `usuarios`: Perfiles (`pasajero`, `chofer`, `admin`), teléfonos para WhatsApp y estados.
2. `vehiculos`: Autos y camionetas con `capacidad_pasajeros = 4`.
3. `rutas`: Tarifas de pasaje en efectivo y tarifa base de encomiendas.
4. `turnos_viajes`: Salidas por fecha/hora, control de `cupos_totales` (4), `cupos_ocupados` y estado del viaje (`programado`, `recogiendo`, `en_camino`, `finalizado`).
5. `reservas_pasajeros`: Reservas de 1 a 4 puestos, dirección exacta, referencia, coordenadas de recogida y teléfono de contacto.
6. `encomiendas`: Puntos de recogida y entrega, descripción, tarifa y `codigo_qr_entrega` único.

### Funciones RPC Críticas
- **`reservar_cupos_atomico`**:
  ```sql
  SELECT cupos_totales, cupos_ocupados FROM turnos_viajes WHERE id = p_turno_id FOR UPDATE;
  ```
  Evita condiciones de carrera. Si `cupos_ocupados + p_cantidad > 4`, deniega la transacción y retorna mensaje amigable.
- **`confirmar_entrega_encomienda`**:
  Verifica que el `codigo_qr_entrega` exista, no haya sido entregado previamente, actualiza el estado a `entregada` con marca de tiempo `NOW()` y retorna datos para notificar al remitente.

---

## 🌐 5. Simulador Interactivo Dual en Vivo

- **Servicio:** `macondo-express-web` en PM2
- **URL Local:** `http://localhost:8092`
- **Capacidades del Simulador:**
  - Teléfono Izquierdo: Flujo de Pasajero (reserva atómica de 1 a 4 puestos, fijación de GPS y generación de QR de encomienda).
  - Teléfono Derecho: Flujo de Conductor (manifiesto puerta a puerta en tiempo real, enlace de navegación GPS a Google Maps/Waze, escáner de QR y panel de despacho administrativo).
  - Estado Reactivo Compartido: Las reservas y envíos hechos en un teléfono se reflejan al instante en el teléfono opuesto.

---

## 🔗 6. Integración con el Búnker Novasyscom & Alberth

- **Alberth CLI (AGC):** Registrado en `/Users/contabilidad/alberth_cli/ag-config.yaml` bajo el identificador `macondo-express` (Puerto `8092`).
- **Hub Novasyscom:** Vinculado en `00 - HUB NOVASYSCOM (Cerebro Digital).md`.
- **Ficha de Proyecto:** Documentado en `PROJECT_MACONDO_EXPRESS.md`.
- **Memoria Maestra Central:** Sincronizado en `MEMORY.md` del repositorio Alberth.

---

## 🚀 7. Guía para Sincronización en GitHub

Para subir el proyecto a GitHub en la cuenta del Señor (`Danny3969`):

1. **Crear el Repositorio Vacío en GitHub:**
   - Ir a [github.com/new](https://github.com/new)
   - Nombre del Repositorio: **`MacondoExpress`**
   - Visibilidad: Privado (o Público, a elección del Señor)
   - *Nota:* No inicializar con README ni `.gitignore` (el repositorio local ya los tiene listos).

2. **Empujar el Código desde la Terminal:**
   ```bash
   cd /Users/contabilidad/.gemini/antigravity-ide/scratch/MacondoExpress
   git remote set-url origin git@github.com:Danny3969/MacondoExpress.git
   git push -u origin main
   ```
   *(La autenticación SSH ya está 100% verificada para `Danny3969`).*

---

## 📅 Bitácora de Versiones
- **2026-09-21 (v1.1.0):** Implementación integral de autenticación y registro por número de teléfono (+593 Ecuador / internacional), verificación OTP de 6 dígitos (SMS / WhatsApp) y registro de Cédula de Identidad en `macondo_pasajero`, `macondo_conductor`, `macondo_core`, `macondo_schema.sql` y en el Simulador Dual interactivo (`http://localhost:8092`). Repositorio oficial conectado y sincronizado con GitHub en `https://github.com/Danny3969/MacondoExpress`.
- **2026-09-18 (v1.0.0-alpha):** Creación del proyecto, DDL de base de datos Supabase, paquete compartido `macondo_core`, aplicaciones `macondo_pasajero` y `macondo_conductor`, simulador dual en puerto `8092` e integración con el ecosistema Alberth.
