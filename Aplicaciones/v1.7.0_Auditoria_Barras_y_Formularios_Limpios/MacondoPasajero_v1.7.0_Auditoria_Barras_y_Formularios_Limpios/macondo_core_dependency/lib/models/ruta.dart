class Ruta {
  final String id;
  final String origenCiudad;
  final String destinoCiudad;
  final double tarifaPasajeEfectivo;
  final double tarifaEncomiendaBase;
  final int duracionEstimadaMinutos;
  final bool activo;
  final DateTime createdAt;

  const Ruta({
    required this.id,
    required this.origenCiudad,
    required this.destinoCiudad,
    this.tarifaPasajeEfectivo = 10.0,
    this.tarifaEncomiendaBase = 5.0,
    this.duracionEstimadaMinutos = 180,
    this.activo = true,
    required this.createdAt,
  });

  String get trayecto => '$origenCiudad ➔ $destinoCiudad';

  factory Ruta.fromJson(Map<String, dynamic> json) {
    return Ruta(
      id: json['id'] as String,
      origenCiudad: json['origen_ciudad'] as String? ?? '',
      destinoCiudad: json['destino_ciudad'] as String? ?? '',
      tarifaPasajeEfectivo: (json['tarifa_pasaje_efectivo'] as num?)?.toDouble() ?? 10.0,
      tarifaEncomiendaBase: (json['tarifa_encomienda_base'] as num?)?.toDouble() ?? 5.0,
      duracionEstimadaMinutos: json['duracion_estimada_minutos'] as int? ?? 180,
      activo: json['activo'] as bool? ?? true,
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'origen_ciudad': origenCiudad,
      'destino_ciudad': destinoCiudad,
      'tarifa_pasaje_efectivo': tarifaPasajeEfectivo,
      'tarifa_encomienda_base': tarifaEncomiendaBase,
      'duracion_estimada_minutos': duracionEstimadaMinutos,
      'activo': activo,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
