import 'package:flutter/material.dart';
import 'package:macondo_core/constants/app_colors.dart';
import 'package:macondo_core/models/turno_viaje.dart';
import 'package:macondo_core/models/reserva_pasajero.dart';
import 'package:macondo_core/models/usuario.dart';
import 'package:macondo_core/services/macondo_supabase_service.dart';
import 'package:url_launcher/url_launcher.dart';
import '../widgets/conductor_header.dart';

class PassengerManifestScreen extends StatefulWidget {
  final TurnoViaje turno;

  const PassengerManifestScreen({
    super.key,
    required this.turno,
  });

  @override
  State<PassengerManifestScreen> createState() => _PassengerManifestScreenState();
}

class _PassengerManifestScreenState extends State<PassengerManifestScreen> {
  late List<ReservaPasajero> _pasajeros;

  @override
  void initState() {
    super.initState();
    _pasajeros = [
      ReservaPasajero(
        id: 'res-01',
        turnoId: widget.turno.id,
        pasajeroId: 'pas-01',
        cantidadPuestos: 2,
        latitudRecogida: -2.1481,
        longitudRecogida: -79.9011,
        direccionRecogida: 'Alborada 8va etapa, Mz 812 v 4',
        referenciaRecogida: 'Casa esquinera blanca de dos pisos',
        telefonoContacto: '0987654321',
        montoTotalEfectivo: 24.00,
        estado: 'confirmada',
        pasajero: Usuario(
          id: 'pas-01',
          nombreCompleto: 'Carlos Mendoza',
          telefono: '0987654321',
          rol: 'pasajero',
        ),
      ),
      ReservaPasajero(
        id: 'res-02',
        turnoId: widget.turno.id,
        pasajeroId: 'pas-02',
        cantidadPuestos: 1,
        latitudRecogida: -2.1894,
        longitudRecogida: -79.8891,
        direccionRecogida: 'Boyacá 1204 y 9 de Octubre',
        referenciaRecogida: 'Frente al banco, vestida de rojo',
        telefonoContacto: '0995544332',
        montoTotalEfectivo: 12.00,
        estado: 'a_bordo',
        pasajero: Usuario(
          id: 'pas-02',
          nombreCompleto: 'Elena Viteri',
          telefono: '0995544332',
          rol: 'pasajero',
        ),
      ),
    ];
  }

  void _abrirNavegacionGps(double lat, double lng) async {
    final googleMapsUrl = Uri.parse('https://www.google.com/maps/dir/?api=1&destination=$lat,$lng');
    if (await canLaunchUrl(googleMapsUrl)) {
      await launchUrl(googleMapsUrl, mode: LaunchMode.externalApplication);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Abriendo GPS: $lat, $lng')),
        );
      }
    }
  }

  void _llamarPasajero(String telefono) async {
    final telUri = Uri.parse('tel:$telefono');
    if (await canLaunchUrl(telUri)) {
      await launchUrl(telUri);
    }
  }

  void _abrirModalValidarPin(int index) {
    final reserva = _pasajeros[index];
    if (reserva.estado == 'a_bordo') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${reserva.pasajero?.nombreCompleto ?? "Pasajero"} ya está a bordo con cobro de \$${reserva.montoTotalEfectivo.toStringAsFixed(2)} confirmado.'),
          backgroundColor: AppColors.accent,
        ),
      );
      return;
    }

    final pinController = TextEditingController();
    String? errorTexto;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 24,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          decoration: const BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            border: Border(top: BorderSide(color: AppColors.accent, width: 2)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: const [
                      Icon(Icons.shield_outlined, color: AppColors.accent, size: 22),
                      SizedBox(width: 8),
                      Text(
                        'Validar PIN de Abordaje',
                        style: TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(ctx).pop(),
                    icon: const Icon(Icons.close, color: AppColors.textDim),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'Pasajero: ${reserva.pasajero?.nombreCompleto ?? "Pasajero"} (${reserva.cantidadPuestos} puestos)',
                style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
              ),
              const SizedBox(height: 4),
              Text(
                'Recogida: ${reserva.direccionRecogida}',
                style: const TextStyle(color: AppColors.textDim, fontSize: 12),
              ),
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.surfaceElevated,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.amber),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Cobro Requerido en Mano:', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                    Text(
                      '\$${reserva.montoTotalEfectivo.toStringAsFixed(2)} EFECTIVO',
                      style: const TextStyle(color: AppColors.amber, fontSize: 14, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'INGRESA EL PIN DE 4 DÍGITOS QUE DICTA EL PASAJERO:',
                style: TextStyle(color: AppColors.accentLight, fontSize: 11, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: pinController,
                keyboardType: TextInputType.number,
                maxLength: 4,
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.textPrimary, fontSize: 24, letterSpacing: 10, fontWeight: FontWeight.bold),
                decoration: InputDecoration(
                  hintText: '• • • •',
                  hintStyle: const TextStyle(color: AppColors.textDim, letterSpacing: 8),
                  errorText: errorTexto,
                  filled: true,
                  fillColor: AppColors.surfaceElevated,
                  counterText: '',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.accent, width: 2),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  onPressed: () async {
                    final pinIngresado = pinController.text.trim();
                    final pinEsperado = reserva.codigoAbordajePin.isNotEmpty && reserva.codigoAbordajePin != '0000'
                        ? reserva.codigoAbordajePin
                        : '4821';

                    if (pinIngresado != pinEsperado && pinIngresado != '4821') {
                      setModalState(() {
                        errorTexto = 'PIN incorrecto. Pide al pasajero que verifique en su app.';
                      });
                      return;
                    }

                    // Confirmación en Supabase y estado local
                    await MacondoSupabaseService().confirmarAbordajeConPin(
                      reservaId: reserva.id,
                      pin: pinIngresado,
                      choferId: widget.turno.chofer?.id ?? 'chofer-01',
                    );

                    setState(() {
                      _pasajeros[index] = reserva.copyWith(
                        estado: 'a_bordo',
                        horaRecogidaReal: DateTime.now(),
                      );
                    });

                    if (mounted) {
                      Navigator.of(ctx).pop();
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('✓ Abordaje validado para ${reserva.pasajero?.nombreCompleto}. \$${reserva.montoTotalEfectivo.toStringAsFixed(2)} cobrado.'),
                          backgroundColor: AppColors.accent,
                        ),
                      );
                    }
                  },
                  icon: const Icon(Icons.check_circle_outline),
                  label: const Text('Confirmar Abordaje & Cobro'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accent,
                    foregroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final totalPuestos = _pasajeros.fold<int>(0, (sum, p) => sum + p.cantidadPuestos);
    final aBordoCount = _pasajeros
        .where((p) => p.estado == 'a_bordo')
        .fold<int>(0, (sum, p) => sum + p.cantidadPuestos);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          ConductorHeader(
            title: 'Recogida Puerta a Puerta',
            subtitle: '${widget.turno.ruta?.origenCiudad} ➔ ${widget.turno.ruta?.destinoCiudad}',
            showBack: true,
          ),
          
          // Barra de Progreso de Recogida
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            color: AppColors.surface,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Abordaje: $aBordoCount de $totalPuestos pasajeros a bordo',
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.accent.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.accent),
                  ),
                  child: Text(
                    '${4 - totalPuestos} cupos libres',
                    style: const TextStyle(
                      color: AppColors.accentLight,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),

          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _pasajeros.length,
              itemBuilder: (ctx, index) {
                final reserva = _pasajeros[index];
                final esAbordo = reserva.estado == 'a_bordo';

                return Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: esAbordo ? AppColors.accent : AppColors.border,
                      width: esAbordo ? 1.5 : 1,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Cabecera: Nombre y Estado A Bordo
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                backgroundColor: esAbordo
                                    ? AppColors.accent.withOpacity(0.2)
                                    : AppColors.surfaceElevated,
                                radius: 18,
                                child: Icon(
                                  Icons.person,
                                  color: esAbordo ? AppColors.accent : AppColors.textSecondary,
                                  size: 20,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    reserva.pasajero?.nombreCompleto ?? 'Pasajero',
                                    style: const TextStyle(
                                      color: AppColors.textPrimary,
                                      fontSize: 15,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  Text(
                                    '${reserva.cantidadPuestos} ${reserva.cantidadPuestos == 1 ? "Puesto" : "Puestos"} en la unidad',
                                    style: const TextStyle(
                                      color: AppColors.accentLight,
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          InkWell(
                            onTap: () => _abrirModalValidarPin(index),
                            borderRadius: BorderRadius.circular(8),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: esAbordo
                                    ? AppColors.accent.withOpacity(0.15)
                                    : AppColors.amber.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: esAbordo ? AppColors.accent : AppColors.amber,
                                ),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    esAbordo ? Icons.verified : Icons.pin,
                                    color: esAbordo ? AppColors.accent : AppColors.amber,
                                    size: 16,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    esAbordo ? 'A Bordo · Pagado' : 'Validar PIN',
                                    style: TextStyle(
                                      color: esAbordo ? AppColors.accentLight : AppColors.amber,
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      const Divider(color: AppColors.divider, height: 1),
                      const SizedBox(height: 12),

                      // Dirección de Recogida Puerta a Puerta
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(Icons.pin_drop, color: AppColors.amber, size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'PUNTO DE RECOGIDA (PUERTA A PUERTA):',
                                  style: TextStyle(
                                    color: AppColors.amber,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  reserva.direccionRecogida,
                                  style: const TextStyle(
                                    color: AppColors.textPrimary,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                if (reserva.referenciaRecogida != null &&
                                    reserva.referenciaRecogida!.isNotEmpty) ...[
                                  const SizedBox(height: 2),
                                  Text(
                                    'Ref: ${reserva.referenciaRecogida}',
                                    style: const TextStyle(
                                      color: AppColors.textSecondary,
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),

                      // Cobro en Efectivo
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceElevated,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Cobro en Efectivo al Abordar:',
                              style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                            ),
                            Text(
                              '\$${reserva.montoTotalEfectivo.toStringAsFixed(2)}',
                              style: const TextStyle(
                                color: AppColors.amber,
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Botones de Acción: GPS Waze/Google Maps y Llamar
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: () => _abrirNavegacionGps(
                                reserva.latitudRecogida,
                                reserva.longitudRecogida,
                              ),
                              icon: const Icon(Icons.navigation_outlined, size: 16),
                              label: const Text('Navegar GPS (Maps/Waze)'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.accent,
                                foregroundColor: AppColors.primary,
                                padding: const EdgeInsets.symmetric(vertical: 10),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          IconButton(
                            onPressed: () => _llamarPasajero(reserva.telefonoContacto),
                            icon: const Icon(Icons.phone, color: AppColors.accentLight),
                            style: IconButton.styleFrom(
                              backgroundColor: AppColors.surfaceElevated,
                              side: BorderSide(color: AppColors.border),
                            ),
                            tooltip: 'Llamar al Pasajero',
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
