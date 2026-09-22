# 📦 REGISTRO DE COMPILACIONES Y VERSIONES · MACONDO EXPRESS

En este directorio se almacenan de manera versionada todas las compilaciones generadas para el ecosistema de transporte **Macondo Express**:
1. **Macondo Pasajero** (Reserva puerta a puerta, PIN 4 dígitos, radar GPS chofer).
2. **Macondo Conductor** (Hoja de ruta, validación PIN abordaje, liquidación de turno $6 coop).
3. **Consola Central de Administración** (Despacho de turnos, manifiestos oficiales ANT, radar satelital, auditoría de arqueos).
4. **Suite Completa** (Empaquetado integrado con lanzadores directos de escritorio para Mac y Linux).

---

## 📋 Tabla Histórica de Versiones Compiladas

| Versión | Fecha y Hora | Commit Git | Componentes Empaquetados | Estado |
|---|---|---|---|---|
| **`v1.6.0_Autenticacion_y_Registro_Completo`** | 22/9/2026, 10:16:53 a. m. | `f68bafd` | Pasajero, Conductor, Consola Admin, Suite | ✅ Compilado & Verificado |
| **`v1.5.0_Redisenio_Minimalista_Consola`** | 21/9/2026, 12:53:45 p. m. | `e29b732` | Pasajero, Conductor, Consola Admin, Suite | ✅ Compilado & Verificado |
| **`v1.4.0_Modulo_Encomiendas`** | 21/9/2026, 12:27:28 p. m. | `b93bc1d` | Pasajero, Conductor, Consola Admin, Suite | ✅ Compilado & Verificado |
| **`v1.3.0_Datos_Reales_Formularios_Limpios`** | 21/9/2026, 11:54:17 a. m. | `e0c08b2` | Pasajero, Conductor, Consola Admin, Suite | ✅ Compilado & Verificado |
| **`v1.2.0_Ciudades_Navegacion_Pagina_Completa`** | 21/9/2026, 11:23:03 a. m. | `23913c6` | Pasajero, Conductor, Consola Admin, Suite | ✅ Compilado & Verificado |
| **`v1.1.0_Admin_Roles_Choferes_Turnos`** | 21/9/2026, 10:51:32 a. m. | `da78288` | Pasajero, Conductor, Consola Admin, Suite | ✅ Compilado & Verificado |
| **`v1.0.0_Oficial_20260921`** | 21/9/2026, 10:17:35 a. m. | `217ebe4` | Pasajero, Conductor, Consola Admin, Suite | ✅ Compilado & Verificado |

---

## 🛠️ Cómo Ejecutar las Versiones Compiladas

Cada carpeta de versión dentro de `Aplicaciones/` incluye lanzadores independientes para Mac y Linux:

### 1. Consola Central de Administración (Despacho & Tránsito ANT)
- **Ruta**: `Aplicaciones/<VERSION>/MacondoConsolaAdmin_<VERSION>/`
- **Doble clic en Mac**: Abre el archivo `Lanzar_ConsolaAdmin.command`
- **Línea de comandos**:
  ```bash
  cd Aplicaciones/v1.0.0_Oficial_20260921/MacondoConsolaAdmin_v1.0.0_Oficial_20260921
  ./run_admin.sh
  # Disponible en: http://localhost:8094
  ```

### 2. Aplicación de Pasajeros
- **Ruta**: `Aplicaciones/<VERSION>/MacondoPasajero_<VERSION>/`
- **Doble clic en Mac**: Abre `Lanzar_AppPasajero.command`
- **Navegador**: Abre `index.html` o visita `http://localhost:8092`

### 3. Aplicación de Conductores
- **Ruta**: `Aplicaciones/<VERSION>/MacondoConductor_<VERSION>/`
- **Doble clic en Mac**: Abre `Lanzar_AppConductor.command`
- **Navegador**: Abre `index.html` o visita `http://localhost:8092`

### 4. Suite Completa Integrada
- **Ruta**: `Aplicaciones/<VERSION>/MacondoSuiteCompleta_<VERSION>/`
- **Doble clic en Mac**: Abre `Lanzar_Suite_Macondo.command` para arrancar simultáneamente el Simulador Dual (Puerto 8092) y la Consola de Administración (Puerto 8094).

---

## ⚡ Resumen de Cambios por Versión

### `v1.4.0_Modulo_Encomiendas` (21/09/2026)
- **Módulo Integral de Encomiendas & Paquetería Puerta a Puerta**:
  - Pestaña `#nav-encomiendas` en sidebar con contador dinámico en tiempo real.
  - Panel `#section-encomiendas` con 5 KPIs logísticos (Total, En Bodega, En Tránsito, Entregadas, Recaudación en Efectivo).
  - Filtros en vivo: búsqueda por N° Guía, Remitente, Destinatario o Celular, estado logístico y ciudad de destino.
  - Registro en página completa (`#section-crear-encomienda`) cumpliendo la directiva de formularios 100% limpios sin datos precargados.
  - Validación de cédula ecuatoriana (Módulo 10) para remitente y destinatario.
  - Generación de código QR oficial con QRCode.js para validación de entrega antifraude por el conductor.
  - Modal e impresión de Guía Térmica oficial (80mm) con RUC, firmas, valor declarado y desglose 100% efectivo.
  - Modal de asignación de paquetes en bodega a turnos de transporte activos/programados.
  - Integración total de la recaudación de encomiendas en los KPIs consolidados de la cooperativa.

### `v1.3.0_Datos_Reales_Formularios_Limpios` (21/09/2026)
- Purga completa de datos de prueba/mock.
- Formularios limpios (`value=""`) para registro de nuevos turnos, choferes, unidades, ciudades y usuarios.

### `v1.2.0_Ciudades_Navegacion_Pagina_Completa` (21/09/2026)
- Eliminación de ventanas emergentes laterales derechas y transición a navegación a pantalla completa con retorno fluido.
- Módulo de Ciudades y Rutas del corredor Guayaquil - El Oro.

---

## ⚡ Cómo Generar una Nueva Versión Compilada

Para compilar una nueva versión en cualquier momento, ejecuta desde la raíz del proyecto:

```bash
# Versión automática con fecha y hora:
npm run build:apps

# O con un nombre personalizado específico:
node scripts/compilar_aplicaciones.js "v1.5.0_Produccion"
```
Cada ejecución creará una carpeta aislada con su respectivo manifiesto SHA-256 y se añadirá automáticamente a esta bitácora histórica.


