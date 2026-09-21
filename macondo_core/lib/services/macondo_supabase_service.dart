import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/ruta.dart';
import '../models/turno_viaje.dart';
import '../models/reserva_pasajero.dart';
import '../models/encomienda.dart';
import '../models/usuario.dart';

class MacondoSupabaseService {
  static final MacondoSupabaseService _instance = MacondoSupabaseService._internal();
  factory MacondoSupabaseService() => _instance;
  MacondoSupabaseService._internal();

  SupabaseClient get client => Supabase.instance.client;

  // ── 0. Autenticación Telefónica con OTP (SMS / WhatsApp) ─────────────────
  /// Solicita un código OTP de 6 dígitos al número de teléfono
  Future<void> solicitarOtpTelefono({
    required String telefonoCompleto, // ej. +593987654321
  }) async {
    try {
      await client.auth.signInWithOtp(
        phone: telefonoCompleto,
      );
    } catch (e) {
      // Fallback para pruebas/offline si Supabase no tiene proveedor SMS configurado
      print('Aviso Supabase Phone Auth: $e');
    }
  }

  /// Verifica el código OTP de 6 dígitos ingresado por el usuario
  Future<AuthResponse?> verificarOtpTelefono({
    required String telefonoCompleto,
    required String tokenOtp,
  }) async {
    try {
      final res = await client.auth.verifyOTP(
        type: OtpType.sms,
        token: tokenOtp,
        phone: telefonoCompleto,
      );
      return res;
    } catch (e) {
      print('Aviso verificación OTP: $e');
      return null;
    }
  }

  /// Registra o actualiza el perfil del usuario (pasajero o chofer) en la tabla 'usuarios'
  Future<Usuario> registrarOActualizarUsuarioPorTelefono({
    required String telefono,
    String codigoPais = '+593',
    required String nombreCompleto,
    String? cedula,
    String rol = 'pasajero',
    String? licenciaConducir,
    String? email,
  }) async {
    final authUserId = client.auth.currentUser?.id;
    final payload = {
      'codigo_pais': codigoPais,
      'telefono': telefono,
      'telefono_verificado': true,
      'nombre_completo': nombreCompleto,
      'cedula': cedula,
      'rol': rol,
      'licencia_conducir': licenciaConducir,
      'email': email ?? '${telefono}@macondoexpress.ec',
      if (authUserId != null) 'auth_user_id': authUserId,
    };

    final res = await client
        .from('usuarios')
        .upsert(payload, onConflict: 'codigo_pais, telefono')
        .select()
        .single();

    return Usuario.fromJson(res as Map<String, dynamic>);
  }

  /// Consulta el perfil de usuario por su número telefónico
  Future<Usuario?> obtenerUsuarioPorTelefono({
    required String telefono,
    String codigoPais = '+593',
  }) async {
    try {
      final res = await client
          .from('usuarios')
          .select()
          .eq('codigo_pais', codigoPais)
          .eq('telefono', telefono)
          .maybeSingle();

      if (res == null) return null;
      return Usuario.fromJson(res as Map<String, dynamic>);
    } catch (e) {
      return null;
    }
  }

  // ── 1. Rutas ─────────────────────────────────────────────────────────────
  Future<List<Ruta>> obtenerRutasActivas() async {
    final res = await client
        .from('rutas')
        .select()
        .eq('activo', true)
        .order('origen_ciudad', ascending: true);
    return (res as List).map((e) => Ruta.fromJson(e as Map<String, dynamic>)).toList();
  }

  // ── 2. Turnos de Viaje ───────────────────────────────────────────────────
  Future<List<TurnoViaje>> obtenerTurnosPorRutaYFecha({
    required String rutaId,
    required DateTime fecha,
  }) async {
    final fechaStr = fecha.toIso8601String().split('T')[0];
    final res = await client
        .from('turnos_viajes')
        .select('*, rutas(*), vehiculos(*), usuarios(*)')
        .eq('ruta_id', rutaId)
        .eq('fecha_salida', fechaStr)
        .eq('estado', 'programado')
        .order('hora_salida', ascending: true);
    return (res as List).map((e) => TurnoViaje.fromJson(e as Map<String, dynamic>)).toList();
  }

  // ── 3. Reserva Atómica de Asientos (1 a 4 puestos) ──────────────────────
  Future<Map<String, dynamic>> reservarAsientos({
    required String turnoId,
    required String pasajeroId,
    required int cantidadPuestos,
    required double latitud,
    required double longitud,
    required String direccion,
    String? referencia,
    required String telefono,
    required double montoEfectivo,
  }) async {
    final response = await client.rpc('reservar_cupos_atomico', params: {
      'p_turno_id': turnoId,
      'p_pasajero_id': pasajeroId,
      'p_cantidad': cantidadPuestos,
      'p_lat': latitud,
      'p_lng': longitud,
      'p_direccion': direccion,
      'p_referencia': referencia ?? '',
      'p_telefono': telefono,
      'p_monto': montoEfectivo,
    });
    return Map<String, dynamic>.from(response as Map);
  }

  // ── 4. Encomiendas Puerta a Puerta ──────────────────────────────────────
  Future<Encomienda> registrarEncomienda({
    required String remitenteId,
    required String remitenteNombre,
    required String remitenteTelefono,
    required String destinatarioNombre,
    required String destinatarioTelefono,
    required double latRecogida,
    required double lngRecogida,
    required String dirRecogida,
    required double latEntrega,
    required double lngEntrega,
    required String dirEntrega,
    String? refEntrega,
    required String descripcionPaquete,
    required double precioEfectivo,
    String? turnoId,
  }) async {
    final res = await client.from('encomiendas').insert({
      'remitente_id': remitenteId,
      'remitente_nombre': remitenteNombre,
      'remitente_telefono': remitenteTelefono,
      'destinatario_nombre': destinatarioNombre,
      'destinatario_telefono': destinatarioTelefono,
      'latitud_recogida': latRecogida,
      'longitud_recogida': lngRecogida,
      'direccion_recogida': dirRecogida,
      'latitud_entrega': latEntrega,
      'longitud_entrega': lngEntrega,
      'direccion_entrega': dirEntrega,
      'referencia_entrega': refEntrega,
      'descripcion_paquete': descripcionPaquete,
      'precio_envio_efectivo': precioEfectivo,
      'turno_id': turnoId,
      'estado': turnoId != null ? 'asignada_a_turno' : 'solicitada',
    }).select().single();

    return Encomienda.fromJson(res as Map<String, dynamic>);
  }

  // ── 5. Escáner QR del Chofer para Confirmar Entrega ──────────────────────
  Future<Map<String, dynamic>> confirmarEntregaConQR({
    required String codigoQr,
    required String choferId,
  }) async {
    final response = await client.rpc('confirmar_entrega_encomienda', params: {
      'p_codigo_qr': codigoQr,
      'p_chofer_id': choferId,
    });
    return Map<String, dynamic>.from(response as Map);
  }

  // ── 6. Manifiesto del Chofer (Pasajeros y Encomiendas de su turno) ───────
  Future<List<ReservaPasajero>> obtenerPasajerosDeTurno(String turnoId) async {
    final res = await client
        .from('reservas_pasajeros')
        .select('*, usuarios(*)')
        .eq('turno_id', turnoId)
        .order('created_at', ascending: true);
    return (res as List).map((e) => ReservaPasajero.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<Encomienda>> obtenerEncomiendasDeTurno(String turnoId) async {
    final res = await client
        .from('encomiendas')
        .select()
        .eq('turno_id', turnoId)
        .order('created_at', ascending: true);
    return (res as List).map((e) => Encomienda.fromJson(e as Map<String, dynamic>)).toList();
  }

  // ── 7. Reservas del Pasajero ─────────────────────────────────────────────
  Future<List<ReservaPasajero>> obtenerMisReservas(String pasajeroId) async {
    final res = await client
        .from('reservas_pasajeros')
        .select('*, turnos_viajes(*, rutas(*), vehiculos(*), usuarios(*))')
        .eq('pasajero_id', pasajeroId)
        .order('created_at', ascending: false);
    return (res as List).map((e) => ReservaPasajero.fromJson(e as Map<String, dynamic>)).toList();
  }
}
