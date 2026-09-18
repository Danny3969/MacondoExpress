import 'package:flutter/material.dart';
import 'package:macondo_core/constants/app_colors.dart';
import 'package:macondo_core/models/usuario.dart';
import 'home_screen.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _nombreController = TextEditingController(text: 'Carlos Mendoza');
  final _telefonoController = TextEditingController(text: '0987654321');
  bool _isLoading = false;

  void _ingresar() {
    final nombre = _nombreController.text.trim();
    final telefono = _telefonoController.text.trim();

    if (nombre.isEmpty || telefono.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Por favor ingrese su nombre y teléfono.')),
      );
      return;
    }

    setState(() => _isLoading = true);

    // Mock/Sesión rápida de pasajero
    final pasajeroActual = Usuario(
      id: 'usr-pasajero-demo-01',
      nombreCompleto: nombre,
      telefono: telefono,
      rol: 'pasajero',
      email: '${telefono}@macondoexpress.ec',
    );

    Future.delayed(const Duration(milliseconds: 600), () {
      if (mounted) {
        setState(() => _isLoading = false);
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => HomeScreen(usuarioActual: pasajeroActual),
          ),
        );
      }
    });
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
                        color: AppColors.accent.withOpacity(0.2),
                        blurRadius: 20,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.airport_shuttle,
                    color: AppColors.accentLight,
                    size: 44,
                  ),
                ),
                const SizedBox(height: 18),
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
                const SizedBox(height: 36),

                // Tarjeta de Ingreso Rápido
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
                      const Text(
                        'INGRESO DE PASAJERO',
                        style: TextStyle(
                          color: AppColors.accentLight,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.1,
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _nombreController,
                        style: const TextStyle(color: AppColors.textPrimary),
                        decoration: InputDecoration(
                          labelText: 'Nombre y Apellido',
                          labelStyle: const TextStyle(color: AppColors.textSecondary),
                          prefixIcon: const Icon(Icons.person_outline, color: AppColors.accent),
                          filled: true,
                          fillColor: AppColors.surfaceElevated,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                      const SizedBox(height: 14),
                      TextField(
                        controller: _telefonoController,
                        keyboardType: TextInputType.phone,
                        style: const TextStyle(color: AppColors.textPrimary),
                        decoration: InputDecoration(
                          labelText: 'Teléfono Celular (WhatsApp)',
                          labelStyle: const TextStyle(color: AppColors.textSecondary),
                          prefixIcon: const Icon(Icons.phone_iphone, color: AppColors.accent),
                          filled: true,
                          fillColor: AppColors.surfaceElevated,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: ElevatedButton(
                          onPressed: _isLoading ? null : _ingresar,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.accent,
                            foregroundColor: AppColors.primary,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: _isLoading
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Text(
                                  'Ingresar a Macondo Express',
                                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                
                // Nota informativa: Efectivo y Servicio
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: const [
                    Icon(Icons.payments_outlined, color: AppColors.amber, size: 16),
                    SizedBox(width: 6),
                    Text(
                      'Pagos 100% en Efectivo al Abordar o Recoger',
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
}
