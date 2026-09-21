import 'turno_viaje.dart';
import 'usuario.dart';

class ReservaPasajero {
  final String id;
  final String turnoId;
  final String pasajeroId;
  final int cantidadPuestos;
  final double latitudRecogida;
  final double longitudRecogida;
  final String direccionRecogida;
  final String? referenciaRecogida;
  final String telefonoContacto;
  final double montoTotalEfectivo;
  final String codigoAbordajePin; // PIN de 4 dígitos
  final DateTime? horaRecogidaReal;
  final String estado; // 'confirmada', 'chofer_en_camino', 'a_bordo', 'completado', 'cancelado'
  final DateTime createdAt;

  final TurnoViaje? turno;
  final Usuario? pasajero;

  const ReservaPasajero({
    required this.id,
    required this.turnoId,
    required this.pasajeroId,
    required this.cantidadPuestos,
    required this.latitudRecogida,
    required this.longitudRecogida,
    required this.direccionRecogida,
    this.referenciaRecogida,
    required this.telefonoContacto,
    required this.montoTotalEfectivo,
    this.codigoAbordajePin = '0000',
    this.horaRecogidaReal,
    this.estado = 'confirmada',
    required this.createdAt,
    this.turno,
    this.pasajero,
  });

  bool get isConfirmada => estado == 'confirmada';
  bool get isEnCamino => estado == 'chofer_en_camino';
  bool get isABordo => estado == 'a_bordo';
  bool get isCompletado => estado == 'completado';
  bool get isCancelado => estado == 'cancelado';

  factory ReservaPasajero.fromJson(Map<String, dynamic> json) {
    return ReservaPasajero(
      id: json['id'] as String,
      turnoId: json['turno_id'] as String? ?? '',
      pasajeroId: json['pasajero_id'] as String? ?? '',
      cantidadPuestos: json['cantidad_puestos'] as int? ?? 1,
      latitudRecogida: (json['latitud_recogida'] as num?)?.toDouble() ?? 0.0,
      longitudRecogida: (json['longitud_recogida'] as num?)?.toDouble() ?? 0.0,
      direccionRecogida: json['direccion_recogida'] as String? ?? '',
      referenciaRecogida: json['referencia_recogida'] as String?,
      telefonoContacto: json['telefono_contacto'] as String? ?? '',
      montoTotalEfectivo: (json['monto_total_efectivo'] as num?)?.toDouble() ?? 0.0,
      codigoAbordajePin: json['codigo_abordaje_pin'] as String? ?? '0000',
      horaRecogidaReal: json['hora_recogida_real'] != null
          ? DateTime.parse(json['hora_recogida_real'] as String)
          : null,
      estado: json['estado'] as String? ?? 'confirmada',
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : DateTime.now(),
      turno: json['turnos_viajes'] != null 
          ? TurnoViaje.fromJson(json['turnos_viajes'] as Map<String, dynamic>) 
          : null,
      pasajero: json['usuarios'] != null 
          ? Usuario.fromJson(json['usuarios'] as Map<String, dynamic>) 
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'turno_id': turnoId,
      'pasajero_id': pasajeroId,
      'cantidad_puestos': cantidadPuestos,
      'latitud_recogida': latitudRecogida,
      'longitud_recogida': longitudRecogida,
      'direccion_recogida': direccionRecogida,
      'referencia_recogida': referenciaRecogida,
      'telefono_contacto': telefonoContacto,
      'monto_total_efectivo': montoTotalEfectivo,
      'codigo_abordaje_pin': codigoAbordajePin,
      'hora_recogida_real': horaRecogidaReal?.toIso8601String(),
      'estado': estado,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
