---
name: auto-github-sync
description: "Sincroniza y empuja automáticamente a GitHub todos los cambios, creaciones, refactorizaciones o actualizaciones realizadas en el código, documentación o activos de proyectos actuales y futuros, de forma autónoma y continua, sin solicitar confirmación manual al usuario."
---

# Autonomous GitHub Sync (Auto-Sync Proactivo)

## 1. Principio Rector & Misión

Este skill establece una directiva obligatoria de **sincronización y persistencia continua con GitHub**:

> **Regla de Oro:** Cada vez que el agente complete una unidad de trabajo (nueva funcionalidad, corrección de errores, refactorización, creación de activos visuales, actualización de documentación o inicialización de un nuevo proyecto), debe **confirmar y subir automáticamente los cambios a GitHub (`git add`, `git commit`, `git push`)** sin esperar una solicitud explícita ni pedir autorización manual al usuario.

---

## 2. Cuándo Ejecutar el Ciclo de Auto-Sync

El agente debe disparar automáticamente el ciclo de sincronización en las siguientes situaciones:

1. **Al finalizar la edición o creación de código:** Tras implementar una pantalla, módulo, servicio, endpoint o componente.
2. **Al actualizar activos, branding o documentación:** Tras generar o modificar imágenes, SVG, manuales, portales web o especificaciones.
3. **Al completar una fase de refactorización o corrección de bugs:** Tras verificar que los tests pasen y el código sea estable.
4. **Al crear un nuevo proyecto o repositorio:** Inicializar `git`, crear un `.gitignore` robusto, realizar el commit inicial y conectarlo con el remote correspondiente.
5. **Antes de cerrar o dar por concluido un turno de conversación:** Garantizar que el árbol de trabajo local quede limpio (`working tree clean`) y sincronizado con la rama remota (`origin/main` u `origin/<branch>`).

---

## 3. Protocolo de Ejecución de 4 Pasos

Para cada sincronización, ejecuta de forma autónoma los siguientes comandos en el directorio del proyecto correspondiente:

### Paso 1: Inspección Previa & Limpieza de Temporales
```bash
# Limpiar archivos de prueba temporales si los hubiera (*.tmp, test.png, scratch scratchpads)
git status
```
*Verificar que no existan archivos residuales innecesarios antes del staging.*

### Paso 2: Preparación (Staging) & Control de Secretos
```bash
# Agregar archivos modificados y nuevos
git add .
```
> [!CAUTION]
> **Higiene de Seguridad Absoluta:**
> - NUNCA añadir archivos `.env` con claves reales, credenciales privadas, tokens de API o certificados de producción.
> - Asegurarse de que el archivo `.gitignore` cubra `node_modules/`, `venv/`, `.DS_Store`, `build/`, `*.log`, y secretos.

### Paso 3: Commit Semántico Riguroso (Conventional Commits)
Redactar un mensaje de commit claro, descriptivo y profesional en español o inglés siguiendo la convención estándar:

* `feat(<módulo>): descripción concisa de la nueva funcionalidad añadida`
* `fix(<módulo>): resolución del problema o corrección de error`
* `refactor(<módulo>): optimización o reestructuración de código sin alterar comportamiento`
* `docs(<módulo>): adición o actualización de documentación, diagramas o manuales`
* `perf(<módulo>): mejora de rendimiento, optimización de consultas o caché`

```bash
git commit -m "feat(modulo): descripción clara del cambio realizado"
```

### Paso 4: Empuje Autónomo (Push) a GitHub
```bash
git push origin <rama-activa>
# Ejemplo: git push origin main
```
*Verificar que el código de salida sea 0 y que el árbol remoto quede actualizado.*

---

## 4. Gestión de Proyectos Nuevos

Si se crea un nuevo directorio o proyecto dentro del espacio de trabajo:

1. Ejecutar `git init`.
2. Crear un `.gitignore` adaptado al stack tecnológico (Flutter, Python, Node, etc.).
3. Crear el `README.md` explicativo del proyecto.
4. Realizar el primer commit: `git commit -m "chore: initial commit"`.
5. Si existe un repositorio remoto asignado en la cuenta de GitHub del usuario (ej. `Danny3969`), configurar el remote:
   ```bash
   git remote add origin git@github.com:Danny3969/<NombreProyecto>.git
   git push -u origin main
   ```

---

## 5. Regla de Cierre de Turno

En la respuesta final al usuario, reportar brevemente el estado de la sincronización con:
- Hash abreviado del commit.
- Mensaje del commit.
- Rama y repositorio al que fue subido.
- Confirmación de que el árbol de trabajo local ha quedado limpio.
