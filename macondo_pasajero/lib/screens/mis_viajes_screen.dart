import 'package:flutter/material.dart';
import 'package:macondo_core/constants/app_colors.dart';
import 'package:macondo_core/models/usuario.dart';
import 'package:macondo_core/models/reserva_pasajero.dart';
import 'package:macondo_core/models/encomienda.dart';
import '../widgets/app_header.dart';
import 'encomienda_tracking_screen.dart';

class MisViajesScreen extends StatefulWidget {
  final Usuario usuarioActual;

  const MisViajesScreen({
    super.key,
    required this.usuarioActual,
  });

  @override
  State<MisViajesScreen> createState() => _MisViajesScreenState();
}

class _MisViajesScreenState extends State<MisViajesScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          MacondoHeader(
            title: 'Mis Reservas & Envíos',
            subtitle: widget.usuarioActual.nombreCompleto,
            showBack: true,
          ),
          Container(
            color: AppColors.surface,
            child: TabBar(
              controller: _tabController,
              indicatorColor: AppColors.accent,
              indicatorWeight: 3,
              labelColor: AppColors.accentLight,
              unselectedLabelColor: AppColors.textSecondary,
              tabs: const [
                Tab(icon: Icon(Icons.airport_shuttle), text: 'Viajes Reservados'),
                Tab(icon: Icon(Icons.inventory_2), text: 'Mis Encomiendas'),
              ],
            ),
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildViajesTab(),
                _buildEncomiendasTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildViajesTab() {
    // Demostrativo
    return ListView(
      padding: const EdgeInsets.all(18),
      children: [
        _buildReservaCard(
          origen: 'Guayaquil',
          destino: 'Machala',
          fecha: 'Hoy, 09:30 AM',
          puestos: 2,
          montoEfectivo: 24.00,
          direccionRecogida: 'Cdla. Alborada 8va etapa, Mz 812 v 4',
          referencia: 'Frente al parque',
          estado: 'confirmada',
          codigoPin: '4821',
          choferNombre: 'Marco Proaño (Prof. Tipo C)',
          placaVehiculo: 'GBA-4123',
          telefonoChofer: '0987654321',
        ),
      ],
    );
  }

  Widget _buildReservaCard({
    required String origen,
    required String destino,
    required String fecha,
    required int puestos,
    required double montoEfectivo,
    required String direccionRecogida,
    required String referencia,
    required String estado,
    required String codigoPin,
    required String choferNombre,
    required String placaVehiculo,
    required String telefonoChofer,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '$origen ➔ $destino',
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.accent.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  estado.toUpperCase(),
                  style: const TextStyle(
                    color: AppColors.accentLight,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text('Salida: $fecha', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
          Text('Puestos: $puestos cupos en sedán/camioneta', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
          Text('Recogida: $direccionRecogida ($referencia)', style: const TextStyle(color: AppColors.textDim, fontSize: 12)),
          const SizedBox(height: 12),

          // ── TARJETA DESTACADA: BOLETO PIN DE ABORDAJE (ANTIFRAUDE) ──
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.surfaceElevated,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.accent, width: 1.2),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: const [
                        Icon(Icons.pin, color: AppColors.accentLight, size: 16),
                        SizedBox(width: 4),
                        Text(
                          'PIN DE ABORDAJE:',
                          style: TextStyle(
                            color: AppColors.accentLight,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    Text(
                      'DICTA ESTE CÓDIGO AL SUBIR',
                      style: TextStyle(color: AppColors.textDim, fontSize: 9, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: codigoPin.split('').map((digit) => Container(
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: AppColors.accent),
                    ),
                    child: Text(
                      digit,
                      style: const TextStyle(
                        color: AppColors.accentLight,
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  )).toList(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // ── RADAR DE PROXIMIDAD DEL CHOFER ──
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.surfaceElevated,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.amber.withOpacity(0.5)),
            ),
            child: Row(
              children: [
                const Icon(Icons.radar, color: AppColors.amber, size: 22),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Chofer: $choferNombre (Placa: $placaVehiculo)',
                        style: const TextStyle(color: AppColors.textPrimary, fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Aproximándose a tu puerta (A ~1.4 km · 4 min)',
                        style: TextStyle(color: AppColors.amber, fontSize: 11),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Cobro en Efectivo en Mano:', style: TextStyle(color: AppColors.textDim, fontSize: 12)),
              Text(
                '\$${montoEfectivo.toStringAsFixed(2)} Efectivo',
                style: const TextStyle(color: AppColors.amber, fontSize: 14, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEncomiendasTab() {
    final mockEncomienda = Encomienda(
      id: 'enc-0982-demo',
      remitenteId: widget.usuarioActual.id,
      remitenteNombre: widget.usuarioActual.nombreCompleto,
      remitenteTelefono: widget.usuarioActual.telefono,
      destinatarioNombre: 'Luisa Mora',
      destinatarioTelefono: '0981122334',
      latitudRecogida: -2.1894,
      longitudRecogida: -79.8891,
      direccionRecogida: 'Urdesa Central, Calle 3ra #401',
      latitudEntrega: -3.2581,
      longitudEntrega: -79.9554,
      direccionEntrega: 'Av. 25 de Junio y Junín',
      descripcionPaquete: 'Sobre con escrituras y llaves',
      precioEnvioEfectivo: 5.00,
      codigoQrEntrega: 'MCND-QR-7FA89B1C',
      estado: 'en_camino',
      createdAt: DateTime.now(),
    );

    return ListView(
      padding: const EdgeInsets.all(18),
      children: [
        Container(
          margin: const EdgeInsets.only(bottom: 14),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.accent.withOpacity(0.4)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Encomienda Activa',
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.amber.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text(
                      'EN CAMINO',
                      style: TextStyle(color: AppColors.amber, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text('Destinatario: ${mockEncomienda.destinatarioNombre} (${mockEncomienda.destinatarioTelefono})',
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
              Text('Entrega: ${mockEncomienda.direccionEntrega}',
                  style: const TextStyle(color: AppColors.textDim, fontSize: 12)),
              Text('Contenido: ${mockEncomienda.descripcionPaquete}',
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => EncomiendaTrackingScreen(encomienda: mockEncomienda),
                      ),
                    );
                  },
                  icon: const Icon(Icons.qr_code_2, color: AppColors.accentLight),
                  label: const Text('Ver Código QR de Entrega', style: TextStyle(color: AppColors.accentLight)),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppColors.accent),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
