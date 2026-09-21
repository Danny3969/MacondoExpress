import 'package:flutter/material.dart';
import 'package:macondo_core/constants/app_colors.dart';
import 'package:macondo_core/models/ruta.dart';
import 'package:macondo_core/models/turno_viaje.dart';
import 'package:macondo_core/models/usuario.dart';
import 'package:macondo_core/models/vehiculo.dart';
import 'package:macondo_core/services/macondo_supabase_service.dart';
import '../widgets/app_header.dart';
import '../widgets/trip_card.dart';
import 'booking_screen.dart';

class TurnosScreen extends StatefulWidget {
  final Ruta ruta;
  final DateTime fecha;
  final Usuario usuarioActual;

  const TurnosScreen({
    super.key,
    required this.ruta,
    required this.fecha,
    required this.usuarioActual,
  });

  @override
  State<TurnosScreen> createState() => _TurnosScreenState();
}

class _TurnosScreenState extends State<TurnosScreen> {
  List<TurnoViaje> _turnos = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _cargarTurnos();
  }

  Future<void> _cargarTurnos() async {
    setState(() => _isLoading = true);
    try {
      final turnos = await MacondoSupabaseService().obtenerTurnosPorRutaYFecha(
        rutaId: widget.ruta.id,
        fecha: widget.fecha,
      );
      if (mounted) {
        setState(() {
          _turnos = turnos.isNotEmpty ? turnos : _generarTurnosDemostrativos();
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _turnos = _generarTurnosDemostrativos();
          _isLoading = false;
        });
      }
    }
  }

  List<TurnoViaje> _generarTurnosDemostrativos() {
    final fechaStr = widget.fecha.toIso8601String().split('T')[0];
    return [
      TurnoViaje(
        id: 'trn-demo-01',
        rutaId: widget.ruta.id,
        ruta: widget.ruta,
        fechaSalida: fechaStr,
        horaSalida: '06:00:00',
        cuposTotales: 4,
        cuposOcupados: 1,
        estado: 'programado',
        vehiculo: Vehiculo(
          id: 'veh-01',
          placa: 'GBA-4123',
          tipo: 'auto',
          marcaModelo: 'Chevrolet Aveo',
          capacidadPasajeros: 4,
        ),
        chofer: Usuario(
          id: 'chf-01',
          nombreCompleto: 'Manuel Palacios',
          telefono: '0991234567',
          rol: 'chofer',
        ),
      ),
      TurnoViaje(
        id: 'trn-demo-02',
        rutaId: widget.ruta.id,
        ruta: widget.ruta,
        fechaSalida: fechaStr,
        horaSalida: '09:30:00',
        cuposTotales: 4,
        cuposOcupados: 2,
        estado: 'programado',
        vehiculo: Vehiculo(
          id: 'veh-02',
          placa: 'OBA-9871',
          tipo: 'camioneta',
          marcaModelo: 'Toyota Hilux D-Cab',
          capacidadPasajeros: 4,
        ),
        chofer: Usuario(
          id: 'chf-02',
          nombreCompleto: 'Roberto Zambrano',
          telefono: '0987651234',
          rol: 'chofer',
        ),
      ),
      TurnoViaje(
        id: 'trn-demo-03',
        rutaId: widget.ruta.id,
        ruta: widget.ruta,
        fechaSalida: fechaStr,
        horaSalida: '14:00:00',
        cuposTotales: 4,
        cuposOcupados: 0,
        estado: 'programado',
        vehiculo: Vehiculo(
          id: 'veh-03',
          placa: 'PBA-3342',
          tipo: 'auto',
          marcaModelo: 'Hyundai Accent',
          capacidadPasajeros: 4,
        ),
        chofer: Usuario(
          id: 'chf-03',
          nombreCompleto: 'Fausto Cevallos',
          telefono: '0978901234',
          rol: 'chofer',
        ),
      ),
      TurnoViaje(
        id: 'trn-demo-04',
        rutaId: widget.ruta.id,
        ruta: widget.ruta,
        fechaSalida: fechaStr,
        horaSalida: '17:30:00',
        cuposTotales: 4,
        cuposOcupados: 4, // Lleno
        estado: 'programado',
        vehiculo: Vehiculo(
          id: 'veh-04',
          placa: 'GBA-5511',
          tipo: 'camioneta',
          marcaModelo: 'D-Max 4x4',
          capacidadPasajeros: 4,
        ),
        chofer: Usuario(
          id: 'chf-04',
          nombreCompleto: 'Javier Moreira',
          telefono: '0994321098',
          rol: 'chofer',
        ),
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final fechaStr = '${widget.fecha.day}/${widget.fecha.month}/${widget.fecha.year}';

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          MacondoHeader(
            title: '${widget.ruta.origenCiudad} ➔ ${widget.ruta.destinoCiudad}',
            subtitle: 'Turnos programados para: $fechaStr',
            showBack: true,
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppColors.accent))
                : _turnos.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: const [
                            Icon(Icons.event_busy, color: AppColors.textDim, size: 48),
                            SizedBox(height: 12),
                            Text(
                              'No hay turnos programados para esta fecha',
                              style: TextStyle(color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _cargarTurnos,
                        color: AppColors.accent,
                        backgroundColor: AppColors.surface,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(18),
                          itemCount: _turnos.length,
                          itemBuilder: (ctx, index) {
                            final turno = _turnos[index];
                            return TripCard(
                              turno: turno,
                              onReservar: () async {
                                final res = await Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (_) => BookingScreen(
                                      turno: turno,
                                      usuarioActual: widget.usuarioActual,
                                    ),
                                  ),
                                );
                                if (res == true) {
                                  _cargarTurnos();
                                }
                              },
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
