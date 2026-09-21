import 'package:flutter/material.dart';
import 'package:macondo_core/constants/app_colors.dart';
import 'package:macondo_core/models/encomienda.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../widgets/app_header.dart';

class EncomiendaTrackingScreen extends StatelessWidget {
  final Encomienda encomienda;

  const EncomiendaTrackingScreen({
    super.key,
    required this.encomienda,
  });

  @override
  Widget build(BuildContext context) {
    final bool esEntregada = encomienda.estado == 'entregada';

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          MacondoHeader(
            title: 'Seguimiento & Código QR',
            subtitle: 'Guía: ${encomienda.id.substring(0, 8).toUpperCase()}',
            showBack: true,
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                // Tarjeta de Estado
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: esEntregada
                        ? AppColors.accent.withOpacity(0.15)
                        : AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: esEntregada ? AppColors.accent : AppColors.amber,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        esEntregada ? Icons.check_circle : Icons.local_shipping,
                        color: esEntregada ? AppColors.accent : AppColors.amber,
                        size: 32,
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              esEntregada ? '¡PAQUETE ENTREGADO!' : 'EN PROCESO DE ENTREGA',
                              style: TextStyle(
                                color: esEntregada ? AppColors.accentLight : AppColors.amber,
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 1.0,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              esEntregada
                                  ? 'La entrega fue confirmada mediante escaneo de Código QR.'
                                  : 'El chofer escaneará el código QR al momento de la entrega.',
                              style: const TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Tarjeta del Código QR de Seguridad
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    children: [
                      const Text(
                        'CÓDIGO QR DE ENTREGA',
                        style: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.1,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Muestre este código al conductor al recibir el paquete',
                        style: TextStyle(color: AppColors.textDim, fontSize: 11),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      
                      // Render del QR
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: QrImageView(
                          data: encomienda.codigoQrEntrega,
                          version: QrVersions.auto,
                          size: 190.0,
                          backgroundColor: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceElevated,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Text(
                          encomienda.codigoQrEntrega,
                          style: const TextStyle(
                            color: AppColors.accentLight,
                            fontSize: 12,
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Resumen de Remitente, Destinatario y Direcciones
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'DETALLES DE LA ENCOMIENDA',
                        style: TextStyle(
                          color: AppColors.accentLight,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.0,
                        ),
                      ),
                      const SizedBox(height: 12),
                      _buildDetailRow(
                        'Destinatario:',
                        '${encomienda.destinatarioNombre} (${encomienda.destinatarioTelefono})',
                        Icons.person,
                      ),
                      const SizedBox(height: 8),
                      _buildDetailRow(
                        'Punto de Recogida:',
                        encomienda.direccionRecogida,
                        Icons.upload,
                      ),
                      const SizedBox(height: 8),
                      _buildDetailRow(
                        'Punto de Entrega:',
                        encomienda.direccionEntrega,
                        Icons.download,
                      ),
                      if (encomienda.referenciaEntrega != null &&
                          encomienda.referenciaEntrega!.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        _buildDetailRow(
                          'Referencia:',
                          encomienda.referenciaEntrega!,
                          Icons.info_outline,
                        ),
                      ],
                      const SizedBox(height: 8),
                      _buildDetailRow(
                        'Contenido:',
                        encomienda.descripcionPaquete,
                        Icons.inventory_2_outlined,
                      ),
                      const SizedBox(height: 8),
                      _buildDetailRow(
                        'Pago en Efectivo:',
                        '\$${encomienda.precioEnvioEfectivo.toStringAsFixed(2)}',
                        Icons.payments_outlined,
                        valueColor: AppColors.amber,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, IconData icon, {Color? valueColor}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: AppColors.textSecondary, size: 16),
        const SizedBox(width: 8),
        Text(
          label,
          style: const TextStyle(color: AppColors.textDim, fontSize: 12),
        ),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            value,
            style: TextStyle(
              color: valueColor ?? AppColors.textPrimary,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }
}
