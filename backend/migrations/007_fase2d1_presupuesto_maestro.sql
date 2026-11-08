BEGIN;

CREATE TABLE IF NOT EXISTS presupuestos_maestros (
    id BIGSERIAL PRIMARY KEY,
    proyecto_id BIGINT NOT NULL REFERENCES proyectos(id) ON DELETE RESTRICT,
    version_proyecto_id BIGINT NOT NULL UNIQUE REFERENCES versiones_proyecto(id) ON DELETE RESTRICT,
    estado VARCHAR(30) NOT NULL DEFAULT 'Borrador',
    moneda VARCHAR(3) NOT NULL DEFAULT 'NIO',
    total_general NUMERIC(18, 4) NOT NULL DEFAULT 0,
    revision INTEGER NOT NULL DEFAULT 1,
    algoritmo_version VARCHAR(40) NOT NULL DEFAULT 'presupuesto-maestro-2d1-v1',
    actualizado_por_id BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_presupuestos_maestros_total_no_negativo CHECK (total_general >= 0),
    CONSTRAINT ck_presupuestos_maestros_revision_positiva CHECK (revision > 0)
);

CREATE INDEX IF NOT EXISTS ix_presupuestos_maestros_proyecto
    ON presupuestos_maestros (proyecto_id, version_proyecto_id);

CREATE TABLE IF NOT EXISTS presupuestos_maestros_capitulos (
    id BIGSERIAL PRIMARY KEY,
    presupuesto_maestro_id BIGINT NOT NULL REFERENCES presupuestos_maestros(id) ON DELETE CASCADE,
    capitulo_id BIGINT NOT NULL REFERENCES capitulos(id) ON DELETE RESTRICT,
    codigo VARCHAR(30) NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    total NUMERIC(18, 4) NOT NULL DEFAULT 0,
    cantidad_partidas INTEGER NOT NULL DEFAULT 0,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_presupuesto_maestro_capitulo UNIQUE (presupuesto_maestro_id, capitulo_id),
    CONSTRAINT ck_presupuesto_maestro_capitulo_total CHECK (total >= 0)
);

CREATE INDEX IF NOT EXISTS ix_presupuesto_maestro_capitulos_presupuesto
    ON presupuestos_maestros_capitulos (presupuesto_maestro_id, codigo);

CREATE TABLE IF NOT EXISTS presupuestos_maestros_partidas (
    id BIGSERIAL PRIMARY KEY,
    presupuesto_maestro_id BIGINT NOT NULL REFERENCES presupuestos_maestros(id) ON DELETE CASCADE,
    partida_id BIGINT NOT NULL REFERENCES partidas(id) ON DELETE RESTRICT,
    capitulo_id BIGINT NOT NULL REFERENCES capitulos(id) ON DELETE RESTRICT,
    codigo VARCHAR(50) NOT NULL,
    descripcion VARCHAR(500) NOT NULL,
    unidad VARCHAR(30) NOT NULL,
    cantidad NUMERIC(18, 4) NOT NULL,
    costo_unitario NUMERIC(18, 4) NOT NULL,
    total NUMERIC(18, 4) NOT NULL,
    origen_costo VARCHAR(40) NOT NULL,
    version_apu_id BIGINT REFERENCES versiones_apu(id) ON DELETE SET NULL,
    uso_apu_id BIGINT REFERENCES usos_apu(id) ON DELETE SET NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_presupuesto_maestro_partida UNIQUE (presupuesto_maestro_id, partida_id),
    CONSTRAINT ck_presupuesto_maestro_partida_cantidad CHECK (cantidad >= 0),
    CONSTRAINT ck_presupuesto_maestro_partida_costo CHECK (costo_unitario >= 0),
    CONSTRAINT ck_presupuesto_maestro_partida_total CHECK (total >= 0)
);

CREATE INDEX IF NOT EXISTS ix_presupuesto_maestro_partidas_presupuesto
    ON presupuestos_maestros_partidas (presupuesto_maestro_id, codigo);

COMMIT;
