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
    auth_user_id UUID UNIQUE, -- Enlace con Supabase Auth si aplica
    email TEXT UNIQUE,
    nombre_completo TEXT NOT NULL,
    telefono TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('pasajero', 'chofer', 'admin')) DEFAULT 'pasajero',
    foto_url TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
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
-- Reservas de 1 a 4 puestos con geolocalización puerta a puerta
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

-- ── 10. SEMILLAS DEMOSTRATIVAS DE RUTA Y TURNOS ──────────────────────────────
INSERT INTO public.rutas (origen_ciudad, destino_ciudad, tarifa_pasaje_efectivo, tarifa_encomienda_base, duracion_estimada_minutos)
VALUES 
    ('Guayaquil', 'Machala', 12.00, 5.00, 180),
    ('Machala', 'Guayaquil', 12.00, 5.00, 180),
    ('Cuenca', 'Loja', 10.00, 4.50, 210),
    ('Loja', 'Cuenca', 10.00, 4.50, 210)
ON CONFLICT (origen_ciudad, destino_ciudad) DO NOTHING;
