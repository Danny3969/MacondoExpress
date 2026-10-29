import 'package:flutter/material.dart';
import 'package:macondo_core/constants/app_colors.dart';

import 'package:macondo_core/services/macondo_offline_queue_service.dart';

class ConductorHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final String? rolTag;
  final Widget? trailing;
  final bool showBack;
  final bool showSos;

  const ConductorHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.rolTag,
    this.trailing,
    this.showBack = false,
    this.showSos = true,
  });

  void _activarSosEmergencia(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: Colors.redAccent, width: 2)),
        title: Row(
          children: const [
            Icon(Icons.warning_amber_rounded, color: Colors.redAccent, size: 28),
            SizedBox(width: 8),
            Text('ALERTA SOS CHOFER', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
          ],
        ),
        content: const Text(
          '¿Deseas emitir una alerta de emergencia a la Central de Despacho de la Cooperativa?\n\nSe enviará tu posición GPS actual y los datos de la unidad de forma prioritaria.',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancelar', style: TextStyle(color: AppColors.textDim)),
          ),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.of(ctx).pop();
              MacondoOfflineQueueService().encolarAccion(
                tipo: TipoAccionOffline.alertaSosEmergencia,
                datos: {
                  'rol': 'chofer',
                  'mensaje': 'Pánico activado desde unidad en ruta',
                  'latitud': -2.1894,
                  'longitud': -79.8891,
                },
              );
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('🚨 ¡ALERTA SOS TRANSMITIDA A LA CENTRAL DE DESPACHO!'),
                  backgroundColor: Colors.redAccent,
                  duration: Duration(seconds: 4),
                ),
              );
            },
            icon: const Icon(Icons.emergency, color: Colors.white, size: 18),
            label: const Text('EMITIR ALERTA', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border(bottom: BorderSide(color: AppColors.border, width: 1)),
      ),
      child: SafeArea(
        bottom: false,
        child: Row(
          children: [
            if (showBack) ...[
              IconButton(
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(Icons.arrow_back_ios_new, color: AppColors.textPrimary, size: 20),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
              const SizedBox(width: 14),
            ],
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: AppColors.amber.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Icon(Icons.drive_eta, color: AppColors.amber, size: 18),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'MACONDO CONDUCTOR & DESPACHO',
                        style: TextStyle(
                          color: AppColors.amber,
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.1,
                        ),
                      ),
                      if (rolTag != null) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.accent.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            rolTag!.toUpperCase(),
                            style: const TextStyle(
                              color: AppColors.accentLight,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    title,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      subtitle!,
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            if (showSos) ...[
              IconButton(
                onPressed: () => _activarSosEmergencia(context),
                tooltip: 'Alerta SOS Emergencia',
                icon: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.redAccent.withOpacity(0.18),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.redAccent, width: 1.2),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: const [
                      Icon(Icons.emergency, color: Colors.redAccent, size: 14),
                      SizedBox(width: 4),
                      Text('SOS', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold, fontSize: 10)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 6),
            ],
            if (trailing != null) trailing!,
          ],
        ),
      ),
    );
  }
}
