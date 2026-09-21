import 'package:flutter/material.dart';
import 'package:macondo_core/constants/app_colors.dart';
import 'package:macondo_core/models/usuario.dart';
import 'package:macondo_core/models/turno_viaje.dart';
import 'package:macondo_core/models/ruta.dart';
import 'package:macondo_core/models/vehiculo.dart';
import '../widgets/conductor_header.dart';

class AdminDispatchScreen extends StatefulWidget {
  final Usuario adminActual;

  const AdminDispatchScreen({
    super.key,
    required this.adminActual,
  });

  @override
  State<AdminDispatchScreen> createState() => _AdminDispatchScreenState();
}

class _AdminDispatchScreenState extends State<AdminDispatchScreen> {
  late List<TurnoViaje> _turnos;

  @override
  void initState() {
    super.initState();
    _turnos = [
      TurnoViaje(
        id: 'trn-adm-01',
        rutaId: 'rt-gye-mch',
        ruta: Ruta(id: 'rt-gye-mch', origenCiudad: 'Guayaquil', destinoCiudad: 'Machala', tarifaPasajeEfectivo: 12.00),
        vehiculo: Vehiculo(id: 'veh-01', placa: 'GBA-4123', tipo: 'auto', marcaModelo: 'Chevrolet Aveo', capacidadPasajeros: 4),
        chofer: Usuario(id: 'chf-01', nombreCompleto: 'Manuel Palacios', telefono: '0991234567', rol: 'chofer'),
        fechaSalida: DateTime.now().toIso8601String().split('T')[0],
        horaSalida: '06:00:00',
        cuposTotales: 4,
        cuposOcupados: 4, // Completo
        totalRecaudadoEfectivo: 48.00,
        estado: 'en_camino',
      ),
      TurnoViaje(
        id: 'trn-adm-02',
        rutaId: 'rt-gye-mch',
        ruta: Ruta(id: 'rt-gye-mch', origenCiudad: 'Guayaquil', destinoCiudad: 'Machala', tarifaPasajeEfectivo: 12.00),
        vehiculo: Vehiculo(id: 'veh-02', placa: 'OBA-9871', tipo: 'camioneta', marcaModelo: 'Toyota Hilux', capacidadPasajeros: 4),
        chofer: Usuario(id: 'chf-02', nombreCompleto: 'Roberto Zambrano', telefono: '0987651234', rol: 'chofer'),
        fechaSalida: DateTime.now().toIso8601String().split('T')[0],
        horaSalida: '09:30:00',
        cuposTotales: 4,
        cuposOcupados: 3, // 1 libre
        totalRecaudadoEfectivo: 36.00,
        estado: 'recogiendo',
      ),
      TurnoViaje(
        id: 'trn-adm-03',
        rutaId: 'rt-cue-loj',
        ruta: Ruta(id: 'rt-cue-loj', origenCiudad: 'Cuenca', destinoCiudad: 'Loja', tarifaPasajeEfectivo: 10.00),
        vehiculo: Vehiculo(id: 'veh-03', placa: 'PBA-3342', tipo: 'auto', marcaModelo: 'Hyundai Accent', capacidadPasajeros: 4),
        chofer: Usuario(id: 'chf-03', nombreCompleto: 'Fausto Cevallos', telefono: '0978901234', rol: 'chofer'),
        fechaSalida: DateTime.now().toIso8601String().split('T')[0],
        horaSalida: '14:00:00',
        cuposTotales: 4,
        cuposOcupados: 1, // 3 libres
        totalRecaudadoEfectivo: 10.00,
        estado: 'programado',
      ),
    ];
  }

  void _abrirDialogoCrearTurno() {
    String rutaSel = 'Guayaquil ➔ Machala';
    String horaSel = '15:30';
    String choferSel = 'Javier Moreira (0994321098)';
    String vehiculoSel = 'D-Max 4x4 (Camioneta - GBA-5511)';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: AppColors.surface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: const BorderSide(color: AppColors.amber),
          ),
          title: Row(
            children: const [
              Icon(Icons.add_circle, color: AppColors.amber, size: 24),
              SizedBox(width: 8),
              Text('Programar Nuevo Turno', style: TextStyle(color: AppColors.textPrimary, fontSize: 16)),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Ruta Operada:', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                const SizedBox(height: 4),
                _dropdownContainer(
                  DropdownButton<String>(
                    value: rutaSel,
                    isExpanded: true,
                    dropdownColor: AppColors.surfaceElevated,
                    style: const TextStyle(color: AppColors.textPrimary, fontSize: 13),
                    items: const [
                      DropdownMenuItem(value: 'Guayaquil ➔ Machala', child: Text('Guayaquil ➔ Machala (\$12.00)')),
                      DropdownMenuItem(value: 'Machala ➔ Guayaquil', child: Text('Machala ➔ Guayaquil (\$12.00)')),
                      DropdownMenuItem(value: 'Cuenca ➔ Loja', child: Text('Cuenca ➔ Loja (\$10.00)')),
                    ],
                    onChanged: (val) => setDialogState(() => rutaSel = val!),
                  ),
                ),
                const SizedBox(height: 12),

                const Text('Hora de Salida:', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                const SizedBox(height: 4),
                _dropdownContainer(
                  DropdownButton<String>(
                    value: horaSel,
                    isExpanded: true,
                    dropdownColor: AppColors.surfaceElevated,
                    style: const TextStyle(color: AppColors.textPrimary, fontSize: 13),
                    items: const [
                      DropdownMenuItem(value: '11:00', child: Text('11:00 AM')),
                      DropdownMenuItem(value: '13:30', child: Text('01:30 PM')),
                      DropdownMenuItem(value: '15:30', child: Text('03:30 PM')),
                      DropdownMenuItem(value: '18:00', child: Text('06:00 PM')),
                    ],
                    onChanged: (val) => setDialogState(() => horaSel = val!),
                  ),
                ),
                const SizedBox(height: 12),

                const Text('Vehículo (4 Pasajeros Estándar):', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                const SizedBox(height: 4),
                _dropdownContainer(
                  DropdownButton<String>(
                    value: vehiculoSel,
                    isExpanded: true,
                    dropdownColor: AppColors.surfaceElevated,
                    style: const TextStyle(color: AppColors.textPrimary, fontSize: 13),
                    items: const [
                      DropdownMenuItem(value: 'D-Max 4x4 (Camioneta - GBA-5511)', child: Text('D-Max 4x4 (Camioneta)')),
                      DropdownMenuItem(value: 'Toyota Hilux (Camioneta - OBA-9871)', child: Text('Toyota Hilux (Camioneta)')),
                      DropdownMenuItem(value: 'Chevrolet Aveo (Auto - GBA-4123)', child: Text('Chevrolet Aveo (Auto)')),
                    ],
                    onChanged: (val) => setDialogState(() => vehiculoSel = val!),
                  ),
                ),
                const SizedBox(height: 12),

                const Text('Chofer Asignado:', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                const SizedBox(height: 4),
                _dropdownContainer(
                  DropdownButton<String>(
                    value: choferSel,
                    isExpanded: true,
                    dropdownColor: AppColors.surfaceElevated,
                    style: const TextStyle(color: AppColors.textPrimary, fontSize: 13),
                    items: const [
                      DropdownMenuItem(value: 'Javier Moreira (0994321098)', child: Text('Javier Moreira')),
                      DropdownMenuItem(value: 'Fausto Cevallos (0978901234)', child: Text('Fausto Cevallos')),
                      DropdownMenuItem(value: 'Roberto Zambrano (0987651234)', child: Text('Roberto Zambrano')),
                    ],
                    onChanged: (val) => setDialogState(() => choferSel = val!),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Cancelar', style: TextStyle(color: AppColors.textDim)),
            ),
            ElevatedButton(
              onPressed: () {
                setState(() {
                  _turnos.add(
                    TurnoViaje(
                      id: 'trn-adm-new-${DateTime.now().millisecondsSinceEpoch}',
                      rutaId: 'rt-new',
                      ruta: Ruta(
                        id: 'rt-new',
                        origenCiudad: rutaSel.split(' ➔ ')[0],
                        destinoCiudad: rutaSel.split(' ➔ ')[1].split(' (')[0],
                        tarifaPasajeEfectivo: 12.00,
                      ),
                      vehiculo: Vehiculo(
                        id: 'veh-new',
                        placa: 'GBA-5511',
                        tipo: vehiculoSel.contains('Camioneta') ? 'camioneta' : 'auto',
                        marcaModelo: vehiculoSel,
                        capacidadPasajeros: 4,
                      ),
                      chofer: Usuario(
                        id: 'chf-new',
                        nombreCompleto: choferSel.split(' (')[0],
                        telefono: '0994321098',
                        rol: 'chofer',
                      ),
                      fechaSalida: DateTime.now().toIso8601String().split('T')[0],
                      horaSalida: '$horaSel:00',
                      cuposTotales: 4,
                      cuposOcupados: 0,
                      totalRecaudadoEfectivo: 0.00,
                      estado: 'programado',
                    ),
                  );
                });
                Navigator.of(ctx).pop();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Nuevo turno publicado con éxito.'), backgroundColor: AppColors.accent),
                );
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.amber, foregroundColor: AppColors.primary),
              child: const Text('Guardar y Publicar', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _dropdownContainer(Widget child) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10),
      decoration: BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.border),
      ),
      child: DropdownButtonHideUnderline(child: child),
    );
  }

  @override
  Widget build(BuildContext context) {
    final totalEfectivo = _turnos.fold<double>(0.0, (sum, t) => sum + (t.totalRecaudadoEfectivo ?? 0.0));
    final totalCuposOcupados = _turnos.fold<int>(0, (sum, t) => sum + t.cuposOcupados);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          ConductorHeader(
            title: 'Despacho & Administración',
            subtitle: 'Cooperativa Macondo Express · Monitoreo General',
            rolTag: 'Super Administrador',
            showBack: true,
            trailing: IconButton(
              icon: const Icon(Icons.add_circle, color: AppColors.amber),
              tooltip: 'Crear Turno',
              onPressed: _abrirDialogoCrearTurno,
            ),
          ),
          
          // Métricas Generales del Administrador
          Container(
            padding: const EdgeInsets.all(16),
            color: AppColors.surface,
            child: Row(
              children: [
                Expanded(
                  child: _buildAdminMetric(
                    'Pasajeros Hoy',
                    '$totalCuposOcupados',
                    'Cupos Ocupados',
                    Icons.people,
                    AppColors.accentLight,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildAdminMetric(
                    'Recaudación',
                    '\$${totalEfectivo.toStringAsFixed(2)}',
                    'Efectivo Cobrado',
                    Icons.payments,
                    AppColors.amber,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildAdminMetric(
                    'Turnos',
                    '${_turnos.length}',
                    'Salidas Activas',
                    Icons.route,
                    AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),

          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _turnos.length,
              itemBuilder: (ctx, index) {
                final turno = _turnos[index];
                return Container(
                  margin: const EdgeInsets.only(bottom: 14),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '${turno.ruta?.origenCiudad} ➔ ${turno.ruta?.destinoCiudad}',
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.accent.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              turno.estado.toUpperCase(),
                              style: const TextStyle(
                                color: AppColors.accentLight,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Salida: ${turno.horaSalida.substring(0, 5)} · Chofer: ${turno.chofer?.nombreCompleto} (${turno.chofer?.telefono})',
                        style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                      ),
                      Text(
                        'Vehículo: ${turno.vehiculo?.marcaModelo} [${turno.vehiculo?.placa}] · Tipo: ${turno.vehiculo?.tipo.toUpperCase()} (4 cupos)',
                        style: const TextStyle(color: AppColors.textDim, fontSize: 11),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.event_seat, color: AppColors.accent, size: 16),
                              const SizedBox(width: 4),
                              Text(
                                '${turno.cuposOcupados} / 4 Puestos Reservados',
                                style: const TextStyle(
                                  color: AppColors.textPrimary,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                          Text(
                            '\$${turno.totalRecaudadoEfectivo?.toStringAsFixed(2)} Efectivo',
                            style: const TextStyle(
                              color: AppColors.amber,
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _abrirDialogoCrearTurno,
        backgroundColor: AppColors.amber,
        foregroundColor: AppColors.primary,
        icon: const Icon(Icons.add),
        label: const Text('Crear Turno', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildAdminMetric(String title, String val, String desc, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 16),
              const SizedBox(width: 4),
              Text(title, style: const TextStyle(color: AppColors.textDim, fontSize: 10)),
            ],
          ),
          const SizedBox(height: 2),
          Text(val, style: TextStyle(color: color, fontSize: 14, fontWeight: FontWeight.bold)),
          Text(desc, style: const TextStyle(color: AppColors.textDim, fontSize: 9)),
        ],
      ),
    );
  }
}
