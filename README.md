# 🚗 MACONDO EXPRESS
> **Cooperativa de Transporte Interurbano Puerta a Puerta & Logística de Encomiendas con Verificación QR**  
> *Ecosistema Corporativo Novasyscom · Fundador & CEO: El Señor*  
> *Repositorio Oficial:* [https://github.com/Danny3969/MacondoExpress](https://github.com/Danny3969/MacondoExpress)

---

## 🏛️ 1. Identidad y Misión del Proyecto

**Macondo Express** es una plataforma digital de doble aplicación móvil (Pasajero y Conductor) diseñada para cooperativas de transporte interprovincial e interurbano (rutas como Guayaquil ↔ Machala, Cuenca ↔ Loja, etc.).

La plataforma moderniza y formaliza la operación de transporte cooperativo combinando:
1. **Viajes Puerta a Puerta:** El vehículo recoge a cada pasajero directamente en su dirección exacta y coordenadas GPS.
2. **Capacidad Limitada a 4 Cupos:** Operación exclusiva en autos sedán y camionetas confortables con un máximo estricto de **4 pasajeros**. El pasajero no escoge de un mapa de asientos de autobús; elige cuántos puestos necesita (1 a 4) para él y sus acompañantes.
3. **Logística de Encomiendas con QR Criptográfico:** Envío y entrega de paquetería express con verificación física obligatoria mediante escaneo de Código QR por parte del chofer al momento de la entrega, notificando al remitente en tiempo real.
4. **Economía 100% en Efectivo:** Cero pasarelas de pago, cobros y liquidaciones en mano al abordar o entregar.
5. **Aislamiento Total de Drivo:** Repositorio y esquema de base de datos totalmente independientes.

---

## ⚖️ 2. Reglas de Negocio Fundamentales

| Directriz | Regla Operativa | Implementación Técnica |
|---|---|---|
| **Capacidad Estricta (4 Cupos)** | Máximo de 4 puestos por vehículo. | RPC `reservar_cupos_atomico` con bloqueo pesimista `FOR UPDATE` en PostgreSQL que rechaza transacciones concurrentes si `ocupados + nuevos > 4`. |
| **Recogida Puerta a Puerta** | El cliente define su ubicación exacta. | Modelado con `latitud_recogida`, `longitud_recogida`, `direccion_recogida` y `referencia_recogida`. |
| **Navegación del Chofer** | Manifiesto ordenado de recogidas. | Acceso directo con un toque a Google Maps (`https://www.google.com/maps/dir/?api=1&destination=lat,lng`) y Waze. |
| **Encomiendas Seguras** | Entrega física verificada con QR. | Generación de token criptográfico hex único de 12 bytes (`codigo_qr_entrega`). RPC `confirmar_entrega_encomienda` para validar y sellar entrega. |
| **Cobro en Efectivo** | Pago en mano sin comisiones bancarias. | Desglose claro de montos en moneda local (USD) al abordar y al entregar. |

---

## 🏗️ 3. Arquitectura del Repositorio

```text
MacondoExpress/
├── README.md                          # Documentación maestra del repositorio
├── MEMORY.md                          # Memoria viva del proyecto y bitácora técnica
├── .env.example                       # Plantilla de variables de entorno para Supabase
├── .gitignore                         # Exclusiones estándar Git para Flutter/Dart
│
├── supabase/
│   └── macondo_schema.sql             # DDL relacional (usuarios, vehiculos, rutas, turnos, reservas, encomiendas, RPCs e índices)
│
├── macondo_core/                      # Módulo compartido Dart (Modelos, Colores, Servicios)
│   ├── pubspec.yaml
│   └── lib/
│       ├── constants/app_colors.dart
│       ├── models/
│       └── services/macondo_supabase_service.dart
│
├── macondo_pasajero/                  # App Flutter para Clientes
│   ├── pubspec.yaml
│   └── lib/
│       ├── main.dart
│       ├── widgets/
│       └── screens/
│
├── macondo_conductor/                 # App Flutter para Choferes y Despacho
│   ├── pubspec.yaml
│   └── lib/
│       ├── main.dart
│       ├── widgets/
│       └── screens/
│
└── interactive_preview/               # Simulador Dual Reactivo en Tiempo Real
    └── index.html                     # Desplegado en http://localhost:8092 con PM2
```

---

## 💾 4. Base de Datos Relacional (Supabase PostgreSQL)

El archivo [`supabase/macondo_schema.sql`](supabase/macondo_schema.sql) contiene la arquitectura completa:
* **Tablas:** `usuarios`, `vehiculos`, `rutas`, `turnos_viajes`, `reservas_pasajeros`, `encomiendas`.
* **RPCs Críticas:**
  * `reservar_cupos_atomico`: Bloqueo de fila a nivel de base de datos para prevenir sobreventa en reservas simultáneas.
  * `confirmar_entrega_encomienda`: Validación criptográfica del QR escaneado por el chofer y timestamp de entrega.
* **Índices de Alto Rendimiento:** Consultas optimizadas por ruta, fecha de turno, chofer y código QR.

---

## 🌐 5. Simulador Interactivo Dual en Vivo

Para validar la experiencia de usuario de extremo a extremo sin necesidad de compilar localmente en emuladores:
* **Servicio:** `macondo-express-web` en PM2
* **URL:** [http://localhost:8092](http://localhost:8092)
* **Funcionalidad:**
  * **Pantalla Izquierda (Pasajero):** Reserva de 1 a 4 cupos con dirección puerta a puerta, cálculo de tarifa en efectivo y generación de código QR para paquetería.
  * **Pantalla Derecha (Conductor):** Manifiesto dinámico de recogidas, apertura de GPS de navegación, escaneo de QR y despacho administrativo de turnos.
  * **Sincronización:** Los cambios generados en un teléfono se reflejan reactivamente en el teléfono opuesto en tiempo real.

---

## 🚀 6. Guía Rápida de Ejecución

### Simulador Web
```bash
# Iniciar con PM2 en el puerto 8092
pm2 start "npx -y serve -s interactive_preview -l 8092" --name "macondo-express-web"
```

### Aplicaciones Flutter
```bash
# Pasajero
cd macondo_pasajero
flutter pub get
flutter run

# Conductor / Despacho
cd ../macondo_conductor
flutter pub get
flutter run
```

---
*Macondo Express · Novasyscom Ecosystem © 2026*
