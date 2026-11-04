from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.database_models import Material, MaterialPrecio, Proveedor


def _validar_consulta(fecha: datetime | None, moneda: str) -> tuple[datetime, str]:
    fecha_consulta = fecha or datetime.now(timezone.utc)
    if fecha_consulta.tzinfo is None or fecha_consulta.utcoffset() is None:
        raise ValueError("La fecha de consulta debe incluir zona horaria.")

    moneda_consulta = moneda.strip().upper()
    if len(moneda_consulta) != 3:
        raise ValueError("La moneda debe ser un código ISO 4217 de tres letras.")

    return fecha_consulta, moneda_consulta


def obtener_precio_vigente_proveedor(
    db: Session,
    material_id: int,
    proveedor_id: int,
    *,
    fecha: datetime | None = None,
    moneda: str = "NIO",
) -> MaterialPrecio | None:
    """Obtiene la última cotización vigente del proveedor para la moneda indicada."""
    fecha_consulta, moneda_consulta = _validar_consulta(fecha, moneda)
    statement = (
        select(MaterialPrecio)
        .join(Proveedor, MaterialPrecio.proveedor_id == Proveedor.id)
        .join(Material, MaterialPrecio.material_id == Material.id)
        .where(
            MaterialPrecio.material_id == material_id,
            MaterialPrecio.proveedor_id == proveedor_id,
            MaterialPrecio.fecha_vigencia <= fecha_consulta,
            MaterialPrecio.moneda == moneda_consulta,
            MaterialPrecio.unidad_precio == Material.unidad,
            Proveedor.activo.is_(True),
        )
        .order_by(
            MaterialPrecio.fecha_vigencia.desc(),
            MaterialPrecio.registrado_en.desc(),
            MaterialPrecio.id.desc(),
        )
        .limit(1)
    )
    return db.scalars(statement).first()


def obtener_precio_promedio_vigente(
    db: Session,
    material_id: int,
    *,
    fecha: datetime | None = None,
    moneda: str = "NIO",
) -> Decimal | None:
    """Promedia el último precio vigente por cada proveedor activo."""
    fecha_consulta, moneda_consulta = _validar_consulta(fecha, moneda)
    precios_ordenados = (
        select(
            MaterialPrecio.costo_unitario.label("costo_unitario"),
            func.row_number()
            .over(
                partition_by=MaterialPrecio.proveedor_id,
                order_by=(
                    MaterialPrecio.fecha_vigencia.desc(),
                    MaterialPrecio.registrado_en.desc(),
                    MaterialPrecio.id.desc(),
                ),
            )
            .label("orden_proveedor"),
        )
        .join(Proveedor, MaterialPrecio.proveedor_id == Proveedor.id)
        .join(Material, MaterialPrecio.material_id == Material.id)
        .where(
            MaterialPrecio.material_id == material_id,
            MaterialPrecio.fecha_vigencia <= fecha_consulta,
            MaterialPrecio.moneda == moneda_consulta,
            MaterialPrecio.unidad_precio == Material.unidad,
            Proveedor.activo.is_(True),
        )
        .subquery()
    )
    statement = select(func.avg(precios_ordenados.c.costo_unitario)).where(
        precios_ordenados.c.orden_proveedor == 1
    )
    return db.scalar(statement)
