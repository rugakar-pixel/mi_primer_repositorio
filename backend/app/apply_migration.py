from pathlib import Path

from sqlalchemy import text

from app.db.session import engine


MIGRATION_PATH = Path(__file__).resolve().parents[1] / "migrations" / "001_catalogo_materiales.sql"
EXPECTED_TABLES = {
    "categorias_materiales",
    "materiales",
    "materiales_precios",
    "proveedores",
}


def main() -> None:
    migration_sql = MIGRATION_PATH.read_text(encoding="utf-8")
    connection = engine.raw_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(migration_sql)
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()

    with engine.connect() as connection:
        tables = set(
            connection.execute(
                text(
                    "SELECT tablename FROM pg_tables "
                    "WHERE schemaname = ANY (current_schemas(false))"
                )
            ).scalars()
        )
        missing_tables = EXPECTED_TABLES - tables
        trigger_exists = connection.execute(
            text(
                "SELECT EXISTS ("
                "SELECT 1 FROM pg_trigger "
                "WHERE tgname = 'trg_materiales_precios_inmutables' "
                "AND tgrelid = to_regclass('materiales_precios') "
                "AND NOT tgisinternal)"
            )
        ).scalar_one()

    if missing_tables or not trigger_exists:
        raise RuntimeError(
            "La migración terminó, pero no se encontraron todos los objetos "
            f"esperados. Tablas faltantes: {sorted(missing_tables)}; "
            f"trigger inmutable presente: {trigger_exists}."
        )

    print("Migración 001_catalogo_materiales aplicada y verificada.")


if __name__ == "__main__":
    main()
