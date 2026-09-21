class Usuario {
  final String id;
  final String? email;
  final String codigoPais;
  final String telefono;
  final bool telefonoVerificado;
  final String nombreCompleto;
  final String? cedula;
  final String rol; // 'pasajero', 'chofer', 'admin'
  final String? licenciaConducir;
  final String? estadoChofer; // 'pendiente_aprobacion', 'activo', 'suspendido'
  final String? fotoUrl;
  final bool activo;
  final DateTime createdAt;

  const Usuario({
    required this.id,
    this.email,
    this.codigoPais = '+593',
    required this.telefono,
    this.telefonoVerificado = true,
    required this.nombreCompleto,
    this.cedula,
    this.rol = 'pasajero',
    this.licenciaConducir,
    this.estadoChofer = 'activo',
    this.fotoUrl,
    this.activo = true,
    required this.createdAt,
  });

  bool get isChofer => rol == 'chofer';
  bool get isAdmin => rol == 'admin';
  bool get isPasajero => rol == 'pasajero';

  String get telefonoCompleto => '$codigoPais $telefono';

  factory Usuario.fromJson(Map<String, dynamic> json) {
    return Usuario(
      id: json['id'] as String,
      email: json['email'] as String?,
      codigoPais: json['codigo_pais'] as String? ?? '+593',
      telefono: json['telefono'] as String? ?? '',
      telefonoVerificado: json['telefono_verificado'] as bool? ?? true,
      nombreCompleto: json['nombre_completo'] as String? ?? 'Usuario',
      cedula: json['cedula'] as String?,
      rol: json['rol'] as String? ?? 'pasajero',
      licenciaConducir: json['licencia_conducir'] as String?,
      estadoChofer: json['estado_chofer'] as String? ?? 'activo',
      fotoUrl: json['foto_url'] as String?,
      activo: json['activo'] as bool? ?? true,
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'codigo_pais': codigoPais,
      'telefono': telefono,
      'telefono_verificado': telefonoVerificado,
      'nombre_completo': nombreCompleto,
      'cedula': cedula,
      'rol': rol,
      'licencia_conducir': licenciaConducir,
      'estado_chofer': estadoChofer,
      'foto_url': fotoUrl,
      'activo': activo,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
