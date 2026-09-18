class Usuario {
  final String id;
  final String? email;
  final String nombreCompleto;
  final String telefono;
  final String rol; // 'pasajero', 'chofer', 'admin'
  final String? fotoUrl;
  final bool activo;
  final DateTime createdAt;

  const Usuario({
    required this.id,
    this.email,
    required this.nombreCompleto,
    required this.telefono,
    this.rol = 'pasajero',
    this.fotoUrl,
    this.activo = true,
    required this.createdAt,
  });

  bool get isChofer => rol == 'chofer';
  bool get isAdmin => rol == 'admin';
  bool get isPasajero => rol == 'pasajero';

  factory Usuario.fromJson(Map<String, dynamic> json) {
    return Usuario(
      id: json['id'] as String,
      email: json['email'] as String?,
      nombreCompleto: json['nombre_completo'] as String? ?? 'Usuario',
      telefono: json['telefono'] as String? ?? '',
      rol: json['rol'] as String? ?? 'pasajero',
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
      'nombre_completo': nombreCompleto,
      'telefono': telefono,
      'rol': rol,
      'foto_url': fotoUrl,
      'activo': activo,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
