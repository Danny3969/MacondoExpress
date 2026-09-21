/// Utilidades de Validación para Macondo Express
/// Implementa reglas oficiales ecuatorianas (ANT, Registro Civil) y controles antifraude.
class Validadores {
  Validadores._();

  /// Valida cédula de identidad ecuatoriana de 10 dígitos usando el algoritmo oficial de Módulo 10.
  /// Retorna true si la cédula es matemáticamente válida.
  static bool validarCedulaEcuatoriana(String? cedula) {
    if (cedula == null) return false;
    final limpia = cedula.replaceAll(RegExp(r'\D'), '');
    if (limpia.length != 10) return false;

    // Verificar código de provincia (primeros dos dígitos entre 01 y 24, o 30)
    final provincia = int.tryParse(limpia.substring(0, 2)) ?? 0;
    if (!((provincia >= 1 && provincia <= 24) || provincia == 30)) {
      return false;
    }

    // Tercer dígito debe ser menor a 6 para personas naturales
    final tercerDigito = int.tryParse(limpia[2]) ?? 9;
    if (tercerDigito >= 6) {
      return false;
    }

    // Coeficientes Módulo 10
    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    int suma = 0;

    for (int i = 0; i < 9; i++) {
      int valor = (int.tryParse(limpia[i]) ?? 0) * coeficientes[i];
      if (valor >= 10) {
        valor -= 9;
      }
      suma += valor;
    }

    final digitoVerificadorCalculado = (10 - (suma % 10)) % 10;
    final digitoVerificadorReal = int.tryParse(limpia[9]) ?? -1;

    return digitoVerificadorCalculado == digitoVerificadorReal;
  }

  /// Valida número de celular ecuatoriano (ej. 0987654321, 987654321 o +593987654321)
  static bool validarTelefonoEcuador(String? telefono) {
    if (telefono == null) return false;
    final limpio = telefono.replaceAll(RegExp(r'\D'), '');

    // Formato con código país: 5939XXXXXXXX (12 dígitos)
    if (limpio.startsWith('5939') && limpio.length == 12) {
      return true;
    }

    // Formato nacional con cero inicial: 09XXXXXXXX (10 dígitos)
    if (limpio.startsWith('09') && limpio.length == 10) {
      return true;
    }

    // Formato nacional sin cero inicial: 9XXXXXXXX (9 dígitos)
    if (limpio.startsWith('9') && limpio.length == 9) {
      return true;
    }

    return false;
  }

  /// Normaliza un número celular a formato internacional E.164: +5939XXXXXXXX
  static String normalizarTelefonoE164(String telefono, {String codigoPais = '+593'}) {
    String limpio = telefono.replaceAll(RegExp(r'\D'), '');
    if (limpio.startsWith('593')) {
      return '+$limpio';
    }
    if (limpio.startsWith('0')) {
      limpio = limpio.substring(1);
    }
    final prefix = codigoPais.startsWith('+') ? codigoPais : '+$codigoPais';
    return '$prefix$limpio';
  }

  /// Valida placa vehicular ecuatoriana (3 letras + 3 o 4 números, ej. GBA-4123, PBA-321)
  static bool validarPlacaEcuador(String? placa) {
    if (placa == null) return false;
    final limpia = placa.trim().toUpperCase().replaceAll(' ', '-');
    final regExp = RegExp(r'^[A-Z]{3}-\d{3,4}$');
    return regExp.hasMatch(limpia);
  }

  /// Valida el PIN de abordaje de 4 dígitos numéricos
  static bool validarPinAbordaje(String? pin) {
    if (pin == null) return false;
    final limpio = pin.trim();
    return RegExp(r'^\d{4}$').hasMatch(limpio);
  }

  /// Genera un PIN aleatorio de abordaje de 4 dígitos (ej. "4821")
  static String generarPinAbordaje() {
    final now = DateTime.now().microsecondsSinceEpoch;
    final pin = (now % 9000 + 1000).toString();
    return pin;
  }

  /// Formatea monto en dólares estadounidenses (USD)
  static String formatearDolares(double monto) {
    return '\$${monto.toStringAsFixed(2)}';
  }
}
