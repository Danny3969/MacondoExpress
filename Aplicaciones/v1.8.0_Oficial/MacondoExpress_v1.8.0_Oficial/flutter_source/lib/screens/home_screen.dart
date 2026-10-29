import 'package:flutter/material.dart';
import 'package:macondo_core/constants/app_colors.dart';
import 'package:macondo_core/models/usuario.dart';
import 'package:macondo_core/models/ruta.dart';
import 'package:macondo_core/services/macondo_supabase_service.dart';
import '../widgets/app_header.dart';
import 'turnos_screen.dart';
import 'encomienda_form_screen.dart';
import 'mis_viajes_screen.dart';

class HomeScreen extends StatefulWidget {
  final Usuario usuarioActual;

  const HomeScreen({
    super.key,
    required this.usuarioActual,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String _origenSeleccionado = 'Guayaquil';
  String _destinoSeleccionado = 'Machala';
  DateTime _fechaSeleccionada = DateTime.now();
  List<Ruta> _rutas = [];
  bool _isLoadingRutas = true;

  final List<String> _ciudades = ['Guayaquil', 'Machala', 'Cuenca', 'Loja', 'Pasaje', 'Santa Rosa'];

  @override
  void initState() {
    super.initState();
    _cargarRutas();
  }

  Future<void> _cargarRutas() async {
    try {
      final rutas = await MacondoSupabaseService().obtenerRutasActivas();
      if (mounted) {
        setState(() {
          _rutas = rutas.isNotEmpty ? rutas : _rutasDemostrativas();
          _isLoadingRutas = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _rutas = _rutasDemostrativas();
          _isLoadingRutas = false;
        });
      }
    }
  }

  List<Ruta> _rutasDemostrativas() {
    return [
      Ruta(
        id: 'rt-gye-mch',
        origenCiudad: 'Guayaquil',
        destinoCiudad: 'Machala',
        tarifaPasajeEfectivo: 12.00,
        tarifaEncomiendaBase: 5.00,
        duracionEstimadaMinutos: 180,
      ),
      Ruta(
        id: 'rt-mch-gye',
        origenCiudad: 'Machala',
        destinoCiudad: 'Guayaquil',
        tarifaPasajeEfectivo: 12.00,
        tarifaEncomiendaBase: 5.00,
        duracionEstimadaMinutos: 180,
      ),
      Ruta(
        id: 'rt-cue-loj',
        origenCiudad: 'Cuenca',
        destinoCiudad: 'Loja',
        tarifaPasajeEfectivo: 10.00,
        tarifaEncomiendaBase: 4.50,
        duracionEstimadaMinutos: 210,
      ),
      Ruta(
        id: 'rt-loj-cue',
        origenCiudad: 'Loja',
        destinoCiudad: 'Cuenca',
        tarifaPasajeEfectivo: 10.00,
        tarifaEncomiendaBase: 4.50,
        duracionEstimadaMinutos: 210,
      ),
    ];
  }

  void _intercambiarCiudades() {
    setState(() {
      final temp = _origenSeleccionado;
      _origenSeleccionado = _destinoSeleccionado;
      _destinoSeleccionado = temp;
    });
  }

  void _buscarTurnos() {
    final ruta = _rutas.firstWhere(
      (r) => r.origenCiudad == _origenSeleccionado && r.destinoCiudad == _destinoSeleccionado,
      orElse: () => Ruta(
        id: 'rt-custom',
        origenCiudad: _origenSeleccionado,
        destinoCiudad: _destinoSeleccionado,
        tarifaPasajeEfectivo: 12.00,
        tarifaEncomiendaBase: 5.00,
        duracionEstimadaMinutos: 180,
      ),
    );

    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => TurnosScreen(
          ruta: ruta,
          fecha: _fechaSeleccionada,
          usuarioActual: widget.usuarioActual,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          MacondoHeader(
            title: 'Hola, ${widget.usuarioActual.nombreCompleto}',
            subtitle: 'Cooperativa Macondo Express · Puerta a Puerta',
            trailing: IconButton(
              icon: const Icon(Icons.history, color: AppColors.accentLight),
              tooltip: 'Mis Reservas & Envíos',
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => MisViajesScreen(usuarioActual: widget.usuarioActual),
                  ),
                );
              },
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(18),
              children: [
                // 1. Selector Principal de Viaje (Origen / Destino / Fecha)
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: const [
                          Icon(Icons.airport_shuttle, color: AppColors.accent, size: 20),
                          SizedBox(width: 8),
                          Text(
                            'RESERVAR VIAJE PUERTA A PUERTA',
                            style: TextStyle(
                              color: AppColors.accentLight,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.0,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Origen & Destino con botón de inversión
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              children: [
                                _buildCityDropdown('Ciudad de Origen', _origenSeleccionado, (val) {
                                  if (val != null) setState(() => _origenSeleccionado = val);
                                }),
                                const SizedBox(height: 10),
                                _buildCityDropdown('Ciudad de Destino', _destinoSeleccionado, (val) {
                                  if (val != null) setState(() => _destinoSeleccionado = val);
                                }),
                              ],
                            ),
                          ),
                          const SizedBox(width: 10),
                          Container(
                            decoration: BoxDecoration(
                              color: AppColors.surfaceElevated,
                              shape: BoxShape.circle,
                              border: Border.all(color: AppColors.border),
                            ),
                            child: IconButton(
                              onPressed: _intercambiarCiudades,
                              icon: const Icon(Icons.swap_vert, color: AppColors.accentLight),
                              tooltip: 'Invertir Origen/Destino',
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),

                      // Selector de Fecha Rápido (Hoy / Mañana)
                      Row(
                        children: [
                          Expanded(
                            child: _buildDateButton('Hoy', DateTime.now()),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: _buildDateButton('Mañana', DateTime.now().add(const Duration(days: 1))),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Botón Buscar Turnos
                      SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ElevatedButton(
                          onPressed: _buscarTurnos,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.accent,
                            foregroundColor: AppColors.primary,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            elevation: 2,
                          ),
                          child: const Text(
                            'Buscar Turnos Disponibles',
                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                // 2. Banner Encomiendas Puerta a Puerta con Código QR
                GestureDetector(
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => EncomiendaFormScreen(usuarioActual: widget.usuarioActual),
                      ),
                    );
                  },
                  child: Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.accent.withOpacity(0.4)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: AppColors.accent.withOpacity(0.2),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.qr_code_scanner, color: AppColors.accentLight, size: 30),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: const [
                              Text(
                                'ENCOMIENDAS CON QR',
                                style: TextStyle(
                                  color: AppColors.accentLight,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 1.1,
                                ),
                              ),
                              SizedBox(height: 4),
                              Text(
                                'Envío Puerta a Puerta seguro',
                                style: TextStyle(
                                  color: AppColors.textPrimary,
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'Recogida en tu puerta y entrega con escaneo QR al destinatario.',
                                style: TextStyle(color: AppColors.textSecondary, fontSize: 11),
                              ),
                            ],
                          ),
                        ),
                        const Icon(Icons.chevron_right, color: AppColors.accentLight),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 18),

                // 3. Características de Macondo Express
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    children: [
                      _buildFeatureRow(
                        Icons.airline_seat_recline_extra,
                        'Flota Confortable (4 Asientos)',
                        'Viajes en autos y camionetas con capacidad máxima de 4 pasajeros para tu comodidad.',
                      ),
                      const Divider(color: AppColors.divider, height: 20),
                      _buildFeatureRow(
                        Icons.door_front_door_outlined,
                        'Servicio Puerta a Puerta',
                        'El chofer pasa directamente a tu dirección y ubicación GPS indicada.',
                      ),
                      const Divider(color: AppColors.divider, height: 20),
                      _buildFeatureRow(
                        Icons.payments_outlined,
                        'Pago 100% Efectivo',
                        'Pagas tranquilamente al abordar el vehículo o al entregar la encomienda.',
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCityDropdown(String label, String value, ValueChanged<String?> onChanged) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.border),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          isExpanded: true,
          dropdownColor: AppColors.surfaceElevated,
          icon: const Icon(Icons.arrow_drop_down, color: AppColors.accentLight),
          items: _ciudades.map((c) {
            return DropdownMenuItem(
              value: c,
              child: Text(
                '$label: $c',
                style: const TextStyle(color: AppColors.textPrimary, fontSize: 13),
              ),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }

  Widget _buildDateButton(String label, DateTime date) {
    final isSelected = _fechaSeleccionada.day == date.day &&
        _fechaSeleccionada.month == date.month &&
        _fechaSeleccionada.year == date.year;

    return InkWell(
      onTap: () => setState(() => _fechaSeleccionada = date),
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.accent.withOpacity(0.2) : AppColors.surfaceElevated,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: isSelected ? AppColors.accent : AppColors.border),
        ),
        child: Center(
          child: Text(
            '$label (${date.day}/${date.month})',
            style: TextStyle(
              color: isSelected ? AppColors.accentLight : AppColors.textSecondary,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFeatureRow(IconData icon, String title, String desc) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.surfaceElevated,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: AppColors.accent, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                desc,
                style: const TextStyle(color: AppColors.textDim, fontSize: 11),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
