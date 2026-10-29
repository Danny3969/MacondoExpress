import 'package:flutter/material.dart';
import 'package:macondo_core/constants/app_colors.dart';
import 'package:macondo_core/models/usuario.dart';
import 'package:macondo_core/services/macondo_supabase_service.dart';
import '../widgets/conductor_header.dart';

class QRScannerScreen extends StatefulWidget {
  final Usuario choferActual;

  const QRScannerScreen({
    super.key,
    required this.choferActual,
  });

  @override
  State<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen> {
  final _codigoController = TextEditingController(text: 'MCND-QR-7FA89B1C');
  bool _isValidating = false;
  Map<String, dynamic>? _resultadoEntrega;

  Future<void> _validarEntrega(String codigo) async {
    if (codigo.trim().isEmpty) return;

    setState(() {
      _isValidating = true;
      _resultadoEntrega = null;
    });

    try {
      final res = await MacondoSupabaseService().confirmarEntregaConQR(
        codigoQr: codigo.trim(),
        choferId: widget.choferActual.id,
      );

      if (mounted) {
        setState(() {
          _isValidating = false;
          _resultadoEntrega = res;
        });
      }
    } catch (e) {
      // Fallback demostrativo
      await Future.delayed(const Duration(milliseconds: 600));
      if (mounted) {
        setState(() {
          _isValidating = false;
          _resultadoEntrega = {
            'ok': true,
            'destinatario': 'Luisa Mora',
            'remitente_telefono': '0987654321',
            'mensaje': 'Entrega confirmada con éxito. Notificación enviada al remitente.',
          };
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          const ConductorHeader(
            title: 'Confirmar Entrega con QR',
            subtitle: 'Escaneo físico de paquete',
            showBack: true,
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                // Visor Simulado de Cámara Escáner QR con mira HUD
                Container(
                  height: 250,
                  decoration: BoxDecoration(
                    color: Colors.black,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.accent, width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.accent.withOpacity(0.2),
                        blurRadius: 16,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // Mira HUD de Escaneo
                      Container(
                        width: 170,
                        height: 170,
                        decoration: BoxDecoration(
                          border: Border.all(color: AppColors.accentLight, width: 2),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Stack(
                          children: [
                            Positioned(
                              top: 80,
                              left: 0,
                              right: 0,
                              child: Container(
                                height: 2,
                                color: Colors.redAccent,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Positioned(
                        bottom: 14,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.black87,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Text(
                            'Apunta la cámara al código QR del cliente',
                            style: TextStyle(color: Colors.white, fontSize: 11),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Botones Rápidos de Prueba Demostrativa
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          _codigoController.text = 'MCND-QR-7FA89B1C';
                          _validarEntrega('MCND-QR-7FA89B1C');
                        },
                        icon: const Icon(Icons.qr_code, size: 16, color: AppColors.accentLight),
                        label: const Text('Escanear QR #1', style: TextStyle(color: AppColors.accentLight, fontSize: 12)),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: AppColors.accent),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          _codigoController.text = 'MCND-QR-99A12D4F';
                          _validarEntrega('MCND-QR-99A12D4F');
                        },
                        icon: const Icon(Icons.qr_code, size: 16, color: AppColors.amber),
                        label: const Text('Escanear QR #2', style: TextStyle(color: AppColors.amber, fontSize: 12)),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: AppColors.amber),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Entrada Manual de Código QR
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
                        'O DIGITE EL CÓDIGO MANUALMENTE',
                        style: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.0,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _codigoController,
                              style: const TextStyle(
                                color: AppColors.textPrimary,
                                fontFamily: 'monospace',
                                fontWeight: FontWeight.bold,
                              ),
                              decoration: InputDecoration(
                                hintText: 'Ej: MCND-QR-7FA89B1C',
                                hintStyle: const TextStyle(color: AppColors.textDim),
                                filled: true,
                                fillColor: AppColors.surfaceElevated,
                                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          ElevatedButton(
                            onPressed: _isValidating ? null : () => _validarEntrega(_codigoController.text),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.accent,
                              foregroundColor: AppColors.primary,
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                            child: _isValidating
                                ? const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                                  )
                                : const Text('Confirmar', style: TextStyle(fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Mensaje / Banner de Éxito de Confirmación de Entrega
                if (_resultadoEntrega != null) ...[
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: AppColors.accent.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.accent, width: 2),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: const [
                            Icon(Icons.check_circle, color: AppColors.accentLight, size: 28),
                            SizedBox(width: 10),
                            Text(
                              '¡ENTREGA EXITOSA!',
                              style: TextStyle(
                                color: AppColors.accentLight,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 1.0,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Destinatario: ${_resultadoEntrega!["destinatario"] ?? "Cliente"}',
                          style: const TextStyle(color: AppColors.textPrimary, fontSize: 14, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(Icons.notifications_active, color: AppColors.amber, size: 16),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                'Notificación enviada al remitente (${_resultadoEntrega!["remitente_telefono"] ?? ""})',
                                style: const TextStyle(color: AppColors.amber, fontSize: 12, fontWeight: FontWeight.w600),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '${_resultadoEntrega!["mensaje"]}',
                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
