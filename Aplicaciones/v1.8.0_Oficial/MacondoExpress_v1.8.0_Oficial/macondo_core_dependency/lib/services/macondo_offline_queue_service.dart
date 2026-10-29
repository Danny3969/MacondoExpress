import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../models/proof_of_delivery.dart';
import 'macondo_supabase_service.dart';

enum TipoAccionOffline {
  confirmarEntregaEncomienda,
  confirmarAbordajePasajero,
  alertaSosEmergencia,
  registroProofOfDelivery,
}

class ItemAccionOffline {
  final String id;
  final TipoAccionOffline tipo;
  final Map<String, dynamic> datos;
  final DateTime fechaCreacion;
  int reintentos;
  String? ultimoError;

  ItemAccionOffline({
    required this.id,
    required this.tipo,
    required this.datos,
    required this.fechaCreacion,
    this.reintentos = 0,
    this.ultimoError,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'tipo': tipo.name,
    'datos': datos,
    'fecha_creacion': fechaCreacion.toIso8601String(),
    'reintentos': reintentos,
    'ultimo_error': ultimoError,
  };

  factory ItemAccionOffline.fromJson(Map<String, dynamic> json) => ItemAccionOffline(
    id: json['id'] as String,
    tipo: TipoAccionOffline.values.firstWhere(
      (e) => e.name == json['tipo'],
      orElse: () => TipoAccionOffline.confirmarEntregaEncomienda,
    ),
    datos: Map<String, dynamic>.from(json['datos'] as Map),
    fechaCreacion: DateTime.parse(json['fecha_creacion'] as String),
    reintentos: json['reintentos'] as int? ?? 0,
    ultimoError: json['ultimo_error'] as String?,
  );
}

/// Servicio de Cola Offline para Choferes y Pasajeros en Zonas de Sombra Celular
class MacondoOfflineQueueService extends ChangeNotifier {
  static final MacondoOfflineQueueService _instance = MacondoOfflineQueueService._internal();
  factory MacondoOfflineQueueService() => _instance;
  MacondoOfflineQueueService._internal();

  final List<ItemAccionOffline> _colaPendiente = [];
  bool _estaOnline = true;
  bool _sincronizando = false;
  Timer? _timerReintento;

  List<ItemAccionOffline> get colaPendiente => List.unmodifiable(_colaPendiente);
  int get totalPendientes => _colaPendiente.length;
  bool get estaOnline => _estaOnline;
  bool get sincronizando => _sincronizando;

  /// Cambia el estado simulado o real de conectividad
  void setConectividad(bool online) {
    if (_estaOnline != online) {
      _estaOnline = online;
      notifyListeners();
      if (_estaOnline && _colaPendiente.isNotEmpty) {
        sincronizarCola();
      }
    }
  }

  /// Encola una acción para ejecución diferida
  void encolarAccion({
    required TipoAccionOffline tipo,
    required Map<String, dynamic> datos,
  }) {
    final nuevoItem = ItemAccionOffline(
      id: 'OFF-${DateTime.now().millisecondsSinceEpoch}',
      tipo: tipo,
      datos: datos,
      fechaCreacion: DateTime.now(),
    );

    _colaPendiente.add(nuevoItem);
    notifyListeners();

    if (_estaOnline) {
      sincronizarCola();
    }
  }

  /// Sincroniza todas las acciones pendientes contra Supabase
  Future<void> sincronizarCola() async {
    if (_sincronizando || !_estaOnline || _colaPendiente.isEmpty) return;

    _sincronizando = true;
    notifyListeners();

    final List<ItemAccionOffline> aEliminar = [];

    for (final item in _colaPendiente) {
      try {
        bool exito = false;
        switch (item.tipo) {
          case TipoAccionOffline.confirmarEntregaEncomienda:
            final res = await MacondoSupabaseService().confirmarEntregaConQr(
              codigoQr: item.datos['codigo_qr'] as String,
              choferId: item.datos['chofer_id'] as String,
            );
            exito = res['ok'] == true;
            break;

          case TipoAccionOffline.confirmarAbordajePasajero:
            final res = await MacondoSupabaseService().confirmarAbordajeConPin(
              reservaId: item.datos['reserva_id'] as String,
              pin: item.datos['pin'] as String,
              choferId: item.datos['chofer_id'] as String,
            );
            exito = res['ok'] == true;
            break;

          case TipoAccionOffline.alertaSosEmergencia:
            // Registro de SOS en telemetría o tabla de incidentes
            await MacondoSupabaseService().client.from('alertas_sos').insert({
              'usuario_id': item.datos['usuario_id'],
              'turno_id': item.datos['turno_id'],
              'rol': item.datos['rol'],
              'latitud': item.datos['latitud'],
              'longitud': item.datos['longitud'],
              'mensaje': item.datos['mensaje'],
              'created_at': item.fechaCreacion.toIso8601String(),
            });
            exito = true;
            break;

          case TipoAccionOffline.registroProofOfDelivery:
            // Inserción en base de datos de POD
            await MacondoSupabaseService().client.from('proof_of_delivery').insert({
              'encomienda_id': item.datos['encomienda_id'],
              'chofer_id': item.datos['chofer_id'],
              'receptor_nombre': item.datos['receptor_nombre'],
              'receptor_cedula': item.datos['receptor_cedula'],
              'foto_url': item.datos['foto_url'],
              'firma_digital': item.datos['firma_digital'],
              'observaciones': item.datos['observaciones'],
              'latitud': item.datos['latitud'],
              'longitud': item.datos['longitud'],
              'fecha_entrega': item.fechaCreacion.toIso8601String(),
            });
            exito = true;
            break;
        }

        if (exito) {
          aEliminar.add(item);
        } else {
          item.reintentos += 1;
          item.ultimoError = 'La respuesta de Supabase no confirmó la acción';
        }
      } catch (e) {
        item.reintentos += 1;
        item.ultimoError = e.toString();
      }
    }

    _colaPendiente.removeWhere((item) => aEliminar.contains(item));
    _sincronizando = false;
    notifyListeners();
  }

  /// Limpiar la cola manualmente si se requiere
  void limpiarCola() {
    _colaPendiente.clear();
    notifyListeners();
  }
}
