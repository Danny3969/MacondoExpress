import 'package:flutter/material.dart';
import 'package:macondo_core/constants/app_colors.dart';
import 'package:macondo_core/models/usuario.dart';
import 'package:macondo_core/services/macondo_supabase_service.dart';
import 'driver_home_screen.dart';
import 'admin_dispatch_screen.dart';

class DriverLoginScreen extends StatefulWidget {
  const DriverLoginScreen({super.key});

  @override
  State<DriverLoginScreen> createState() => _DriverLoginScreenState();
}

class _DriverLoginScreenState extends State<DriverLoginScreen> {
  String _rolSeleccionado = 'chofer'; // 'chofer' o 'admin'
  int _currentStep = 0; // 0 = Teléfono, 1 = OTP, 2 = Perfil Conductor

  String _codigoPais = '+593';
  final _telefonoController = TextEditingController(text: '0991234567');
  final _otpController = TextEditingController();
  final _nombreController = TextEditingController(text: 'Manuel Palacios');
  final _cedulaController = TextEditingController(text: '0703849201');
  final _licenciaController = TextEditingController(text: 'Licencia Tipo C (Profesional)');
  final _placaController = TextEditingController(text: 'ABC-1234');

  bool _isLoading = false;
  final _supabaseService = MacondoSupabaseService();

  @override
  void dispose() {
    _telefonoController.dispose();
    _otpController.dispose();
    _nombreController.dispose();
    _cedulaController.dispose();
    _licenciaController.dispose();
    _placaController.dispose();
    super.dispose();
  }

  // ── PASO 0: Enviar Código OTP de Chofer/Admin ──────────────────────────────
  void _solicitarCodigo() async {
    final telefono = _telefonoController.text.trim();
    if (telefono.length < 9) {
      _mostrarAlerta('Ingrese un número de celular válido para chofer o despacho.');
      return;
    }

    setState(() => _isLoading = true);

    final telefonoNormalizado = telefono.startsWith('0') ? telefono.substring(1) : telefono;
    final telefonoCompleto = '$_codigoPais$telefonoNormalizado';

    await _supabaseService.solicitarOtpTelefono(telefonoCompleto: telefonoCompleto);

    if (mounted) {
      setState(() {
        _isLoading = false;
        _currentStep = 1;
        _otpController.text = '654321'; // Pre-cargado para agilizar testing
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Código de seguridad para $_rolSeleccionado enviado a $telefonoCompleto (Demo: 654321)'),
          backgroundColor: AppColors.amber,
          duration: const Duration(seconds: 4),
        ),
      );
    }
  }

  // ── PASO 1: Validar Código OTP ──────────────────────────────────────────────
  void _verificarCodigo() async {
    final otp = _otpController.text.trim();
    if (otp.length != 6) {
      _mostrarAlerta('El código debe contener 6 dígitos.');
      return;
    }

    setState(() => _isLoading = true);

    final telefono = _telefonoController.text.trim();
    final telefonoNormalizado = telefono.startsWith('0') ? telefono.substring(1) : telefono;

    final usuarioExistente = await _supabaseService.obtenerUsuarioPorTelefono(
      telefono: telefonoNormalizado,
      codigoPais: _codigoPais,
    );

    if (mounted) {
      setState(() => _isLoading = false);

      if (usuarioExistente != null && usuarioExistente.nombreCompleto.isNotEmpty) {
        _entrarAlSistema(usuarioExistente);
      } else {
        // Conductor nuevo -> Paso 2 (Registro con Cédula, Licencia y Placa)
        setState(() => _currentStep = 2);
      }
    }
  }

  // ── PASO 2: Completar Perfil de Chofer ──────────────────────────────────────
  void _completarPerfilChofer() async {
    final nombre = _nombreController.text.trim();
    final cedula = _cedulaController.text.trim();
    final licencia = _licenciaController.text.trim();
    final telefono = _telefonoController.text.trim();
    final telefonoNormalizado = telefono.startsWith('0') ? telefono.substring(1) : telefono;

    if (nombre.isEmpty || cedula.isEmpty || licencia.isEmpty) {
      _mostrarAlerta('Todos los campos son obligatorios para el registro de choferes de la cooperativa.');
      return;
    }

    setState(() => _isLoading = true);

    final nuevoChofer = await _supabaseService.registrarOActualizarUsuarioPorTelefono(
      telefono: telefonoNormalizado,
      codigoPais: _codigoPais,
      nombreCompleto: nombre,
      cedula: cedula,
      rol: _rolSeleccionado,
      licenciaConducir: licencia,
    );

    if (mounted) {
      setState(() => _isLoading = false);
      _entrarAlSistema(nuevoChofer);
    }
  }

  void _entrarAlSistema(Usuario usuario) {
    if (_rolSeleccionado == 'admin') {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => AdminDispatchScreen(adminActual: usuario),
        ),
      );
    } else {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => DriverHomeScreen(choferActual: usuario),
        ),
      );
    }
  }

  void _mostrarAlerta(String mensaje) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(mensaje),
        backgroundColor: Colors.redAccent,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Emblema Conductor / Admin
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: AppColors.amber.withOpacity(0.15),
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.amber, width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.amber.withOpacity(0.25),
                        blurRadius: 20,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.drive_eta,
                    color: AppColors.amber,
                    size: 42,
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'MACONDO EXPRESS',
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 2.0,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Terminal de Choferes & Centro de Despacho',
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 24),

                // Selector de Rol: Chofer vs Administrador
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _rolSeleccionado = 'chofer'),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            decoration: BoxDecoration(
                              color: _rolSeleccionado == 'chofer' ? AppColors.amber : Colors.transparent,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.local_taxi,
                                  size: 16,
                                  color: _rolSeleccionado == 'chofer' ? AppColors.primary : AppColors.textDim,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  'Soy Chofer',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: _rolSeleccionado == 'chofer' ? AppColors.primary : AppColors.textDim,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _rolSeleccionado = 'admin'),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            decoration: BoxDecoration(
                              color: _rolSeleccionado == 'admin' ? AppColors.accent : Colors.transparent,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.admin_panel_settings_outlined,
                                  size: 16,
                                  color: _rolSeleccionado == 'admin' ? AppColors.primary : AppColors.textDim,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  'Despacho / Admin',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: _rolSeleccionado == 'admin' ? AppColors.primary : AppColors.textDim,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Tarjeta de Contenido Dinámica
                Container(
                  padding: const EdgeInsets.all(22),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (_currentStep == 0) _buildStep0Phone(),
                      if (_currentStep == 1) _buildStep1Otp(),
                      if (_currentStep == 2) _buildStep2Profile(),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Paso 0: Celular de Chofer / Admin
  Widget _buildStep0Phone() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          _rolSeleccionado == 'chofer' ? 'ACCESO DE CHOFER REGISTRADO' : 'ACCESO DE DESPACHO & CONTROL',
          style: TextStyle(
            color: _rolSeleccionado == 'chofer' ? AppColors.amber : AppColors.accentLight,
            fontSize: 12,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.1,
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Ingrese el número telefónico asignado a su vehículo o cuenta de operador cooperativo.',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
        ),
        const SizedBox(height: 18),

        Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              decoration: BoxDecoration(
                color: AppColors.surfaceElevated,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _codigoPais,
                  dropdownColor: AppColors.surfaceElevated,
                  items: const [
                    DropdownMenuItem(value: '+593', child: Text('🇪🇨 +593', style: TextStyle(color: Colors.white, fontSize: 13))),
                    DropdownMenuItem(value: '+51', child: Text('🇵🇪 +51', style: TextStyle(color: Colors.white, fontSize: 13))),
                  ],
                  onChanged: (val) {
                    if (val != null) setState(() => _codigoPais = val);
                  },
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: TextField(
                controller: _telefonoController,
                keyboardType: TextInputType.phone,
                style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
                decoration: InputDecoration(
                  labelText: 'Celular Chofer (09...)',
                  labelStyle: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                  prefixIcon: Icon(Icons.phone_iphone, color: _rolSeleccionado == 'chofer' ? AppColors.amber : AppColors.accent, size: 20),
                  filled: true,
                  fillColor: AppColors.surfaceElevated,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 22),

        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _solicitarCodigo,
            style: ElevatedButton.styleFrom(
              backgroundColor: _rolSeleccionado == 'chofer' ? AppColors.amber : AppColors.accent,
              foregroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: _isLoading
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.security, size: 18),
                      const SizedBox(width: 8),
                      Text('Verificar Identidad Telefónica', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    ],
                  ),
          ),
        ),
      ],
    );
  }

  // Paso 1: Código OTP de Chofer
  Widget _buildStep1Otp() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'CÓDIGO DE OPERADOR',
              style: TextStyle(
                color: _rolSeleccionado == 'chofer' ? AppColors.amber : AppColors.accentLight,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
            GestureDetector(
              onTap: () => setState(() => _currentStep = 0),
              child: const Text('Corregir número', style: TextStyle(color: AppColors.amber, fontSize: 11, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          'Código enviado a $_codigoPais ${_telefonoController.text}',
          style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
        ),
        const SizedBox(height: 18),

        TextField(
          controller: _otpController,
          keyboardType: TextInputType.number,
          maxLength: 6,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontSize: 24,
            fontWeight: FontWeight.bold,
            letterSpacing: 10,
          ),
          decoration: InputDecoration(
            counterText: '',
            hintText: '••••••',
            filled: true,
            fillColor: AppColors.surfaceElevated,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        const SizedBox(height: 18),

        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _verificarCodigo,
            style: ElevatedButton.styleFrom(
              backgroundColor: _rolSeleccionado == 'chofer' ? AppColors.amber : AppColors.accent,
              foregroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: _isLoading
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.lock_open, size: 18),
                      SizedBox(width: 8),
                      Text('Validar y Acceder', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    ],
                  ),
          ),
        ),
      ],
    );
  }

  // Paso 2: Registro de Datos de Chofer
  Widget _buildStep2Profile() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'FICHA DE CONDUCTOR COOPERATIVO',
          style: TextStyle(
            color: AppColors.amber,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Ingrese sus datos para vincular su vehículo (auto o camioneta de 4 cupos) a las rutas activas.',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
        ),
        const SizedBox(height: 18),

        TextField(
          controller: _nombreController,
          style: const TextStyle(color: AppColors.textPrimary),
          decoration: InputDecoration(
            labelText: 'Nombres y Apellidos del Chofer *',
            labelStyle: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
            prefixIcon: const Icon(Icons.person, color: AppColors.amber, size: 20),
            filled: true,
            fillColor: AppColors.surfaceElevated,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        const SizedBox(height: 12),

        TextField(
          controller: _cedulaController,
          keyboardType: TextInputType.number,
          style: const TextStyle(color: AppColors.textPrimary),
          decoration: InputDecoration(
            labelText: 'Cédula de Identidad *',
            labelStyle: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
            prefixIcon: const Icon(Icons.badge, color: AppColors.amber, size: 20),
            filled: true,
            fillColor: AppColors.surfaceElevated,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        const SizedBox(height: 12),

        TextField(
          controller: _licenciaController,
          style: const TextStyle(color: AppColors.textPrimary),
          decoration: InputDecoration(
            labelText: 'Tipo de Licencia de Conducir *',
            labelStyle: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
            prefixIcon: const Icon(Icons.card_membership, color: AppColors.amber, size: 20),
            filled: true,
            fillColor: AppColors.surfaceElevated,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        const SizedBox(height: 12),

        TextField(
          controller: _placaController,
          style: const TextStyle(color: AppColors.textPrimary),
          decoration: InputDecoration(
            labelText: 'Placa del Vehículo Asignado (4 cupos)',
            labelStyle: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
            prefixIcon: const Icon(Icons.directions_car, color: AppColors.amber, size: 20),
            filled: true,
            fillColor: AppColors.surfaceElevated,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        const SizedBox(height: 18),

        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _completarPerfilChofer,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.amber,
              foregroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: _isLoading
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.assignment_turned_in, size: 18),
                      SizedBox(width: 8),
                      Text('Registrar Conductor e Iniciar Turno', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    ],
                  ),
          ),
        ),
      ],
    );
  }
}
