class Vehiculo {
  final String id;
  final String? choferId;
  final String placa;
  final String tipo; // 'auto', 'camioneta'
  final String marcaModelo;
  final String? color;
  final int? anio;
  final int capacidadPasajeros;
  final bool activo;
  final DateTime createdAt;

  const Vehiculo({
    required this.id,
    this.choferId,
    required this.placa,
    this.tipo = 'auto',
    required this.marcaModelo,
    this.color,
    this.anio,
    this.capacidadPasajeros = 4,
    this.activo = true,
    required this.createdAt,
  });

  bool get isCamioneta => tipo.toLowerCase() == 'camioneta';
  bool get isAuto => tipo.toLowerCase() == 'auto';

  factory Vehiculo.fromJson(Map<String, dynamic> json) {
    return Vehiculo(
      id: json['id'] as String,
      choferId: json['chofer_id'] as String?,
      placa: json['placa'] as String? ?? '',
      tipo: json['tipo'] as String? ?? 'auto',
      marcaModelo: json['marca_modelo'] as String? ?? '',
      color: json['color'] as String?,
      anio: json['anio'] as int?,
      capacidadPasajeros: json['capacidad_pasajeros'] as int? ?? 4,
      activo: json['activo'] as bool? ?? true,
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'chofer_id': choferId,
      'placa': placa,
      'tipo': tipo,
      'marca_modelo': marcaModelo,
      'color': color,
      'anio': anio,
      'capacidad_pasajeros': capacidadPasajeros,
      'activo': activo,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
