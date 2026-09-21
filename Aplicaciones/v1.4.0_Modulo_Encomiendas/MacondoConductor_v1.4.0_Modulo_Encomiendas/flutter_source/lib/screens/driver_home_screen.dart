import 'package:flutter/material.dart';
import 'package:macondo_core/constants/app_colors.dart';
import 'package:macondo_core/models/usuario.dart';
import 'package:macondo_core/models/turno_viaje.dart';
import 'package:macondo_core/models/ruta.dart';
import 'package:macondo_core/models/vehiculo.dart';
import '../widgets/conductor_header.dart';
import 'passenger_manifest_screen.dart';
import 'parcel_manifest_screen.dart';
import 'qr_scanner_screen.dart';
import 'driver_settlement_screen.dart';

class DriverHomeScreen extends StatefulWidget {
  final Usuario choferActual;

  const DriverHomeScreen({
    super.key,
    required this.choferActual,
  });

  @override
  State<DriverHomeScreen> createState() => _DriverHomeScreenState();
}

class _DriverHomeScreenState extends State<DriverHomeScreen> {
  late TurnoViaje _turnoActivo;
  String _estadoTurno = 'programado'; // 'programado', 'recogiendo', 'en_camino', 'finalizado'

  @override
  void initState() {
    super.initState();
    // Turno demostrativo activo para el chofer
    _turnoActivo = TurnoViaje(
      id: 'trn-chofer-hoy-01',
      rutaId: 'rt-gye-mch',
      ruta: Ruta(
        id: 'rt-gye-mch',
        origenCiudad: 'Guayaquil',
        destinoCiudad: 'Machala',
        tarifaPasajeEfectivo: 12.00,
        tarifaEncomiendaBase: 5.00,
      ),
      vehiculo: Vehiculo(
        id: 'veh-01',
        placa: 'GBA-4123',
        tipo: 'auto',
        marcaModelo: 'Chevrolet Aveo Activo',
        capacidadPasajeros: 4,
      ),
      chofer: widget.choferActual,
      fechaSalida: DateTime.now().toIso8601String().split('T')[0],
      horaSalida: '09:30:00',
      cuposTotales: 4,
      cuposOcupados: 3, // 3 de 4 puestos reservados
      totalRecaudadoEfectivo: 41.00, // 3 pasajes ($36) + 1 encomienda ($5)
      estado: _estadoTurno,
    );
  }

  void _avanzarEstado() {
    setState(() {
      if (_estadoTurno == 'programado') {
        _estadoTurno = 'recogiendo';
      } else if (_estadoTurno == 'recogiendo') {
        _estadoTurno = 'en_camino';
      } else if (_estadoTurno == 'en_camino') {
        _estadoTurno = 'finalizado';
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => DriverSettlementScreen(
              turno: _turnoActivo,
              choferActual: widget.choferActual,
            ),
          ),
        );
      }
      _turnoActivo = _turnoActivo.copyWith(estado: _estadoTurno);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          ConductorHeader(
            title: widget.choferActual.nombreCompleto,
            subtitle: 'Unidad: ${_turnoActivo.vehiculo?.placa} (${_turnoActivo.vehiculo?.tipo.toUpperCase()})',
            rolTag: 'Chofer Activo',
            trailing: IconButton(
              icon: const Icon(Icons.qr_code_scanner, color: AppColors.accentLight),
              tooltip: 'Escanear QR Entrega',
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => QRScannerScreen(choferActual: widget.choferActual),
                  ),
                );
              },
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(18),
              children: [
                // 1. Tarjeta de Turno Activo de Hoy
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: const [
                              Icon(Icons.directions_car, color: AppColors.amber, size: 20),
                              SizedBox(width: 8),
                              Text(
                                'TURNO ASIGNADO HOY',
                                style: TextStyle(
                                  color: AppColors.amber,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 1.1,
                                ),
                              ),
                            ],
                          ),
                          _buildEstadoBadge(_estadoTurno),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        '${_turnoActivo.ruta?.origenCiudad} ➔ ${_turnoActivo.ruta?.destinoCiudad}',
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Salida Programada: ${_turnoActivo.horaSalida.substring(0, 5)} · ${_turnoActivo.fechaSalida}',
                        style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                      ),
                      const SizedBox(height: 14),
                      const Divider(color: AppColors.divider, height: 1),
                      const SizedBox(height: 14),

                      // Métricas: Cupos de 4 y Recaudación en Efectivo
                      Row(
                        children: [
                          Expanded(
                            child: _buildMetricItem(
                              'Ocupación',
                              '${_turnoActivo.cuposOcupados} de 4',
                              '${_turnoActivo.cuposDisponibles} libres',
                              Icons.airline_seat_recline_normal,
                              AppColors.accentLight,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: _buildMetricItem(
                              'Total Efectivo',
                              '\$${_turnoActivo.totalRecaudadoEfectivo?.toStringAsFixed(2)}',
                              'A cobrar en mano',
                              Icons.payments,
                              AppColors.amber,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Botón de Cambio de Estado del Viaje
                      SizedBox(
                        width: double.infinity,
                        height: 46,
                        child: ElevatedButton.icon(
                          onPressed: _estadoTurno == 'finalizado'
                              ? () {
                                  Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (_) => DriverSettlementScreen(
                                        turno: _turnoActivo,
                                        choferActual: widget.choferActual,
                                      ),
                                    ),
                                  );
                                }
                              : _avanzarEstado,
                          icon: Icon(_getIconForState(_estadoTurno), size: 20),
                          label: Text(_estadoTurno == 'finalizado' ? 'Ver Liquidación & Cierre de Caja' : _getButtonTextForState(_estadoTurno)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _getColorForState(_estadoTurno),
                            foregroundColor: AppColors.primary,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                // 2. Acceso a Manifiesto de Pasajeros Puerta a Puerta
                _buildActionCard(
                  title: 'Manifiesto de Pasajeros',
                  subtitle: '${_turnoActivo.cuposOcupados} pasajeros con ubicación de recogida GPS',
                  icon: Icons.people_alt_outlined,
                  badgeText: '${_turnoActivo.cuposOcupados} Pasajeros',
                  badgeColor: AppColors.accent,
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => PassengerManifestScreen(turno: _turnoActivo),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 14),

                // 3. Acceso a Encomiendas Asignadas
                _buildActionCard(
                  title: 'Encomiendas Asignadas',
                  subtitle: '2 paquetes puerta a puerta pendientes de entrega',
                  icon: Icons.inventory_2_outlined,
                  badgeText: '2 Paquetes',
                  badgeColor: AppColors.amber,
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => ParcelManifestScreen(turno: _turnoActivo),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 14),

                // 4. Botón Directo Escáner QR de Entrega
                _buildActionCard(
                  title: 'Escanear QR de Entrega',
                  subtitle: 'Confirmar entrega física de paquete al destinatario',
                  icon: Icons.qr_code_scanner,
                  badgeText: 'Escáner',
                  badgeColor: AppColors.accentLight,
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => QRScannerScreen(choferActual: widget.choferActual),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 14),

                // 5. Arqueo y Liquidación de Turno (Cierre de Caja)
                _buildActionCard(
                  title: 'Arqueo & Cierre de Caja',
                  subtitle: 'Cuota cooperativa (\$6), peajes y balance neto en mano',
                  icon: Icons.point_of_sale,
                  badgeText: 'Liquidación',
                  badgeColor: AppColors.amber,
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => DriverSettlementScreen(
                          turno: _turnoActivo,
                          choferActual: widget.choferActual,
                        ),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricItem(String label, String value, String subvalue, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(color: AppColors.textDim, fontSize: 10)),
              Text(
                value,
                style: TextStyle(color: color, fontSize: 14, fontWeight: FontWeight.bold),
              ),
              Text(subvalue, style: const TextStyle(color: AppColors.textSecondary, fontSize: 10)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required String badgeText,
    required Color badgeColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: badgeColor.withOpacity(0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: badgeColor, size: 24),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 11),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: badgeColor.withOpacity(0.15),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                badgeText,
                style: TextStyle(color: badgeColor, fontSize: 11, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(width: 4),
            const Icon(Icons.chevron_right, color: AppColors.textDim),
          ],
        ),
      ),
    );
  }

  Widget _buildEstadoBadge(String estado) {
    Color color;
    String label;
    switch (estado) {
      case 'programado':
        color = AppColors.textSecondary;
        label = 'PROGRAMADO';
        break;
      case 'recogiendo':
        color = AppColors.amber;
        label = 'RECOGIENDO PUERTA A PUERTA';
        break;
      case 'en_camino':
        color = AppColors.accent;
        label = 'EN CARRETERA';
        break;
      case 'finalizado':
        color = AppColors.accentLight;
        label = 'FINALIZADO';
        break;
      default:
        color = AppColors.textDim;
        label = estado.toUpperCase();
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withOpacity(0.5)),
      ),
      child: Text(
        label,
        style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold),
      ),
    );
  }

  String _getButtonTextForState(String estado) {
    switch (estado) {
      case 'programado':
        return 'Iniciar Recogida Puerta a Puerta';
      case 'recogiendo':
        return 'Pasajeros Listos ➔ Salir a Carretera';
      case 'en_camino':
        return 'Finalizar Turno de Viaje';
      case 'finalizado':
        return 'Viaje Completado';
      default:
        return 'Siguiente Fase';
    }
  }

  IconData _getIconForState(String estado) {
    switch (estado) {
      case 'programado':
        return Icons.play_arrow;
      case 'recogiendo':
        return Icons.departure_board;
      case 'en_camino':
        return Icons.check_circle_outline;
      default:
        return Icons.flag;
    }
  }

  Color _getColorForState(String estado) {
    switch (estado) {
      case 'programado':
        return AppColors.amber;
      case 'recogiendo':
        return AppColors.accent;
      case 'en_camino':
        return AppColors.accentLight;
      default:
        return AppColors.textDim;
    }
  }
}
