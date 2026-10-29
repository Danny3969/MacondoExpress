class ProofOfDelivery {
  final String id;
  final String encomiendaId;
  final String choferId;
  final DateTime fechaEntrega;
  final String? fotoUrl;
  final String? firmaDigital;
  final String receptorNombre;
  final String? receptorCedula;
  final String? observaciones;
  final double? latitud;
  final double? longitud;
  final bool sincronizado;

  ProofOfDelivery({
    required this.id,
    required this.encomiendaId,
    required this.choferId,
    required this.fechaEntrega,
    this.fotoUrl,
    this.firmaDigital,
    required this.receptorNombre,
    this.receptorCedula,
    this.observaciones,
    this.latitud,
    this.longitud,
    this.sincronizado = true,
  });

  factory ProofOfDelivery.fromJson(Map<String, dynamic> json) {
    return ProofOfDelivery(
      id: json['id'] as String,
      encomiendaId: json['encomienda_id'] as String,
      choferId: json['chofer_id'] as String,
      fechaEntrega: DateTime.parse(json['fecha_entrega'] as String),
      fotoUrl: json['foto_url'] as String?,
      firmaDigital: json['firma_digital'] as String?,
      receptorNombre: json['receptor_nombre'] as String? ?? 'Destinatario',
      receptorCedula: json['receptor_cedula'] as String?,
      observaciones: json['observaciones'] as String?,
      latitud: (json['latitud'] as num?)?.toDouble(),
      longitud: (json['longitud'] as num?)?.toDouble(),
      sincronizado: json['sincronizado'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'encomienda_id': encomiendaId,
      'chofer_id': choferId,
      'fecha_entrega': fechaEntrega.toIso8601String(),
      'foto_url': fotoUrl,
      'firma_digital': firmaDigital,
      'receptor_nombre': receptorNombre,
      'receptor_cedula': receptorCedula,
      'observaciones': observaciones,
      'latitud': latitud,
      'longitud': longitud,
      'sincronizado': sincronizado,
    };
  }

  ProofOfDelivery copyWith({
    String? id,
    String? encomiendaId,
    String? choferId,
    DateTime? fechaEntrega,
    String? fotoUrl,
    String? firmaDigital,
    String? receptorNombre,
    String? receptorCedula,
    String? observaciones,
    double? latitud,
    double? longitud,
    bool? sincronizado,
  }) {
    return ProofOfDelivery(
      id: id ?? this.id,
      encomiendaId: encomiendaId ?? this.encomiendaId,
      choferId: choferId ?? this.choferId,
      fechaEntrega: fechaEntrega ?? this.fechaEntrega,
      fotoUrl: fotoUrl ?? this.fotoUrl,
      firmaDigital: firmaDigital ?? this.firmaDigital,
      receptorNombre: receptorNombre ?? this.receptorNombre,
      receptorCedula: receptorCedula ?? this.receptorCedula,
      observaciones: observaciones ?? this.observaciones,
      latitud: latitud ?? this.latitud,
      longitud: longitud ?? this.longitud,
      sincronizado: sincronizado ?? this.sincronizado,
    );
  }
}
