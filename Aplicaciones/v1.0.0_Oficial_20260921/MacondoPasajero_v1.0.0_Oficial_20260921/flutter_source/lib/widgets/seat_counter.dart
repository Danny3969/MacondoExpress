import 'package:flutter/material.dart';
import 'package:macondo_core/constants/app_colors.dart';

class SeatSelector extends StatelessWidget {
  final int selectedSeats;
  final int availableSeats; // Max 4
  final ValueChanged<int> onSeatsChanged;

  const SeatSelector({
    super.key,
    required this.selectedSeats,
    required this.availableSeats,
    required this.onSeatsChanged,
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
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'PUESTOS A RESERVAR',
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1.1,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '$selectedSeats ${selectedSeats == 1 ? "pasajero" : "pasajeros"} (Capacidad máx: 4)',
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: availableSeats > 0 
                      ? AppColors.accent.withOpacity(0.15)
                      : Colors.redAccent.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: availableSeats > 0 ? AppColors.accent : Colors.redAccent,
                  ),
                ),
                child: Text(
                  '$availableSeats disponibles',
                  style: TextStyle(
                    color: availableSeats > 0 ? AppColors.accentLight : Colors.redAccent,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // Representación visual de los 4 cupos del auto/camioneta
          Row(
            children: List.generate(4, (index) {
              final seatNumber = index + 1;
              final isOccupied = seatNumber > availableSeats;
              final isSelected = seatNumber <= selectedSeats && !isOccupied;

              Color bgColor;
              Color borderColor;
              Color iconColor;
              String label;

              if (isOccupied) {
                bgColor = AppColors.surfaceElevated;
                borderColor = AppColors.border;
                iconColor = AppColors.textDim;
                label = 'Ocupado';
              } else if (isSelected) {
                bgColor = AppColors.accent.withOpacity(0.2);
                borderColor = AppColors.accent;
                iconColor = AppColors.accentLight;
                label = 'Puesto $seatNumber';
              } else {
                bgColor = AppColors.surface;
                borderColor = AppColors.border;
                iconColor = AppColors.textSecondary;
                label = 'Puesto $seatNumber';
              }

              return Expanded(
                child: GestureDetector(
                  onTap: isOccupied
                      ? null
                      : () {
                          onSeatsChanged(seatNumber);
                        },
                  child: Container(
                    margin: EdgeInsets.only(right: index < 3 ? 8 : 0),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      color: bgColor,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: borderColor, width: isSelected ? 1.5 : 1),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          isOccupied
                              ? Icons.person_off_outlined
                              : (isSelected ? Icons.person : Icons.event_seat_outlined),
                          color: iconColor,
                          size: 24,
                        ),
                        const SizedBox(height: 6),
                        Text(
                          label,
                          style: TextStyle(
                            color: iconColor,
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),
          ),
          const SizedBox(height: 14),
          
          // Controles + y - para facilitar selección táctil rápida
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Seleccione cantidad:',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
              ),
              Row(
                children: [
                  IconButton(
                    onPressed: selectedSeats > 1
                        ? () => onSeatsChanged(selectedSeats - 1)
                        : null,
                    icon: const Icon(Icons.remove_circle_outline),
                    color: AppColors.amber,
                    disabledColor: AppColors.textDim,
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceElevated,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '$selectedSeats',
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: selectedSeats < availableSeats
                        ? () => onSeatsChanged(selectedSeats + 1)
                        : null,
                    icon: const Icon(Icons.add_circle_outline),
                    color: AppColors.accent,
                    disabledColor: AppColors.textDim,
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
