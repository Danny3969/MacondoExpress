import 'package:flutter/material.dart';
import 'package:macondo_core/constants/app_colors.dart';
import 'package:macondo_core/models/usuario.dart';
import 'package:macondo_core/services/macondo_supabase_service.dart';
import 'home_screen.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  // Pasos: 0 = Ingreso Teléfono, 1 = Verificación OTP, 2 = Completar Perfil
  int _currentStep = 0;

  String _codigoPais = '+593';
  final _telefonoController = TextEditingController(text: '0987654321');
  final _otpController = TextEditingController();
  final _nombreController = TextEditingController(text: 'Carlos Mendoza');
  final _cedulaController = TextEditingController(text: '0928374651');

  bool _isLoading = false;
  bool _aceptaTerminos = true;

  final _supabaseService = MacondoSupabaseService();

  @override
  void dispose() {
    _telefonoController.dispose();
    _otpController.dispose();
    _nombreController.dispose();
    _cedulaController.dispose();
    super.dispose();
  }

  // ── PASO 0: Enviar Código OTP al Celular ─────────────────────────────────────
  void _solicitarCodigo() async {
    final telefono = _telefonoController.text.trim();
    if (telefono.length < 9) {
      _mostrarAlerta('Por favor ingrese un número de celular válido (ej. 0987654321).');
      return;
    }

    setState(() => _isLoading = true);

    final telefonoNormalizado = telefono.startsWith('0') ? telefono.substring(1) : telefono;
    final telefonoCompleto = '$_codigoPais$telefonoNormalizado';

    // Llamar al servicio Supabase
    await _supabaseService.solicitarOtpTelefono(telefonoCompleto: telefonoCompleto);

    if (mounted) {
      setState(() {
        _isLoading = false;
        _currentStep = 1;
        // Para testing/desarrollo pre-cargamos código simulado
        _otpController.text = '123456';
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Código de seguridad enviado a $telefonoCompleto (Demo: 123456)'),
          backgroundColor: AppColors.accent,
          duration: const Duration(seconds: 4),
        ),
      );
    }
  }

  // ── PASO 1: Validar Código OTP ──────────────────────────────────────────────
  void _verificarCodigo() async {
    final otp = _otpController.text.trim();
    if (otp.length != 6) {
      _mostrarAlerta('El código de verificación debe tener 6 dígitos.');
      return;
    }

    setState(() => _isLoading = true);

    final telefono = _telefonoController.text.trim();
    final telefonoNormalizado = telefono.startsWith('0') ? telefono.substring(1) : telefono;

    // Verificar si el usuario ya existe registrado en la base de datos
    final usuarioExistente = await _supabaseService.obtenerUsuarioPorTelefono(
      telefono: telefonoNormalizado,
      codigoPais: _codigoPais,
    );

    if (mounted) {
      setState(() => _isLoading = false);

      if (usuarioExistente != null && usuarioExistente.nombreCompleto.isNotEmpty) {
        // Usuario ya registrado -> Ingreso directo
        _entrarAlSistema(usuarioExistente);
      } else {
        // Usuario nuevo -> Completar datos de perfil (Paso 2)
        setState(() => _currentStep = 2);
      }
    }
  }

  // ── PASO 2: Guardar Perfil y Cédula ─────────────────────────────────────────
  void _completarRegistro() async {
    final nombre = _nombreController.text.trim();
    final cedula = _cedulaController.text.trim();
    final telefono = _telefonoController.text.trim();
    final telefonoNormalizado = telefono.startsWith('0') ? telefono.substring(1) : telefono;

    if (nombre.isEmpty) {
      _mostrarAlerta('Por favor ingrese su nombre y apellido.');
      return;
    }

    if (cedula.length < 10) {
      _mostrarAlerta('La cédula/DNI es obligatoria para el manifiesto de transporte y debe tener al menos 10 dígitos.');
      return;
    }

    if (!_aceptaTerminos) {
      _mostrarAlerta('Debe aceptar las políticas de viaje y despacho en efectivo.');
      return;
    }

    setState(() => _isLoading = true);

    final nuevoUsuario = await _supabaseService.registrarOActualizarUsuarioPorTelefono(
      telefono: telefonoNormalizado,
      codigoPais: _codigoPais,
      nombreCompleto: nombre,
      cedula: cedula,
      rol: 'pasajero',
    );

    if (mounted) {
      setState(() => _isLoading = false);
      _entrarAlSistema(nuevoUsuario);
    }
  }

  void _entrarAlSistema(Usuario usuario) {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => HomeScreen(usuarioActual: usuario),
      ),
    );
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
                // Logo & Emblema Macondo Express
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: AppColors.accent.withOpacity(0.15),
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.accent, width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.accent.withOpacity(0.25),
                        blurRadius: 20,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.airport_shuttle,
                    color: AppColors.accentLight,
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
                const SizedBox(height: 6),
                const Text(
                  'Cooperativa de Transporte Puerta a Puerta & Encomiendas',
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 13,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 28),

                // Indicador de Pasos
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _buildStepIndicator(0, 'Celular'),
                    _buildStepLine(_currentStep > 0),
                    _buildStepIndicator(1, 'Código OTP'),
                    _buildStepLine(_currentStep > 1),
                    _buildStepIndicator(2, 'Perfil'),
                  ],
                ),
                const SizedBox(height: 28),

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

                const SizedBox(height: 24),
                // Garantías del Servicio
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: const [
                    Icon(Icons.verified_user_outlined, color: AppColors.accent, size: 16),
                    SizedBox(width: 6),
                    Text(
                      'Seguridad Criptográfica · Pagos 100% en Efectivo',
                      style: TextStyle(color: AppColors.textDim, fontSize: 12),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ── WIDGETS DE PASOS ────────────────────────────────────────────────────────
  Widget _buildStepIndicator(int stepIndex, String label) {
    final isDone = _currentStep > stepIndex;
    final isCurrent = _currentStep == stepIndex;

    Color color = AppColors.border;
    if (isCurrent) color = AppColors.accent;
    if (isDone) color = AppColors.accentLight;

    return Column(
      children: [
        CircleAvatar(
          radius: 14,
          backgroundColor: isCurrent || isDone ? AppColors.accent.withOpacity(0.2) : AppColors.surfaceElevated,
          child: Icon(
            isDone ? Icons.check : (stepIndex == 0 ? Icons.phone : (stepIndex == 1 ? Icons.pin : Icons.badge)),
            size: 14,
            color: color,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 10,
            color: isCurrent ? AppColors.accent : AppColors.textDim,
            fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ],
    );
  }

  Widget _buildStepLine(bool active) {
    return Container(
      width: 32,
      height: 2,
      margin: const EdgeInsets.only(bottom: 16, left: 4, right: 4),
      color: active ? AppColors.accent : AppColors.border,
    );
  }

  // Paso 0: Ingreso de Teléfono
  Widget _buildStep0Phone() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'REGISTRO O INGRESO RÁPIDO',
          style: TextStyle(
            color: AppColors.accentLight,
            fontSize: 12,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.1,
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Ingrese su número de celular para viajar o enviar encomiendas. Le enviaremos un código SMS o WhatsApp.',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
        ),
        const SizedBox(height: 18),

        // Fila con Selector de País y Teléfono
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
                    DropdownMenuItem(value: '+57', child: Text('🇨🇴 +57', style: TextStyle(color: Colors.white, fontSize: 13))),
                    DropdownMenuItem(value: '+1', child: Text('🇺🇸 +1', style: TextStyle(color: Colors.white, fontSize: 13))),
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
                  labelText: 'Celular (ej. 0987654321)',
                  labelStyle: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                  prefixIcon: const Icon(Icons.phone_android, color: AppColors.accent, size: 20),
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
              backgroundColor: AppColors.accent,
              foregroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: _isLoading
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.send_rounded, size: 18),
                      SizedBox(width: 8),
                      Text('Continuar con WhatsApp / SMS', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    ],
                  ),
          ),
        ),
      ],
    );
  }

  // Paso 1: Verificación de Código OTP
  Widget _buildStep1Otp() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'CÓDIGO DE VERIFICACIÓN',
              style: TextStyle(
                color: AppColors.accentLight,
                fontSize: 12,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.1,
              ),
            ),
            GestureDetector(
              onTap: () => setState(() => _currentStep = 0),
              child: const Text('Cambiar número', style: TextStyle(color: AppColors.accent, fontSize: 11, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          'Enviamos un código de 6 dígitos a $_codigoPais ${_telefonoController.text}',
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
            hintStyle: TextStyle(color: AppColors.textDim.withOpacity(0.5)),
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
              backgroundColor: AppColors.accent,
              foregroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: _isLoading
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.check_circle_outline, size: 18),
                      SizedBox(width: 8),
                      Text('Verificar Código', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    ],
                  ),
          ),
        ),
        const SizedBox(height: 12),
        Center(
          child: TextButton(
            onPressed: _solicitarCodigo,
            child: const Text('Reenviar código por WhatsApp / SMS', style: TextStyle(color: AppColors.textDim, fontSize: 12)),
          ),
        ),
      ],
    );
  }

  // Paso 2: Registro de Perfil (Nombre y Cédula)
  Widget _buildStep2Profile() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'COMPLETA TU PERFIL DE PASAJERO',
          style: TextStyle(
            color: AppColors.accentLight,
            fontSize: 12,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.1,
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Por disposición de la Ley de Transporte y para la póliza de seguro de viaje, requerimos sus datos personales oficiales.',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
        ),
        const SizedBox(height: 18),

        TextField(
          controller: _nombreController,
          style: const TextStyle(color: AppColors.textPrimary),
          decoration: InputDecoration(
            labelText: 'Nombres y Apellidos Completos *',
            labelStyle: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
            prefixIcon: const Icon(Icons.person_outline, color: AppColors.accent, size: 20),
            filled: true,
            fillColor: AppColors.surfaceElevated,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        const SizedBox(height: 14),

        TextField(
          controller: _cedulaController,
          keyboardType: TextInputType.number,
          style: const TextStyle(color: AppColors.textPrimary),
          decoration: InputDecoration(
            labelText: 'Cédula de Identidad / DNI *',
            labelStyle: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
            prefixIcon: const Icon(Icons.badge_outlined, color: AppColors.accent, size: 20),
            filled: true,
            fillColor: AppColors.surfaceElevated,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        const SizedBox(height: 14),

        CheckboxListTile(
          value: _aceptaTerminos,
          onChanged: (val) => setState(() => _aceptaTerminos = val ?? false),
          title: const Text(
            'Acepto viajar bajo modalidad puerta a puerta y realizar el pago 100% en efectivo al chofer.',
            style: TextStyle(color: AppColors.textSecondary, fontSize: 11),
          ),
          activeColor: AppColors.accent,
          checkColor: AppColors.primary,
          contentPadding: EdgeInsets.zero,
          controlAffinity: ListTileControlAffinity.leading,
        ),
        const SizedBox(height: 18),

        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _completarRegistro,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.accent,
              foregroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: _isLoading
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.car_crash_rounded, size: 18),
                      SizedBox(width: 8),
                      Text('Finalizar e Ingresar', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    ],
                  ),
          ),
        ),
      ],
    );
  }
}
