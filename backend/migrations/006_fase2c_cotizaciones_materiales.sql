BEGIN;

ALTER TABLE materiales_precios
    ADD COLUMN IF NOT EXISTS origen VARCHAR(100) NOT NULL DEFAULT 'manual';

ALTER TABLE materiales_precios
    ADD COLUMN IF NOT EXISTS referencia_cotizacion VARCHAR(200);

COMMIT;
