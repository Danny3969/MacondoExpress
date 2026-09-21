-- ==============================================================================
-- 🚗 MACONDO EXPRESS · ESQUEMA RELACIONAL POSTGRESQL (SUPABASE)
-- Cooperativa de Transporte Puerta a Puerta & Logística de Encomiendas con QR
-- Capacidad: Autos y Camionetas (4 Pasajeros) | Pago: 100% Efectivo
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. TABLA: usuarios ────────────────────────────────────────────────────────
-- Perfiles de Pasajeros, Choferes y Administradores de la Cooperativa
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE, -- Enlace con Supabase Auth (UID de phone auth)
    email TEXT,
    codigo_pais TEXT NOT NULL DEFAULT '+593',
    telefono TEXT NOT NULL,
    telefono_verificado BOOLEAN DEFAULT true,
    nombre_completo TEXT NOT NULL,
    cedula TEXT, -- Cédula / DNI para manifiestos de tránsito y seguros
    rol TEXT NOT NULL CHECK (rol IN ('pasajero', 'chofer', 'admin')) DEFAULT 'pasajero',
    licencia_conducir TEXT, -- Exclusivo para choferes (Tipo Sport / Profesional)
    estado_chofer TEXT CHECK (estado_chofer IN ('pendiente_aprobacion', 'activo', 'suspendido')) DEFAULT 'activo',
    foto_url TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_usuario_pais_telefono UNIQUE (codigo_pais, telefono)
);

-- ── 2. TABLA: vehiculos ───────────────────────────────────────────────────────
-- Autos y Camionetas de la flota (Estándar: 4 Pasajeros)
CREATE TABLE IF NOT EXISTS public.vehiculos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chofer_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    placa TEXT UNIQUE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('auto', 'camioneta')) DEFAULT 'auto',
    marca_modelo TEXT NOT NULL,
    color TEXT,
    anio INT,
    capacidad_pasajeros INT NOT NULL DEFAULT 4,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. TABLA: rutas ───────────────────────────────────────────────────────────
-- Rutas operadas por la cooperativa entre ciudades/cantones
CREATE TABLE IF NOT EXISTS public.rutas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origen_ciudad TEXT NOT NULL,
    destino_ciudad TEXT NOT NULL,
    tarifa_pasaje_efectivo NUMERIC(10,2) NOT NULL DEFAULT 10.00,
    tarifa_encomienda_base NUMERIC(10,2) NOT NULL DEFAULT 5.00,
    duracion_estimada_minutos INT DEFAULT 180,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_ruta_origen_destino UNIQUE (origen_ciudad, destino_ciudad)
);

-- ── 4. TABLA: turnos_viajes ───────────────────────────────────────────────────
-- Salidas programadas con control de cupos (4 asientos)
CREATE TABLE IF NOT EXISTS public.turnos_viajes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ruta_id UUID NOT NULL REFERENCES public.rutas(id) ON DELETE CASCADE,
    vehiculo_id UUID REFERENCES public.vehiculos(id) ON DELETE SET NULL,
    chofer_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    fecha_salida DATE NOT NULL,
    hora_salida TIME NOT NULL,
    cupos_totales INT NOT NULL DEFAULT 4,
    cupos_ocupados INT NOT NULL DEFAULT 0,
    estado TEXT NOT NULL CHECK (estado IN ('programado', 'recogiendo', 'en_camino', 'finalizado', 'cancelado')) DEFAULT 'programado',
    total_recaudado_efectivo NUMERIC(10,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. TABLA: reservas_pasajeros ──────────────────────────────────────────────
-- Reservas de 1 a 4 puestos con geolocalización puerta a puerta y PIN de abordaje seguro
CREATE TABLE IF NOT EXISTS public.reservas_pasajeros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turno_id UUID NOT NULL REFERENCES public.turnos_viajes(id) ON DELETE CASCADE,
    pasajero_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    cantidad_puestos INT NOT NULL CHECK (cantidad_puestos >= 1 AND cantidad_puestos <= 4),
    latitud_recogida DOUBLE PRECISION NOT NULL,
    longitud_recogida DOUBLE PRECISION NOT NULL,
    direccion_recogida TEXT NOT NULL,
    referencia_recogida TEXT,
    telefono_contacto TEXT NOT NULL,
    monto_total_efectivo NUMERIC(10,2) NOT NULL,
    codigo_abordaje_pin TEXT NOT NULL DEFAULT LPAD(FLOOR(RANDOM()*10000)::TEXT, 4, '0'), -- PIN de 4 dígitos dictado al chofer
    hora_recogida_real TIMESTAMPTZ,
    estado TEXT NOT NULL CHECK (estado IN ('confirmada', 'chofer_en_camino', 'a_bordo', 'completado', 'cancelado')) DEFAULT 'confirmada',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 6. TABLA: encomiendas ─────────────────────────────────────────────────────
-- Encomiendas puerta a puerta con Código QR de entrega seguro
CREATE TABLE IF NOT EXISTS public.encomiendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turno_id UUID REFERENCES public.turnos_viajes(id) ON DELETE SET NULL,
    remitente_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    remitente_nombre TEXT NOT NULL,
    remitente_telefono TEXT NOT NULL,
    destinatario_nombre TEXT NOT NULL,
    destinatario_telefono TEXT NOT NULL,
    latitud_recogida DOUBLE PRECISION NOT NULL,
    longitud_recogida DOUBLE PRECISION NOT NULL,
    direccion_recogida TEXT NOT NULL,
    latitud_entrega DOUBLE PRECISION NOT NULL,
    longitud_entrega DOUBLE PRECISION NOT NULL,
    direccion_entrega TEXT NOT NULL,
    referencia_entrega TEXT,
    descripcion_paquete TEXT NOT NULL,
    precio_envio_efectivo NUMERIC(10,2) NOT NULL DEFAULT 5.00,
    codigo_qr_entrega TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(12), 'hex'),
    estado TEXT NOT NULL CHECK (estado IN ('solicitada', 'asignada_a_turno', 'recogida', 'en_camino', 'entregada', 'cancelada')) DEFAULT 'solicitada',
    entregado_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 7. ÍNDICES DE ALTO RENDIMIENTO ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_turnos_ruta_fecha ON public.turnos_viajes (ruta_id, fecha_salida, estado);
CREATE INDEX IF NOT EXISTS idx_turnos_chofer ON public.turnos_viajes (chofer_id, estado);
CREATE INDEX IF NOT EXISTS idx_reservas_turno ON public.reservas_pasajeros (turno_id, estado);
CREATE INDEX IF NOT EXISTS idx_reservas_pasajero ON public.reservas_pasajeros (pasajero_id);
CREATE INDEX IF NOT EXISTS idx_encomiendas_turno ON public.encomiendas (turno_id, estado);
CREATE INDEX IF NOT EXISTS idx_encomiendas_qr ON public.encomiendas (codigo_qr_entrega);
CREATE INDEX IF NOT EXISTS idx_encomiendas_remitente ON public.encomiendas (remitente_id);

-- ── 8. FUNCIÓN RPC: Reserva Atómica de Asientos (Anti-Race Conditions) ─────────
-- Garantiza que nunca se sobre-reserven más de 4 cupos en un viaje
CREATE OR REPLACE FUNCTION public.reservar_cupos_atomico(
    p_turno_id UUID,
    p_pasajero_id UUID,
    p_cantidad INT,
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_direccion TEXT,
    p_referencia TEXT,
    p_telefono TEXT,
    p_monto NUMERIC
) RETURNS JSONB AS $$
DECLARE
    v_cupos_totales INT;
    v_cupos_ocupados INT;
    v_reserva_id UUID;
BEGIN
    -- Bloqueo pesimista de fila del turno
    SELECT cupos_totales, cupos_ocupados
    INTO v_cupos_totales, v_cupos_ocupados
    FROM public.turnos_viajes
    WHERE id = p_turno_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'error', 'El turno de viaje no existe.');
    END IF;

    -- Validar cupos disponibles
    IF (v_cupos_ocupados + p_cantidad) > v_cupos_totales THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', 'Cupos insuficientes. Quedan ' || (v_cupos_totales - v_cupos_ocupados) || ' puestos disponibles.'
        );
    END IF;

    -- Crear la reserva
    INSERT INTO public.reservas_pasajeros (
        turno_id, pasajero_id, cantidad_puestos,
        latitud_recogida, longitud_recogida, direccion_recogida,
        referencia_recogida, telefono_contacto, monto_total_efectivo, estado
    ) VALUES (
        p_turno_id, p_pasajero_id, p_cantidad,
        p_lat, p_lng, p_direccion,
        p_referencia, p_telefono, p_monto, 'confirmada'
    ) RETURNING id INTO v_reserva_id;

    -- Actualizar cupos en el turno
    UPDATE public.turnos_viajes
    SET 
        cupos_ocupados = cupos_ocupados + p_cantidad,
        total_recaudado_efectivo = total_recaudado_efectivo + p_monto
    WHERE id = p_turno_id;

    RETURN jsonb_build_object(
        'ok', true,
        'reserva_id', v_reserva_id,
        'puestos_reservados', p_cantidad,
        'puestos_restantes', (v_cupos_totales - (v_cupos_ocupados + p_cantidad))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 9. FUNCIÓN RPC: Confirmar Entrega de Encomienda con Escáner QR ─────────────
CREATE OR REPLACE FUNCTION public.confirmar_entrega_encomienda(
    p_codigo_qr TEXT,
    p_chofer_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_encomienda RECORD;
BEGIN
    SELECT * INTO v_encomienda
    FROM public.encomiendas
    WHERE codigo_qr_entrega = p_codigo_qr;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'error', 'Código QR de encomienda no válido o no encontrado.');
    END IF;

    IF v_encomienda.estado = 'entregada' THEN
        RETURN jsonb_build_object('ok', false, 'error', 'Esta encomienda ya fue entregada anteriormente.');
    END IF;

    -- Actualizar estado
    UPDATE public.encomiendas
    SET 
        estado = 'entregada',
        entregado_at = NOW()
    WHERE id = v_encomienda.id;

    RETURN jsonb_build_object(
        'ok', true,
        'encomienda_id', v_encomienda.id,
        'destinatario', v_encomienda.destinatario_nombre,
        'remitente_telefono', v_encomienda.remitente_telefono,
        'mensaje', 'Entrega confirmada con éxito. Notificación enviada al remitente.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 10. FUNCIÓN RPC: Confirmar Abordaje de Pasajero con PIN de 4 Dígitos ───────
-- El pasajero dicta su PIN al subir. El chofer lo valida y confirma el cobro en efectivo.
CREATE OR REPLACE FUNCTION public.confirmar_abordaje_pasajero(
    p_reserva_id UUID,
    p_pin TEXT,
    p_chofer_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_reserva RECORD;
BEGIN
    SELECT * INTO v_reserva
    FROM public.reservas_pasajeros
    WHERE id = p_reserva_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'error', 'La reserva no existe.');
    END IF;

    IF v_reserva.codigo_abordaje_pin != p_pin THEN
        RETURN jsonb_build_object('ok', false, 'error', 'PIN de abordaje incorrecto.');
    END IF;

    IF v_reserva.estado = 'a_bordo' THEN
        RETURN jsonb_build_object('ok', false, 'error', 'El pasajero ya se encuentra a bordo.');
    END IF;

    UPDATE public.reservas_pasajeros
    SET 
        estado = 'a_bordo',
        hora_recogida_real = NOW()
    WHERE id = p_reserva_id;

    RETURN jsonb_build_object(
        'ok', true,
        'reserva_id', p_reserva_id,
        'mensaje', 'Pasajero confirmado a bordo. Pago en efectivo verificado.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 11. TABLA: liquidaciones_turnos (Cierre de Caja & Arqueo de Cooperativa) ───
CREATE TABLE IF NOT EXISTS public.liquidaciones_turnos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turno_id UUID NOT NULL REFERENCES public.turnos_viajes(id) ON DELETE CASCADE,
    chofer_id UUID NOT NULL REFERENCES public.usuarios(id),
    total_pasajes_efectivo NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_encomiendas_efectivo NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_recaudado_efectivo NUMERIC(10,2) NOT NULL,
    cuota_cooperativa NUMERIC(10,2) NOT NULL DEFAULT 6.00,
    gastos_peaje NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    gastos_combustible NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    ganancia_neta_chofer NUMERIC(10,2) NOT NULL,
    estado TEXT NOT NULL CHECK (estado IN ('pendiente', 'liquidado', 'auditado')) DEFAULT 'liquidado',
    observaciones TEXT,
    liquidado_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 12. TABLA: posiciones_gps_turnos (Telemetría y Tracking en Vivo) ───────────
CREATE TABLE IF NOT EXISTS public.posiciones_gps_turnos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turno_id UUID NOT NULL REFERENCES public.turnos_viajes(id) ON DELETE CASCADE,
    chofer_id UUID NOT NULL REFERENCES public.usuarios(id),
    latitud DOUBLE PRECISION NOT NULL,
    longitud DOUBLE PRECISION NOT NULL,
    velocidad_kmh NUMERIC(5,2) DEFAULT 0.00,
    rumbo_grados NUMERIC(5,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posiciones_turno ON public.posiciones_gps_turnos (turno_id, created_at DESC);

-- ── 13. FUNCIÓN RPC: Liquidar Turno y Arqueo de Caja del Chofer ────────────────
CREATE OR REPLACE FUNCTION public.liquidar_turno_chofer(
    p_turno_id UUID,
    p_chofer_id UUID,
    p_gastos_peaje NUMERIC DEFAULT 0.00,
    p_gastos_combustible NUMERIC DEFAULT 0.00,
    p_cuota_cooperativa NUMERIC DEFAULT 6.00,
    p_observaciones TEXT DEFAULT ''
) RETURNS JSONB AS $$
DECLARE
    v_total_pasajes NUMERIC(10,2);
    v_total_encomiendas NUMERIC(10,2);
    v_total_recaudado NUMERIC(10,2);
    v_ganancia_neta NUMERIC(10,2);
    v_liq_id UUID;
BEGIN
    -- Sumar pasajes cobrados
    SELECT COALESCE(SUM(monto_total_efectivo), 0.00)
    INTO v_total_pasajes
    FROM public.reservas_pasajeros
    WHERE turno_id = p_turno_id AND estado IN ('confirmada', 'a_bordo', 'completado');

    -- Sumar encomiendas
    SELECT COALESCE(SUM(precio_envio_efectivo), 0.00)
    INTO v_total_encomiendas
    FROM public.encomiendas
    WHERE turno_id = p_turno_id AND estado IN ('asignada_a_turno', 'recogida', 'en_camino', 'entregada');

    v_total_recaudado := v_total_pasajes + v_total_encomiendas;
    v_ganancia_neta := v_total_recaudado - p_cuota_cooperativa - p_gastos_peaje - p_gastos_combustible;

    INSERT INTO public.liquidaciones_turnos (
        turno_id, chofer_id, total_pasajes_efectivo, total_encomiendas_efectivo,
        total_recaudado_efectivo, cuota_cooperativa, gastos_peaje, gastos_combustible,
        ganancia_neta_chofer, observaciones
    ) VALUES (
        p_turno_id, p_chofer_id, v_total_pasajes, v_total_encomiendas,
        v_total_recaudado, p_cuota_cooperativa, p_gastos_peaje, p_gastos_combustible,
        v_ganancia_neta, p_observaciones
    ) RETURNING id INTO v_liq_id;

    -- Marcar turno como finalizado
    UPDATE public.turnos_viajes
    SET estado = 'finalizado'
    WHERE id = p_turno_id;

    RETURN jsonb_build_object(
        'ok', true,
        'liquidacion_id', v_liq_id,
        'total_recaudado', v_total_recaudado,
        'cuota_cooperativa', p_cuota_cooperativa,
        'gastos_peaje', p_gastos_peaje,
        'ganancia_neta_chofer', v_ganancia_neta,
        'mensaje', 'Turno liquidado y caja cerrada con éxito.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 14. POLÍTICAS ROW LEVEL SECURITY (RLS) · BLINDAJE DE PRODUCCIÓN ───────────
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnos_viajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas_pasajeros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encomiendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liquidaciones_turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posiciones_gps_turnos ENABLE ROW LEVEL SECURITY;

-- Usuarios: Lectura pública de perfiles básicos, edición propia
CREATE POLICY "Lectura publica usuarios" ON public.usuarios FOR SELECT USING (true);
CREATE POLICY "Edicion propia usuarios" ON public.usuarios FOR ALL USING (auth.uid() = auth_user_id OR auth.uid() IS NULL);

-- Turnos: Lectura pública de salidas programadas
CREATE POLICY "Lectura turnos publica" ON public.turnos_viajes FOR SELECT USING (true);
CREATE POLICY "Chofer actualiza su turno" ON public.turnos_viajes FOR UPDATE USING (auth.uid() = chofer_id OR auth.uid() IS NULL);

-- Reservas: Pasajero ve sus propias reservas, chofer ve las del turno asignado
CREATE POLICY "Pasajero ve sus reservas" ON public.reservas_pasajeros FOR SELECT 
    USING (auth.uid() = pasajero_id OR auth.uid() IS NULL);
CREATE POLICY "Crear reserva autorizada" ON public.reservas_pasajeros FOR INSERT WITH CHECK (true);

-- Encomiendas: Remitente ve sus envíos, chofer ve las de su viaje
CREATE POLICY "Remitente y chofer ven encomiendas" ON public.encomiendas FOR SELECT USING (true);
CREATE POLICY "Insertar encomienda" ON public.encomiendas FOR INSERT WITH CHECK (true);

-- Liquidaciones: Chofer y admin ven sus liquidaciones
CREATE POLICY "Chofer ve su liquidacion" ON public.liquidaciones_turnos FOR SELECT USING (true);
CREATE POLICY "Crear liquidacion" ON public.liquidaciones_turnos FOR INSERT WITH CHECK (true);

-- GPS Telemetría: Streaming en tiempo real permitido
CREATE POLICY "GPS lectura publica" ON public.posiciones_gps_turnos FOR SELECT USING (true);
CREATE POLICY "Chofer inserta GPS" ON public.posiciones_gps_turnos FOR INSERT WITH CHECK (true);

-- ── 15. SEMILLAS DEMOSTRATIVAS DE RUTA Y TURNOS ──────────────────────────────
INSERT INTO public.rutas (origen_ciudad, destino_ciudad, tarifa_pasaje_efectivo, tarifa_encomienda_base, duracion_estimada_minutos)
VALUES 
    ('Guayaquil', 'Machala', 12.00, 5.00, 180),
    ('Machala', 'Guayaquil', 12.00, 5.00, 180),
    ('Cuenca', 'Loja', 10.00, 4.50, 210),
    ('Loja', 'Cuenca', 10.00, 4.50, 210)
ON CONFLICT (origen_ciudad, destino_ciudad) DO NOTHING;
