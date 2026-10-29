import 'package:flutter/material.dart';
import 'package:macondo_core/constants/app_colors.dart';
import 'package:macondo_core/models/turno_viaje.dart';

class TripCard extends StatelessWidget {
  final TurnoViaje turno;
  final VoidCallback onReservar;

  const TripCard({
    super.key,
    required this.turno,
    required this.onReservar,
  });

  @override
  Widget build(BuildContext context) {
    final disponibles = turno.cuposDisponibles;
    final tieneCupos = disponibles > 0;
    final tarifa = turno.ruta?.tarifaPasajeEfectivo ?? 0.0;
    final origen = turno.ruta?.origenCiudad ?? 'Origen';
    final destino = turno.ruta?.destinoCiudad ?? 'Destino';
    final tipoVehiculo = (turno.vehiculo?.tipo ?? 'auto').toUpperCase();

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: tieneCupos ? AppColors.border : Colors.redAccent.withOpacity(0.3),
        ),
      ),
      child: Column(
        children: [
          // Cabecera de la Tarjeta con Horario y Tipo de Unidad
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: AppColors.surfaceElevated,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.access_time_filled, color: AppColors.accent, size: 16),
                    const SizedBox(width: 6),
                    Text(
                      'Salida: ${turno.horaSalida.substring(0, 5)}',
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Text(
                        tipoVehiculo,
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                Text(
                  '\$${tarifa.toStringAsFixed(2)} / puesto',
                  style: const TextStyle(
                    color: AppColors.accentLight,
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
          
          // Cuerpo: Ruta y Chofer
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            origen,
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const Text(
                            'Puerta a Puerta',
                            style: TextStyle(color: AppColors.textDim, fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.arrow_forward, color: AppColors.accent, size: 20),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            destino,
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const Text(
                            'Destino Directo',
                            style: TextStyle(color: AppColors.textDim, fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                const Divider(color: AppColors.divider, height: 1),
                const SizedBox(height: 14),

                // Fila Inferior: Asientos Disponibles y Botón
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(
                              tieneCupos ? Icons.airline_seat_recline_normal : Icons.event_busy,
                              color: tieneCupos ? AppColors.accent : Colors.redAccent,
                              size: 18,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              tieneCupos
                                  ? '$disponibles de 4 puestos libres'
                                  : 'Viaje Completo',
                              style: TextStyle(
                                color: tieneCupos ? AppColors.textPrimary : Colors.redAccent,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        if (turno.chofer != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            'Chofer: ${turno.chofer!.nombreCompleto}',
                            style: const TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ],
                    ),
                    ElevatedButton(
                      onPressed: tieneCupos ? onReservar : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.accent,
                        foregroundColor: AppColors.primary,
                        disabledBackgroundColor: AppColors.surfaceElevated,
                        disabledForegroundColor: AppColors.textDim,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        elevation: 0,
                      ),
                      child: const Text(
                        'Reservar',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
