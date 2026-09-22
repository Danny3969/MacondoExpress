import 'ruta.dart';
import 'vehiculo.dart';
import 'usuario.dart';

class TurnoViaje {
  final String id;
  final String rutaId;
  final String? vehiculoId;
  final String? choferId;
  final DateTime fechaSalida;
  final String horaSalida; // ej. "08:30:00" o "08:30"
  final int cuposTotales;
  final int cuposOcupados;
  final String estado; // 'programado', 'recogiendo', 'en_camino', 'finalizado', 'cancelado'
  final double totalRecaudadoEfectivo;
  final DateTime createdAt;

  // Relaciones anidadas opcionales para UI
  final Ruta? ruta;
  final Vehiculo? vehiculo;
  final Usuario? chofer;

  const TurnoViaje({
    required this.id,
    required this.rutaId,
    this.vehiculoId,
    this.choferId,
    required this.fechaSalida,
    required this.horaSalida,
    this.cuposTotales = 4,
    this.cuposOcupados = 0,
    this.estado = 'programado',
    this.totalRecaudadoEfectivo = 0.0,
    required this.createdAt,
    this.ruta,
    this.vehiculo,
    this.chofer,
  });

  int get cuposDisponibles => (cuposTotales - cuposOcupados).clamp(0, cuposTotales);
  bool get tieneCupos => cuposDisponibles > 0;
  bool get estaLleno => cuposDisponibles == 0;

  bool get isProgramado => estado == 'programado';
  bool get isRecogiendo => estado == 'recogiendo';
  bool get isEnCamino => estado == 'en_camino';
  bool get isFinalizado => estado == 'finalizado';

  factory TurnoViaje.fromJson(Map<String, dynamic> json) {
    return TurnoViaje(
      id: json['id'] as String,
      rutaId: json['ruta_id'] as String? ?? '',
      vehiculoId: json['vehiculo_id'] as String?,
      choferId: json['chofer_id'] as String?,
      fechaSalida: json['fecha_salida'] != null
          ? DateTime.parse(json['fecha_salida'] as String)
          : DateTime.now(),
      horaSalida: json['hora_salida'] as String? ?? '00:00',
      cuposTotales: json['cupos_totales'] as int? ?? 4,
      cuposOcupados: json['cupos_ocupados'] as int? ?? 0,
      estado: json['estado'] as String? ?? 'programado',
      totalRecaudadoEfectivo: (json['total_recaudado_efectivo'] as num?)?.toDouble() ?? 0.0,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : DateTime.now(),
      ruta: json['rutas'] != null ? Ruta.fromJson(json['rutas'] as Map<String, dynamic>) : null,
      vehiculo: json['vehiculos'] != null ? Vehiculo.fromJson(json['vehiculos'] as Map<String, dynamic>) : null,
      chofer: json['usuarios'] != null ? Usuario.fromJson(json['usuarios'] as Map<String, dynamic>) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'ruta_id': rutaId,
      'vehiculo_id': vehiculoId,
      'chofer_id': choferId,
      'fecha_salida': fechaSalida.toIso8601String().split('T')[0],
      'hora_salida': horaSalida,
      'cupos_totales': cuposTotales,
      'cupos_ocupados': cuposOcupados,
      'estado': estado,
      'total_recaudado_efectivo': totalRecaudadoEfectivo,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
