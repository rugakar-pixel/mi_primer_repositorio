import argparse
import json
import re
import sqlite3
import sys
import unicodedata
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from pathlib import Path
from typing import Any

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.database_models import MaestroPartidas

SOURCE_DATABASE = Path(__file__).resolve().parents[2] / "datos_pdf.db"
PRICE_UNIT_PATTERN = re.compile(
    r"(?P<unidad>C/U|M3|M2|ML|KG|HA|LT|UND|PZA|JGO|GLN|HR|DIA|MES|SACO|BOLSA|M)"
    r"\s+(?P<precio>(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)\s*$",
    re.IGNORECASE,
)
FOOTER_PATTERN = re.compile(
    r"\s+(?:FONDO DE INVERSION SOCIAL DE EMERGENCIA|CATALOGO MAESTRO DE COSTOS|"
    r"COSTOS DIRECTOS EN LA CIUDAD).*$",
    re.IGNORECASE,
)
PRICE_COLUMNS = ("precio", "costo_unitario", "cost", "price")
DESCRIPTION_COLUMNS = ("descripcion", "description", "nombre", "name")
UNIT_COLUMNS = ("unidad", "um", "unit")
CODE_COLUMNS = ("codigo", "code")
ID_COLUMNS = ("id", "item_id")
UNKNOWN_UNIT = "No detectado"


@dataclass(frozen=True)
class RegistroTransformado:
    valores: dict[str, Any]
    id_origen: Any
    precio_origen: str
    campo_precio: str


def _quote_identifier(identifier: str) -> str:
    return '"' + identifier.replace('"', '""') + '"'


def _normalizar_texto(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    return "".join(character for character in normalized if not unicodedata.combining(character)).upper()


def _resolver_columna(columns: list[str], aliases: tuple[str, ...], required: bool = False) -> str | None:
    columns_by_name = {column.casefold(): column for column in columns}
    for alias in aliases:
        if alias.casefold() in columns_by_name:
            return columns_by_name[alias.casefold()]
    if required:
        raise ValueError(f"No se encontró una columna compatible con {aliases} en {columns}.")
    return None


def _detectar_tabla(connection: sqlite3.Connection) -> tuple[str, dict[str, str | None]]:
    table_names = [
        row[0]
        for row in connection.execute(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
        )
    ]
    candidates: list[tuple[int, str, dict[str, str | None]]] = []

    for table_name in table_names:
        table_sql = _quote_identifier(table_name)
        columns = [row["name"] for row in connection.execute(f"PRAGMA table_info({table_sql})")]
        try:
            mapping = {
                "id": _resolver_columna(columns, ID_COLUMNS),
                "codigo": _resolver_columna(columns, CODE_COLUMNS),
                "descripcion": _resolver_columna(columns, DESCRIPTION_COLUMNS, required=True),
                "unidad": _resolver_columna(columns, UNIT_COLUMNS),
                "precio": _resolver_columna(columns, PRICE_COLUMNS, required=True),
            }
        except ValueError:
            continue
        count = connection.execute(f"SELECT COUNT(*) FROM {table_sql}").fetchone()[0]
        candidates.append((count, table_name, mapping))

    if not candidates:
        raise ValueError("No se encontró una tabla con columnas de descripción y precio.")

    _, table_name, mapping = max(candidates, key=lambda candidate: candidate[0])
    return table_name, mapping


def _leer_registros() -> tuple[list[sqlite3.Row], str, dict[str, str | None]]:
    if not SOURCE_DATABASE.is_file():
        raise FileNotFoundError(f"No existe la base SQLite de origen: {SOURCE_DATABASE}")

    connection = sqlite3.connect(f"file:{SOURCE_DATABASE.as_posix()}?mode=ro", uri=True)
    connection.row_factory = sqlite3.Row
    try:
        table_name, mapping = _detectar_tabla(connection)
        table_sql = _quote_identifier(table_name)
        order_column = mapping["id"]
        order_sql = _quote_identifier(order_column) if order_column else "rowid"
        rows = connection.execute(f"SELECT * FROM {table_sql} ORDER BY {order_sql}").fetchall()
        return rows, table_name, mapping
    finally:
        connection.close()


def _decimal_or_none(value: Any) -> Decimal | None:
    if value is None:
        return None
    try:
        return Decimal(str(value).strip().replace(",", ""))
    except (InvalidOperation, ValueError):
        return None


def _inferir_categoria(descripcion: str) -> str:
    normalized = _normalizar_texto(descripcion)
    if re.search(r"\b(MANO DE OBRA|CUADRILLA|OFICIAL|AYUDANTE|OPERARIO|JORNAL)\b", normalized):
        return "Mano de Obra"
    if re.search(r"\b(MAQUINARIA|EQUIPO|CAMION|VOLQUETE|RETROEXCAVADORA|TRACTOR|GRUA|COMPRESOR)\b", normalized):
        return "Equipo/Maquinaria"
    if re.search(
        r"\b(MATERIAL|CEMENTO|ARENA|GRAVA|PIEDRIN|TUBERIA|PVC|ACERO|MADERA|CONCRETO|ADITIVO|LADRILLO|BLOQUE)\b",
        normalized,
    ):
        return "Material"
    return "General"


def transformar_registro(
    row: sqlite3.Row,
    sequence: int,
    mapping: dict[str, str | None],
    fecha_actualizacion: datetime,
) -> RegistroTransformado:
    source_id = row[mapping["id"]] if mapping["id"] else sequence
    raw_description = row[mapping["descripcion"]]
    descripcion = FOOTER_PATTERN.sub("", str(raw_description or "").strip()).strip()
    if not descripcion:
        raise ValueError(f"Registro de origen {source_id}: descripción vacía.")

    trailing = PRICE_UNIT_PATTERN.search(descripcion)
    raw_price = row[mapping["precio"]]
    if trailing:
        costo = _decimal_or_none(trailing.group("precio"))
        unit_from_description = trailing.group("unidad").upper()
        price_field = "descripcion"
        descripcion = descripcion[:trailing.start()].rstrip()
    else:
        costo = _decimal_or_none(raw_price)
        unit_from_description = None
        price_field = "precio"

    if len(descripcion) > 500:
        raise ValueError(f"Registro de origen {source_id}: descripción supera 500 caracteres.")
    if costo is None or costo < 0:
        raise ValueError(f"Registro de origen {source_id}: no tiene un costo válido.")

    raw_unit = row[mapping["unidad"]] if mapping["unidad"] else None
    if raw_unit and str(raw_unit).strip().casefold() != UNKNOWN_UNIT.casefold():
        unidad = str(raw_unit).strip()
    else:
        unidad = unit_from_description or UNKNOWN_UNIT

    return RegistroTransformado(
        valores={
            "codigo": f"MA-{sequence:05d}",
            "descripcion": descripcion,
            "unidad": unidad[:30],
            "costo_unitario": costo.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP),
            "categoria": _inferir_categoria(descripcion),
            "fecha_actualizacion": fecha_actualizacion,
        },
        id_origen=source_id,
        precio_origen=str(raw_price),
        campo_precio=price_field,
    )


def actualizar_precios_masivo(
    porcentaje_aumento: float,
    categoria: str | None = None,
    *,
    db: Session,
) -> int:
    """Aplica un multiplicador positivo; el llamador confirma o revierte la sesión."""
    multiplier = _decimal_or_none(porcentaje_aumento)
    if multiplier is None or multiplier <= 0:
        raise ValueError("El multiplicador debe ser un número mayor que cero, por ejemplo 1.05.")

    statement = update(MaestroPartidas).values(
        costo_unitario=MaestroPartidas.costo_unitario * multiplier,
        fecha_actualizacion=datetime.now().astimezone(),
    )
    if categoria is not None:
        statement = statement.where(MaestroPartidas.categoria == categoria)

    result = db.execute(statement)
    db.flush()
    return result.rowcount or 0


def _imprimir_previsualizacion(
    rows: list[sqlite3.Row],
    mapping: dict[str, str | None],
    limit: int = 5,
) -> list[RegistroTransformado]:
    update_time = datetime.now().astimezone()
    transformed: list[RegistroTransformado] = []
    for sequence, row in enumerate(rows[:limit], start=1):
        transformed.append(transformar_registro(row, sequence, mapping, update_time))

    print(f"Previsualización de {len(transformed)} registros:")
    for record in transformed:
        preview = {
            "id_origen": record.id_origen,
            **record.valores,
            "costo_desde": record.campo_precio,
            "precio_origen": record.precio_origen,
        }
        preview["fecha_actualizacion"] = record.valores["fecha_actualizacion"].isoformat()
        preview["costo_unitario"] = str(record.valores["costo_unitario"])
        print(json.dumps(preview, ensure_ascii=False, default=str))
    return transformed


def main() -> None:
    parser = argparse.ArgumentParser(description="Previsualiza o migra el catálogo histórico desde SQLite.")
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Inserta el catálogo en PostgreSQL; sin esta opción solo imprime una simulación.",
    )
    args = parser.parse_args()

    rows, table_name, mapping = _leer_registros()
    print(f"Origen: {SOURCE_DATABASE.name}, tabla {table_name}, {len(rows)} registros.")
    _imprimir_previsualizacion(rows, mapping)

    if not args.apply:
        print("Modo simulación: no se escribió en PostgreSQL.")
        return

    update_time = datetime.now().astimezone()
    transformed: list[RegistroTransformado] = []
    skipped: list[tuple[Any, str, str]] = []
    for sequence, row in enumerate(rows, start=1):
        try:
            transformed.append(transformar_registro(row, sequence, mapping, update_time))
        except ValueError as error:
            source_id = row[mapping["id"]] if mapping["id"] else sequence
            description = str(row[mapping["descripcion"]] or "").strip()
            skipped.append((source_id, description, str(error)))

    for source_id, description, reason in skipped:
        print(f"ADVERTENCIA: se omite ID {source_id}: {reason} Descripción: {description}")

    if not transformed:
        raise RuntimeError("No hay registros válidos para migrar.")

    with SessionLocal() as session:
        existing_count = session.scalar(select(func.count()).select_from(MaestroPartidas)) or 0
        if existing_count:
            raise RuntimeError(
                f"El catálogo destino ya contiene {existing_count} registros; no se insertó nada."
            )
        try:
            session.add_all(MaestroPartidas(**record.valores) for record in transformed)
            session.commit()
        except Exception:
            session.rollback()
            raise

    print(
        f"Migración completada: {len(transformed)} registros insertados; "
        f"{len(skipped)} registros omitidos."
    )


if __name__ == "__main__":
    main()