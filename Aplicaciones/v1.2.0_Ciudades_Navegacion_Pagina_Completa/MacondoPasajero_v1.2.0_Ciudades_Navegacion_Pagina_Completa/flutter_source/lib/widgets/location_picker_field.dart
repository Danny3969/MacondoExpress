import 'package:flutter/material.dart';
import 'package:macondo_core/constants/app_colors.dart';

class LocationPickerField extends StatelessWidget {
  final TextEditingController direccionController;
  final TextEditingController referenciaController;
  final double? latitud;
  final double? longitud;
  final VoidCallback onObtenerGpsActual;

  const LocationPickerField({
    super.key,
    required this.direccionController,
    required this.referenciaController,
    this.latitud,
    this.longitud,
    required this.onObtenerGpsActual,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: AppColors.amber.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.location_on, color: AppColors.amber, size: 20),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'PUNTO DE RECOGIDA (PUERTA A PUERTA)',
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1.1,
                    ),
                  ),
                ],
              ),
              InkWell(
                onTap: onObtenerGpsActual,
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.accent.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.accent.withOpacity(0.4)),
                  ),
                  child: Row(
                    children: const [
                      Icon(Icons.my_location, color: AppColors.accentLight, size: 14),
                      SizedBox(width: 4),
                      Text(
                        'Mi GPS',
                        style: TextStyle(
                          color: AppColors.accentLight,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          
          // Campo Dirección Exacta
          TextField(
            controller: direccionController,
            style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
            decoration: InputDecoration(
              labelText: 'Dirección o Calle Exacta *',
              labelStyle: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
              hintText: 'Ej: Av. 9 de Octubre y Boyacá #412',
              hintStyle: const TextStyle(color: AppColors.textDim, fontSize: 13),
              filled: true,
              fillColor: AppColors.surfaceElevated,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: AppColors.border),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: AppColors.border),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.accent),
              ),
              prefixIcon: const Icon(Icons.home_work_outlined, color: AppColors.textSecondary, size: 20),
            ),
          ),
          const SizedBox(height: 10),

          // Campo Referencia
          TextField(
            controller: referenciaController,
            style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
            decoration: InputDecoration(
              labelText: 'Referencia para el Chofer (Opcional)',
              labelStyle: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
              hintText: 'Ej: Casa verde de 2 pisos, frente a la farmacia',
              hintStyle: const TextStyle(color: AppColors.textDim, fontSize: 13),
              filled: true,
              fillColor: AppColors.surfaceElevated,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: AppColors.border),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: AppColors.border),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.accent),
              ),
              prefixIcon: const Icon(Icons.pin_drop_outlined, color: AppColors.textSecondary, size: 20),
            ),
          ),
          const SizedBox(height: 10),

          // Coordenadas detectadas
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                const Icon(Icons.satellite_alt_outlined, color: AppColors.textDim, size: 16),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    latitud != null && longitud != null
                        ? 'GPS fijado: ${latitud!.toStringAsFixed(5)}, ${longitud!.toStringAsFixed(5)}'
                        : 'GPS no fijado (el chofer usará la dirección de texto)',
                    style: TextStyle(
                      color: latitud != null ? AppColors.accentLight : AppColors.textDim,
                      fontSize: 11,
                      fontFamily: 'monospace',
                    ),
                  ),
                ),
                if (latitud != null)
                  const Icon(Icons.check_circle, color: AppColors.accent, size: 16),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
