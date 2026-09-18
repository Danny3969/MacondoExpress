import 'package:flutter/material.dart';
import 'package:macondo_core/constants/app_colors.dart';
import 'package:macondo_core/models/usuario.dart';
import 'driver_home_screen.dart';
import 'admin_dispatch_screen.dart';

class DriverLoginScreen extends StatefulWidget {
  const DriverLoginScreen({super.key});

  @override
  State<DriverLoginScreen> createState() => _DriverLoginScreenState();
}

class _DriverLoginScreenState extends State<DriverLoginScreen> {
  String _rolSeleccionado = 'chofer'; // 'chofer' o 'admin'
  final _usuarioController = TextEditingController(text: 'Manuel Palacios');
  final _telefonoController = TextEditingController(text: '0991234567');
  bool _isLoading = false;

  void _iniciarSesion() {
    final nombre = _usuarioController.text.trim();
    final telefono = _telefonoController.text.trim();

    if (nombre.isEmpty || telefono.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Por favor complete los datos.')),
      );
      return;
    }

    setState(() => _isLoading = true);

    final usuario = Usuario(
      id: _rolSeleccionado == 'chofer' ? 'chf-01' : 'adm-01',
      nombreCompleto: nombre,
      telefono: telefono,
      rol: _rolSeleccionado,
      email: '${telefono}@macondoexpress.ec',
    );

    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) {
        setState(() => _isLoading = false);
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
                // Logo & Emblema Conductor / Admin
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
                  'Portal Operativo de Choferes & Despacho',
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                ),
                const SizedBox(height: 30),

                // Selector de Rol: Conductor vs Administrador
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
                        child: _buildRoleButton(
                          'Chofer / Conductor',
                          'chofer',
                          Icons.airline_seat_recline_extra,
                        ),
                      ),
                      Expanded(
                        child: _buildRoleButton(
                          'Administrador',
                          'admin',
                          Icons.admin_panel_settings,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Formulario de Ingreso
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
                      Text(
                        _rolSeleccionado == 'chofer'
                            ? 'ACCESO DE CONDUCTOR ASIGNADO'
                            : 'ACCESO DE ADMINISTRACIÓN Y DESPACHO',
                        style: const TextStyle(
                          color: AppColors.amber,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.0,
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _usuarioController,
                        style: const TextStyle(color: AppColors.textPrimary),
                        decoration: InputDecoration(
                          labelText: 'Nombre Completo',
                          labelStyle: const TextStyle(color: AppColors.textSecondary),
                          prefixIcon: const Icon(Icons.person_outline, color: AppColors.amber),
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
                          labelText: 'Número Telefónico',
                          labelStyle: const TextStyle(color: AppColors.textSecondary),
                          prefixIcon: const Icon(Icons.phone_iphone, color: AppColors.amber),
                          filled: true,
                          fillColor: AppColors.surfaceElevated,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                      const SizedBox(height: 22),
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: ElevatedButton(
                          onPressed: _isLoading ? null : _iniciarSesion,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.amber,
                            foregroundColor: AppColors.primary,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: _isLoading
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                                )
                              : Text(
                                  _rolSeleccionado == 'chofer'
                                      ? 'Ingresar al Turno'
                                      : 'Ingresar a Panel de Despacho',
                                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Unidades de 4 pasajeros · Recaudación 100% Efectivo',
                  style: TextStyle(color: AppColors.textDim, fontSize: 12),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRoleButton(String label, String rol, IconData icon) {
    final isSelected = _rolSeleccionado == rol;
    return GestureDetector(
      onTap: () {
        setState(() {
          _rolSeleccionado = rol;
          if (rol == 'admin') {
            _usuarioController.text = 'Admin Cooperativa';
            _telefonoController.text = '0999001122';
          } else {
            _usuarioController.text = 'Manuel Palacios';
            _telefonoController.text = '0991234567';
          }
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.surfaceElevated : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? AppColors.amber : Colors.transparent,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 16,
              color: isSelected ? AppColors.amber : AppColors.textSecondary,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? AppColors.textPrimary : AppColors.textSecondary,
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
