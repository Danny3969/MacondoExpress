class PosicionGps {
  final String id;
  final String turnoId;
  final String choferId;
  final double latitud;
  final double longitud;
  final double velocidadKmh;
  final double rumboGrados;
  final DateTime createdAt;

  PosicionGps({
    required this.id,
    required this.turnoId,
    required this.choferId,
    required this.latitud,
    required this.longitud,
    this.velocidadKmh = 0.0,
    this.rumboGrados = 0.0,
    required this.createdAt,
  });

  factory PosicionGps.fromJson(Map<String, dynamic> json) {
    return PosicionGps(
      id: json['id'] as String? ?? '',
      turnoId: json['turno_id'] as String? ?? '',
      choferId: json['chofer_id'] as String? ?? '',
      latitud: (json['latitud'] as num?)?.toDouble() ?? 0.0,
      longitud: (json['longitud'] as num?)?.toDouble() ?? 0.0,
      velocidadKmh: (json['velocidad_kmh'] as num?)?.toDouble() ?? 0.0,
      rumboGrados: (json['rumbo_grados'] as num?)?.toDouble() ?? 0.0,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'turno_id': turnoId,
      'chofer_id': choferId,
      'latitud': latitud,
      'longitud': longitud,
      'velocidad_kmh': velocidadKmh,
      'rumbo_grados': rumboGrados,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
