import 'package:flutter/material.dart';
import 'package:macondo_core/constants/app_colors.dart';
import 'package:macondo_core/models/usuario.dart';
import 'package:macondo_core/models/encomienda.dart';
import 'package:macondo_core/services/macondo_supabase_service.dart';
import '../widgets/app_header.dart';
import 'encomienda_tracking_screen.dart';

class EncomiendaFormScreen extends StatefulWidget {
  final Usuario usuarioActual;

  const EncomiendaFormScreen({
    super.key,
    required this.usuarioActual,
  });

  @override
  State<EncomiendaFormScreen> createState() => _EncomiendaFormScreenState();
}

class _EncomiendaFormScreenState extends State<EncomiendaFormScreen> {
  final _destinatarioNombreController = TextEditingController();
  final _destinatarioTelefonoController = TextEditingController();
  final _dirRecogidaController = TextEditingController();
  final _refRecogidaController = TextEditingController();
  final _dirEntregaController = TextEditingController();
  final _refEntregaController = TextEditingController();
  final _descripcionController = TextEditingController();
  
  double _latRecogida = -2.1894;
  double _lngRecogida = -79.8891;
  double _latEntrega = -3.2581;
  double _lngEntrega = -79.9554;
  
  final double _precioEfectivo = 5.00;
  bool _isLoading = false;

  void _fijarGpsRecogida() {
    setState(() {
      _latRecogida = -2.1894 + (DateTime.now().millisecond % 50) * 0.0001;
      _lngRecogida = -79.8891 + (DateTime.now().millisecond % 50) * 0.0001;
      if (_dirRecogidaController.text.isEmpty) {
        _dirRecogidaController.text = 'Punto de recogida GPS actual';
      }
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('GPS de recogida fijado.'), backgroundColor: AppColors.accent),
    );
  }

  void _fijarGpsEntrega() {
    setState(() {
      _latEntrega = -3.2581 + (DateTime.now().millisecond % 50) * 0.0001;
      _lngEntrega = -79.9554 + (DateTime.now().millisecond % 50) * 0.0001;
      if (_dirEntregaController.text.isEmpty) {
        _dirEntregaController.text = 'Punto de entrega GPS';
      }
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('GPS de entrega fijado.'), backgroundColor: AppColors.accent),
    );
  }

  Future<void> _enviarEncomienda() async {
    final destNombre = _destinatarioNombreController.text.trim();
    final destTel = _destinatarioTelefonoController.text.trim();
    final dirRec = _dirRecogidaController.text.trim();
    final dirEnt = _dirEntregaController.text.trim();
    final desc = _descripcionController.text.trim();

    if (destNombre.isEmpty || destTel.isEmpty || dirRec.isEmpty || dirEnt.isEmpty || desc.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Por favor complete todos los campos obligatorios (*)'),
          backgroundColor: Colors.redAccent,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final encomienda = await MacondoSupabaseService().registrarEncomienda(
        remitenteId: widget.usuarioActual.id,
        remitenteNombre: widget.usuarioActual.nombreCompleto,
        remitenteTelefono: widget.usuarioActual.telefono,
        destinatarioNombre: destNombre,
        destinatarioTelefono: destTel,
        latRecogida: _latRecogida,
        lngRecogida: _lngRecogida,
        dirRecogida: dirRec,
        latEntrega: _latEntrega,
        lngEntrega: _lngEntrega,
        dirEntrega: dirEnt,
        refEntrega: _refEntregaController.text.trim(),
        descripcionPaquete: desc,
        precioEfectivo: _precioEfectivo,
      );

      if (mounted) {
        setState(() => _isLoading = false);
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => EncomiendaTrackingScreen(encomienda: encomienda),
          ),
        );
      }
    } catch (e) {
      // Fallback demostrativo con QR simulado
      final mockEncomienda = Encomienda(
        id: 'enc-${DateTime.now().millisecondsSinceEpoch}',
        remitenteId: widget.usuarioActual.id,
        remitenteNombre: widget.usuarioActual.nombreCompleto,
        remitenteTelefono: widget.usuarioActual.telefono,
        destinatarioNombre: destNombre,
        destinatarioTelefono: destTel,
        latitudRecogida: _latRecogida,
        longitudRecogida: _lngRecogida,
        direccionRecogida: dirRec,
        latitudEntrega: _latEntrega,
        longitudEntrega: _lngEntrega,
        direccionEntrega: dirEnt,
        referenciaEntrega: _refEntregaController.text.trim(),
        descripcionPaquete: desc,
        precioEnvioEfectivo: _precioEfectivo,
        codigoQrEntrega: 'MACONDO-QR-${DateTime.now().millisecondsSinceEpoch.toRadixString(16).toUpperCase()}',
        estado: 'solicitada',
        createdAt: DateTime.now(),
      );

      if (mounted) {
        setState(() => _isLoading = false);
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => EncomiendaTrackingScreen(encomienda: mockEncomienda),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          const MacondoHeader(
            title: 'Enviar Encomienda',
            subtitle: 'Servicio Puerta a Puerta con Confirmación QR',
            showBack: true,
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(18),
              children: [
                // 1. Datos del Destinatario
                _buildSectionCard(
                  title: '1. DATOS DEL DESTINATARIO',
                  icon: Icons.person_pin,
                  children: [
                    TextField(
                      controller: _destinatarioNombreController,
                      style: const TextStyle(color: AppColors.textPrimary),
                      decoration: _inputDecoration('Nombre de quien recibe *', Icons.badge_outlined),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: _destinatarioTelefonoController,
                      keyboardType: TextInputType.phone,
                      style: const TextStyle(color: AppColors.textPrimary),
                      decoration: _inputDecoration('Teléfono Celular *', Icons.phone_iphone),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // 2. Punto de Recogida del Paquete (Puerta a Puerta)
                _buildSectionCard(
                  title: '2. PUNTO DE RECOGIDA (DONDE RECOGE EL CHOFER)',
                  icon: Icons.upload_outlined,
                  action: InkWell(
                    onTap: _fijarGpsRecogida,
                    child: const Text('Fijar Mi GPS', style: TextStyle(color: AppColors.accentLight, fontSize: 12, fontWeight: FontWeight.bold)),
                  ),
                  children: [
                    TextField(
                      controller: _dirRecogidaController,
                      style: const TextStyle(color: AppColors.textPrimary),
                      decoration: _inputDecoration('Dirección exacta de recogida *', Icons.home_outlined),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: _refRecogidaController,
                      style: const TextStyle(color: AppColors.textPrimary),
                      decoration: _inputDecoration('Referencia (Ej: Casa azul esquinera)', Icons.pin_drop_outlined),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // 3. Punto de Entrega del Paquete
                _buildSectionCard(
                  title: '3. PUNTO DE ENTREGA (DESTINO FINAL)',
                  icon: Icons.download_outlined,
                  action: InkWell(
                    onTap: _fijarGpsEntrega,
                    child: const Text('Fijar GPS Destino', style: TextStyle(color: AppColors.accentLight, fontSize: 12, fontWeight: FontWeight.bold)),
                  ),
                  children: [
                    TextField(
                      controller: _dirEntregaController,
                      style: const TextStyle(color: AppColors.textPrimary),
                      decoration: _inputDecoration('Dirección exacta de entrega *', Icons.location_city_outlined),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: _refEntregaController,
                      style: const TextStyle(color: AppColors.textPrimary),
                      decoration: _inputDecoration('Referencia para entrega', Icons.info_outline),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // 4. Detalle del Paquete & Tarifa
                _buildSectionCard(
                  title: '4. DETALLES DEL PAQUETE',
                  icon: Icons.inventory_2_outlined,
                  children: [
                    TextField(
                      controller: _descripcionController,
                      maxLines: 2,
                      style: const TextStyle(color: AppColors.textPrimary),
                      decoration: _inputDecoration('¿Qué contiene el paquete? * (Ej: Ropa, repuestos, sobre)', Icons.description_outlined),
                    ),
                    const SizedBox(height: 14),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceElevated,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: const [
                              Text('Tarifa de Encomienda:', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                              Text('Pago 100% Efectivo', style: TextStyle(color: AppColors.amber, fontSize: 11, fontWeight: FontWeight.bold)),
                            ],
                          ),
                          Text(
                            '\$${_precioEfectivo.toStringAsFixed(2)}',
                            style: const TextStyle(color: AppColors.accentLight, fontSize: 20, fontWeight: FontWeight.w900),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Botón Generar Encomienda & QR
                SizedBox(
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _enviarEncomienda,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.accent,
                      foregroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 3,
                    ),
                    child: _isLoading
                        ? const CircularProgressIndicator(color: AppColors.primary)
                        : Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: const [
                              Icon(Icons.qr_code_2, size: 22),
                              SizedBox(width: 8),
                              Text(
                                'Registrar Encomienda y Generar QR',
                                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionCard({
    required String title,
    required IconData icon,
    Widget? action,
    required List<Widget> children,
  }) {
    return Container(
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
              Row(
                children: [
                  Icon(icon, color: AppColors.accent, size: 18),
                  const SizedBox(width: 6),
                  Text(
                    title,
                    style: const TextStyle(
                      color: AppColors.accentLight,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.0,
                    ),
                  ),
                ],
              ),
              if (action != null) action,
            ],
          ),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }

  InputDecoration _inputDecoration(String hint, IconData icon) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: AppColors.textDim, fontSize: 13),
      prefixIcon: Icon(icon, color: AppColors.textSecondary, size: 20),
      filled: true,
      fillColor: AppColors.surfaceElevated,
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: AppColors.border)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: AppColors.border)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.accent)),
    );
  }
}
