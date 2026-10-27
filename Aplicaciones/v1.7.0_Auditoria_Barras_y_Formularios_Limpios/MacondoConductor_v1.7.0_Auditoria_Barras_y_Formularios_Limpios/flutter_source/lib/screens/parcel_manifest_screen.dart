import 'package:flutter/material.dart';
import 'package:macondo_core/constants/app_colors.dart';
import 'package:macondo_core/models/turno_viaje.dart';
import 'package:macondo_core/models/encomienda.dart';
import 'package:url_launcher/url_launcher.dart';
import '../widgets/conductor_header.dart';
import 'qr_scanner_screen.dart';

class ParcelManifestScreen extends StatefulWidget {
  final TurnoViaje turno;

  const ParcelManifestScreen({
    super.key,
    required this.turno,
  });

  @override
  State<ParcelManifestScreen> createState() => _ParcelManifestScreenState();
}

class _ParcelManifestScreenState extends State<ParcelManifestScreen> {
  late List<Encomienda> _encomiendas;

  @override
  void initState() {
    super.initState();
    _encomiendas = [
      Encomienda(
        id: 'enc-01',
        turnoId: widget.turno.id,
        remitenteId: 'rem-01',
        remitenteNombre: 'Carlos Mendoza',
        remitenteTelefono: '0987654321',
        destinatarioNombre: 'Luisa Mora',
        destinatarioTelefono: '0981122334',
        latitudRecogida: -2.1894,
        longitudRecogida: -79.8891,
        direccionRecogida: 'Urdesa Central, Calle 3ra #401',
        latitudEntrega: -3.2581,
        longitudEntrega: -79.9554,
        direccionEntrega: 'Av. 25 de Junio y Junín',
        referenciaEntrega: 'Frente al parque central de Machala',
        descripcionPaquete: 'Sobre manila con documentos y llaves',
        precioEnvioEfectivo: 5.00,
        codigoQrEntrega: 'MCND-QR-7FA89B1C',
        estado: 'en_camino',
        createdAt: DateTime.now(),
      ),
      Encomienda(
        id: 'enc-02',
        turnoId: widget.turno.id,
        remitenteId: 'rem-02',
        remitenteNombre: 'Jorge Benítez',
        remitenteTelefono: '0993322110',
        destinatarioNombre: 'Manuel Aguirre',
        destinatarioTelefono: '0977665544',
        latitudRecogida: -2.1481,
        longitudRecogida: -79.9011,
        direccionRecogida: 'Sauces 4 Mz 403',
        latitudEntrega: -3.2610,
        longitudEntrega: -79.9600,
        direccionEntrega: 'Barrio Lindo calle 5ta',
        descripcionPaquete: 'Caja mediana de repuestos automotrices',
        precioEnvioEfectivo: 7.00,
        codigoQrEntrega: 'MCND-QR-99A12D4F',
        estado: 'entregada',
        entregadoAt: DateTime.now(),
        createdAt: DateTime.now().subtract(const Duration(hours: 3)),
      ),
    ];
  }

  void _abrirNavegacionGps(double lat, double lng) async {
    final googleMapsUrl = Uri.parse('https://www.google.com/maps/dir/?api=1&destination=$lat,$lng');
    if (await canLaunchUrl(googleMapsUrl)) {
      await launchUrl(googleMapsUrl, mode: LaunchMode.externalApplication);
    }
  }

  void _llamar(String telefono) async {
    final telUri = Uri.parse('tel:$telefono');
    if (await canLaunchUrl(telUri)) {
      await launchUrl(telUri);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          ConductorHeader(
            title: 'Encomiendas Asignadas',
            subtitle: 'Turno: ${widget.turno.ruta?.origenCiudad} ➔ ${widget.turno.ruta?.destinoCiudad}',
            showBack: true,
            trailing: IconButton(
              icon: const Icon(Icons.qr_code_scanner, color: AppColors.accentLight),
              tooltip: 'Escanear QR de Entrega',
              onPressed: () async {
                final res = await Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => QRScannerScreen(choferActual: widget.turno.chofer!),
                  ),
                );
                if (res == true) {
                  setState(() {
                    _encomiendas[0] = _encomiendas[0].copyWith(
                      estado: 'entregada',
                      entregadoAt: DateTime.now(),
                    );
                  });
                }
              },
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _encomiendas.length,
              itemBuilder: (ctx, index) {
                final enc = _encomiendas[index];
                final esEntregada = enc.estado == 'entregada';

                return Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: esEntregada ? AppColors.accent : AppColors.border,
                      width: esEntregada ? 1.5 : 1,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Cabecera: Guía & Badge de Estado
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Icon(
                                esEntregada ? Icons.check_circle : Icons.inventory_2,
                                color: esEntregada ? AppColors.accent : AppColors.amber,
                                size: 22,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Guía: ${enc.id.toUpperCase()}',
                                style: const TextStyle(
                                  color: AppColors.textPrimary,
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: esEntregada
                                  ? AppColors.accent.withOpacity(0.15)
                                  : AppColors.amber.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              enc.estado.toUpperCase(),
                              style: TextStyle(
                                color: esEntregada ? AppColors.accentLight : AppColors.amber,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'Contenido: ${enc.descripcionPaquete}',
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 10),
                      const Divider(color: AppColors.divider, height: 1),
                      const SizedBox(height: 10),

                      // Remitente y Destinatario
                      Text(
                        'Remitente: ${enc.remitenteNombre} (${enc.remitenteTelefono})',
                        style: const TextStyle(color: AppColors.textSecondary, fontSize: 11),
                      ),
                      Text(
                        'Destinatario: ${enc.destinatarioNombre} (${enc.destinatarioTelefono})',
                        style: const TextStyle(color: AppColors.textPrimary, fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 8),

                      // Punto de Entrega
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(Icons.location_on, color: AppColors.amber, size: 16),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              'Entrega: ${enc.direccionEntrega} ${enc.referenciaEntrega != null ? "(${enc.referenciaEntrega})" : ""}',
                              style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),

                      // Cobro Efectivo
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceElevated,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Cobro en Efectivo:', style: TextStyle(color: AppColors.textDim, fontSize: 11)),
                            Text(
                              '\$${enc.precioEnvioEfectivo.toStringAsFixed(2)} Efectivo',
                              style: const TextStyle(color: AppColors.amber, fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Botones: Navegar y Escanear QR
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () => _abrirNavegacionGps(enc.latitudEntrega, enc.longitudEntrega),
                              icon: const Icon(Icons.navigation_outlined, size: 16, color: AppColors.accentLight),
                              label: const Text('Ruta GPS', style: TextStyle(color: AppColors.accentLight, fontSize: 12)),
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(color: AppColors.accent),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          IconButton(
                            onPressed: () => _llamar(enc.destinatarioTelefono),
                            icon: const Icon(Icons.phone, color: AppColors.accentLight, size: 18),
                            style: IconButton.styleFrom(
                              backgroundColor: AppColors.surfaceElevated,
                              side: BorderSide(color: AppColors.border),
                            ),
                          ),
                          const SizedBox(width: 8),
                          if (!esEntregada)
                            ElevatedButton.icon(
                              onPressed: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (_) => QRScannerScreen(choferActual: widget.turno.chofer!),
                                  ),
                                );
                              },
                              icon: const Icon(Icons.qr_code_scanner, size: 16),
                              label: const Text('Escanear QR', style: TextStyle(fontSize: 12)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.accent,
                                foregroundColor: AppColors.primary,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
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
