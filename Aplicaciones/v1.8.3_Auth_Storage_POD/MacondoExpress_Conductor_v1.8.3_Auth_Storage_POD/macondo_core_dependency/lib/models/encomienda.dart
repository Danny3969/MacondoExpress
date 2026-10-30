import 'usuario.dart';
import 'turno_viaje.dart';

class Encomienda {
  final String id;
  final String? turnoId;
  final String remitenteId;
  final String remitenteNombre;
  final String remitenteTelefono;
  final String destinatarioNombre;
  final String destinatarioTelefono;
  final double latitudRecogida;
  final double longitudRecogida;
  final String direccionRecogida;
  final double latitudEntrega;
  final double longitudEntrega;
  final String direccionEntrega;
  final String? referenciaEntrega;
  final String descripcionPaquete;
  final double precioEnvioEfectivo;
  final String codigoQrEntrega;
  final String estado; // 'solicitada', 'asignada_a_turno', 'recogida', 'en_camino', 'entregada', 'cancelada'
  final DateTime? entregadoAt;
  final DateTime createdAt;

  final TurnoViaje? turno;
  final Usuario? remitente;

  const Encomienda({
    required this.id,
    this.turnoId,
    required this.remitenteId,
    required this.remitenteNombre,
    required this.remitenteTelefono,
    required this.destinatarioNombre,
    required this.destinatarioTelefono,
    required this.latitudRecogida,
    required this.longitudRecogida,
    required this.direccionRecogida,
    required this.latitudEntrega,
    required this.longitudEntrega,
    required this.direccionEntrega,
    this.referenciaEntrega,
    required this.descripcionPaquete,
    this.precioEnvioEfectivo = 5.0,
    required this.codigoQrEntrega,
    this.estado = 'solicitada',
    this.entregadoAt,
    required this.createdAt,
    this.turno,
    this.remitente,
  });

  bool get isSolicitada => estado == 'solicitada';
  bool get isAsignada => estado == 'asignada_a_turno';
  bool get isRecogida => estado == 'recogida';
  bool get isEnCamino => estado == 'en_camino';
  bool get isEntregada => estado == 'entregada';
  bool get isCancelada => estado == 'cancelada';

  factory Encomienda.fromJson(Map<String, dynamic> json) {
    return Encomienda(
      id: json['id'] as String,
      turnoId: json['turno_id'] as String?,
      remitenteId: json['remitente_id'] as String? ?? '',
      remitenteNombre: json['remitente_nombre'] as String? ?? '',
      remitenteTelefono: json['remitente_telefono'] as String? ?? '',
      destinatarioNombre: json['destinatario_nombre'] as String? ?? '',
      destinatarioTelefono: json['destinatario_telefono'] as String? ?? '',
      latitudRecogida: (json['latitud_recogida'] as num?)?.toDouble() ?? 0.0,
      longitudRecogida: (json['longitud_recogida'] as num?)?.toDouble() ?? 0.0,
      direccionRecogida: json['direccion_recogida'] as String? ?? '',
      latitudEntrega: (json['latitud_entrega'] as num?)?.toDouble() ?? 0.0,
      longitudEntrega: (json['longitud_entrega'] as num?)?.toDouble() ?? 0.0,
      direccionEntrega: json['direccion_entrega'] as String? ?? '',
      referenciaEntrega: json['referencia_entrega'] as String?,
      descripcionPaquete: json['descripcion_paquete'] as String? ?? '',
      precioEnvioEfectivo: (json['precio_envio_efectivo'] as num?)?.toDouble() ?? 5.0,
      codigoQrEntrega: json['codigo_qr_entrega'] as String? ?? '',
      estado: json['estado'] as String? ?? 'solicitada',
      entregadoAt: json['entregado_at'] != null 
          ? DateTime.parse(json['entregado_at'] as String)
          : null,
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at'] as String)
          : DateTime.now(),
      turno: json['turnos_viajes'] != null 
          ? TurnoViaje.fromJson(json['turnos_viajes'] as Map<String, dynamic>) 
          : null,
      remitente: json['usuarios'] != null 
          ? Usuario.fromJson(json['usuarios'] as Map<String, dynamic>) 
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'turno_id': turnoId,
      'remitente_id': remitenteId,
      'remitente_nombre': remitenteNombre,
      'remitente_telefono': remitenteTelefono,
      'destinatario_nombre': destinatarioNombre,
      'destinatario_telefono': destinatarioTelefono,
      'latitud_recogida': latitudRecogida,
      'longitud_recogida': longitudRecogida,
      'direccion_recogida': direccionRecogida,
      'latitud_entrega': latitudEntrega,
      'longitud_entrega': longitudEntrega,
      'direccion_entrega': direccionEntrega,
      'referencia_entrega': referenciaEntrega,
      'descripcion_paquete': descripcionPaquete,
      'precio_envio_efectivo': precioEnvioEfectivo,
      'codigo_qr_entrega': codigoQrEntrega,
      'estado': estado,
      'entregado_at': entregadoAt?.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
    };
  }
}
