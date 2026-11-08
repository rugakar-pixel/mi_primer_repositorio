import argparse
from pathlib import Path

from sqlalchemy import text

from app.db.base import Base
from app.db.session import engine
from app.models import database_models


MIGRATIONS = {
    "001": {
        "file": "001_catalogo_materiales.sql",
        "tables": {
            "categorias_materiales",
            "materiales",
            "materiales_precios",
            "proveedores",
        },
        "trigger": "trg_materiales_precios_inmutables",
        "trigger_table": "materiales_precios",
    },
    "002": {
        "file": "002_fase1_organizacion_proyectos.sql",
        "tables": {
            "empresas",
            "usuarios",
            "membresias_empresa",
            "versiones_proyecto",
            "auditoria_eventos",
        },
        "trigger": None,
    },
    "003": {
        "file": "003_fase1_mano_obra.sql",
        "tables": {"presupuestos_mo_versiones", "presupuestos_mo_lineas"},
        "trigger": None,
    },
    "004": {
        "file": "004_fase2a_wbs.sql",
        "tables": {"capitulos"},
        "trigger": None,
    },
    "005": {
        "file": "005_fase2b_apu_maestro.sql",
        "tables": {"apus_maestros", "versiones_apu", "usos_apu"},
        "trigger": "trg_versiones_apu_inmutables",
        "trigger_table": "versiones_apu",
    },
    "006": {
        "file": "006_fase2c_cotizaciones_materiales.sql",
        "tables": {"materiales_precios"},
        "trigger": "trg_materiales_precios_inmutables",
        "trigger_table": "materiales_precios",
    },
}


def main() -> None:
    parser = argparse.ArgumentParser(description="Aplicar y verificar migraciones PostgreSQL.")
    parser.add_argument(
        "migration",
        choices=MIGRATIONS,
        nargs="?",
        default="001",
        help="Migración a aplicar (por defecto: 001, compatible con el ejecutor anterior).",
    )
    migration_id = parser.parse_args().migration
    migration = MIGRATIONS[migration_id]
    migration_path = Path(__file__).resolve().parents[1] / "migrations" / migration["file"]
    migration_sql = migration_path.read_text(encoding="utf-8")
    Base.metadata.create_all(bind=engine)

    already_applied = False
    if migration_id != "001":
        with engine.begin() as connection:
            connection.execute(
                text(
                    "CREATE TABLE IF NOT EXISTS schema_migrations ("
                    "version VARCHAR(20) PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())"
                )
            )
        with engine.connect() as connection:
            if migration_id == "003":
                organization_applied = connection.execute(
                    text("SELECT 1 FROM schema_migrations WHERE version = '002'")
                ).first()
                if organization_applied is None:
                    raise RuntimeError(
                        "Aplique primero la migración 002_fase1_organizacion_proyectos."
                    )
            if migration_id == "004":
                phase_one_applied = connection.execute(
                    text("SELECT 1 FROM schema_migrations WHERE version = '003'")
                ).first()
                if phase_one_applied is None:
                    raise RuntimeError(
                        "Aplique primero las migraciones 002 y 003 de la Fase 1."
                    )
            if migration_id == "005":
                wbs_applied = connection.execute(
                    text("SELECT 1 FROM schema_migrations WHERE version = '004'")
                ).first()
                if wbs_applied is None:
                    raise RuntimeError("Aplique primero la migración 004 de la Fase 2A.")
            if migration_id == "006":
                apu_applied = connection.execute(
                    text("SELECT 1 FROM schema_migrations WHERE version = '005'")
                ).first()
                if apu_applied is None:
                    raise RuntimeError("Aplique primero la migración 005 de la Fase 2B.")
            already_applied = connection.execute(
                text("SELECT 1 FROM schema_migrations WHERE version = :version"),
                {"version": migration_id},
            ).first() is not None

    if not already_applied:
        raw_connection = engine.raw_connection()
        try:
            with raw_connection.cursor() as cursor:
                cursor.execute(migration_sql)
                if migration_id != "001":
                    cursor.execute(
                        "INSERT INTO schema_migrations (version) VALUES (%s)",
                        (migration_id,),
                    )
            raw_connection.commit()
        except Exception:
            raw_connection.rollback()
            raise
        finally:
            raw_connection.close()

    with engine.connect() as connection:
        tables = set(
            connection.execute(
                text(
                    "SELECT tablename FROM pg_tables "
                    "WHERE schemaname = ANY (current_schemas(false))"
                )
            ).scalars()
        )
        missing_tables = migration["tables"] - tables
        trigger_exists = True
        if migration["trigger"]:
            trigger_exists = connection.execute(
                text(
                    "SELECT EXISTS ("
                    "SELECT 1 FROM pg_trigger "
                    "WHERE tgname = :trigger_name "
                    "AND tgrelid = to_regclass(:trigger_table) "
                    "AND NOT tgisinternal)"
                ),
                {
                    "trigger_name": migration["trigger"],
                    "trigger_table": migration["trigger_table"],
                },
            ).scalar_one()
        if migration_id == "005":
            usage_trigger_exists = connection.execute(
                text(
                    "SELECT EXISTS ("
                    "SELECT 1 FROM pg_trigger "
                    "WHERE tgname = 'trg_usos_apu_inmutables' "
                    "AND tgrelid = to_regclass('usos_apu') "
                    "AND NOT tgisinternal)"
                )
            ).scalar_one()
            trigger_exists = trigger_exists and usage_trigger_exists
        missing_columns = set()
        if migration_id == "002":
            columns = set(
                connection.execute(
                    text(
                        "SELECT column_name FROM information_schema.columns "
                        "WHERE table_schema = ANY (current_schemas(false)) "
                        "AND table_name = 'proyectos'"
                    )
                ).scalars()
            )
            if "empresa_id" not in columns:
                missing_columns.add("proyectos.empresa_id")
        if migration_id == "004":
            columns = set(
                connection.execute(
                    text(
                        "SELECT column_name FROM information_schema.columns "
                        "WHERE table_schema = ANY (current_schemas(false)) "
                        "AND table_name = 'capitulos'"
                    )
                ).scalars()
            )
            if "version_proyecto_id" not in columns:
                missing_columns.add("capitulos.version_proyecto_id")
        if migration_id == "005":
            columns = set(
                connection.execute(
                    text(
                        "SELECT column_name FROM information_schema.columns "
                        "WHERE table_schema = ANY (current_schemas(false)) "
                        "AND table_name = 'usos_apu'"
                    )
                ).scalars()
            )
            if "snapshot" not in columns:
                missing_columns.add("usos_apu.snapshot")
        if migration_id == "006":
            columns = set(
                connection.execute(
                    text(
                        "SELECT column_name FROM information_schema.columns "
                        "WHERE table_schema = ANY (current_schemas(false)) "
                        "AND table_name = 'materiales_precios'"
                    )
                ).scalars()
            )
            for column in {"origen", "referencia_cotizacion"}:
                if column not in columns:
                    missing_columns.add(f"materiales_precios.{column}")

    if missing_tables or not trigger_exists or missing_columns:
        raise RuntimeError(
            "La migración terminó, pero no se encontraron todos los objetos "
            f"esperados. Tablas faltantes: {sorted(missing_tables)}; "
            f"columnas faltantes: {sorted(missing_columns)}; "
            f"trigger esperado presente: {trigger_exists}."
        )

    state = "ya estaba aplicada" if already_applied else "aplicada"
    print(f"Migración {migration['file']} {state} y verificada.")


if __name__ == "__main__":
    main()
