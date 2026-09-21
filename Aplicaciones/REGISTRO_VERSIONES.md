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

## ⚡ Cómo Generar una Nueva Versión Compilada

Para compilar una nueva versión en cualquier momento, ejecuta desde la raíz del proyecto:

```bash
# Versión automática con fecha y hora:
npm run build:apps

# O con un nombre personalizado específico:
node scripts/compilar_aplicaciones.js "v1.1.0_Produccion_20260925"
```
Cada ejecución creará una carpeta aislada con su respectivo manifiesto SHA-256 y se añadirá automáticamente a esta bitácora histórica.

