import 'package:flutter/material.dart';
import 'package:macondo_core/constants/app_colors.dart';
import 'screens/driver_login_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MacondoConductorApp());
}

class MacondoConductorApp extends StatelessWidget {
  const MacondoConductorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Macondo Express · Conductor & Despacho',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: AppColors.background,
        primaryColor: AppColors.amber,
        colorScheme: const ColorScheme.dark(
          primary: AppColors.amber,
          secondary: AppColors.accent,
          surface: AppColors.surface,
          background: AppColors.background,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: AppColors.surface,
          elevation: 0,
        ),
        useMaterial3: true,
      ),
      home: const DriverLoginScreen(),
    );
  }
}
