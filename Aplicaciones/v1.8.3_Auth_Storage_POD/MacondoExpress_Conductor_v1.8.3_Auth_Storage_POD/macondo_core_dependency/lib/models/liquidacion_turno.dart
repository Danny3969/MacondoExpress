class LiquidacionTurno {
  final String id;
  final String turnoId;
  final String choferId;
  final double totalPasajesEfectivo;
  final double totalEncomiendasEfectivo;
  final double totalRecaudadoEfectivo;
  final double cuotaCooperativa;
  final double gastosPeaje;
  final double gastosCombustible;
  final double gananciaNetaChofer;
  final String estado; // 'pendiente', 'liquidado', 'auditado'
  final String? observaciones;
  final DateTime liquidadoAt;

  LiquidacionTurno({
    required this.id,
    required this.turnoId,
    required this.choferId,
    required this.totalPasajesEfectivo,
    required this.totalEncomiendasEfectivo,
    required this.totalRecaudadoEfectivo,
    this.cuotaCooperativa = 6.00,
    this.gastosPeaje = 0.00,
    this.gastosCombustible = 0.00,
    required this.gananciaNetaChofer,
    this.estado = 'liquidado',
    this.observaciones,
    required this.liquidadoAt,
  });

  factory LiquidacionTurno.fromJson(Map<String, dynamic> json) {
    return LiquidacionTurno(
      id: json['id'] as String? ?? '',
      turnoId: json['turno_id'] as String? ?? '',
      choferId: json['chofer_id'] as String? ?? '',
      totalPasajesEfectivo: (json['total_pasajes_efectivo'] as num?)?.toDouble() ?? 0.0,
      totalEncomiendasEfectivo: (json['total_encomiendas_efectivo'] as num?)?.toDouble() ?? 0.0,
      totalRecaudadoEfectivo: (json['total_recaudado_efectivo'] as num?)?.toDouble() ?? 0.0,
      cuotaCooperativa: (json['cuota_cooperativa'] as num?)?.toDouble() ?? 6.00,
      gastosPeaje: (json['gastos_peaje'] as num?)?.toDouble() ?? 0.0,
      gastosCombustible: (json['gastos_combustible'] as num?)?.toDouble() ?? 0.0,
      gananciaNetaChofer: (json['ganancia_neta_chofer'] as num?)?.toDouble() ?? 0.0,
      estado: json['estado'] as String? ?? 'liquidado',
      observaciones: json['observaciones'] as String?,
      liquidadoAt: json['liquidado_at'] != null
          ? DateTime.parse(json['liquidado_at'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'turno_id': turnoId,
      'chofer_id': choferId,
      'total_pasajes_efectivo': totalPasajesEfectivo,
      'total_encomiendas_efectivo': totalEncomiendasEfectivo,
      'total_recaudado_efectivo': totalRecaudadoEfectivo,
      'cuota_cooperativa': cuotaCooperativa,
      'gastos_peaje': gastosPeaje,
      'gastos_combustible': gastosCombustible,
      'ganancia_neta_chofer': gananciaNetaChofer,
      'estado': estado,
      'observaciones': observaciones,
      'liquidado_at': liquidadoAt.toIso8601String(),
    };
  }

  LiquidacionTurno copyWith({
    String? id,
    String? turnoId,
    String? choferId,
    double? totalPasajesEfectivo,
    double? totalEncomiendasEfectivo,
    double? totalRecaudadoEfectivo,
    double? cuotaCooperativa,
    double? gastosPeaje,
    double? gastosCombustible,
    double? gananciaNetaChofer,
    String? estado,
    String? observaciones,
    DateTime? liquidadoAt,
  }) {
    return LiquidacionTurno(
      id: id ?? this.id,
      turnoId: turnoId ?? this.turnoId,
      choferId: choferId ?? this.choferId,
      totalPasajesEfectivo: totalPasajesEfectivo ?? this.totalPasajesEfectivo,
      totalEncomiendasEfectivo: totalEncomiendasEfectivo ?? this.totalEncomiendasEfectivo,
      totalRecaudadoEfectivo: totalRecaudadoEfectivo ?? this.totalRecaudadoEfectivo,
      cuotaCooperativa: cuotaCooperativa ?? this.cuotaCooperativa,
      gastosPeaje: gastosPeaje ?? this.gastosPeaje,
      gastosCombustible: gastosCombustible ?? this.gastosCombustible,
      gananciaNetaChofer: gananciaNetaChofer ?? this.gananciaNetaChofer,
      estado: estado ?? this.estado,
      observaciones: observaciones ?? this.observaciones,
      liquidadoAt: liquidadoAt ?? this.liquidadoAt,
    );
  }
}
