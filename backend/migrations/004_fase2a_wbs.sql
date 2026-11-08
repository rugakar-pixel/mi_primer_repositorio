ALTER TABLE capitulos
    ADD COLUMN IF NOT EXISTS version_proyecto_id INTEGER
    REFERENCES versiones_proyecto(id) ON DELETE RESTRICT;

ALTER TABLE capitulos
    DROP CONSTRAINT IF EXISTS uq_capitulos_proyecto_codigo;

ALTER TABLE capitulos
    DROP CONSTRAINT IF EXISTS uq_capitulos_version_codigo;

ALTER TABLE capitulos
    ADD CONSTRAINT uq_capitulos_version_codigo
    UNIQUE (version_proyecto_id, codigo);

CREATE INDEX IF NOT EXISTS ix_capitulos_version_proyecto
    ON capitulos (version_proyecto_id);
