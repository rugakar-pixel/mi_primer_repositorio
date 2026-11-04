from __future__ import annotations

import json
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from typing import Any

from app.schemas.materiales_costos import Project, RentalQuote


CENT = Decimal("0.01")
DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "materiales_costos_demo.json"


def load_demo_project() -> Project:
    project_data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    return Project.model_validate(project_data)


def money(value: Decimal) -> Decimal:
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


def as_decimal(value: float) -> Decimal:
    return Decimal(str(value))


def compute_dimensional_area(longitud: float | None, ancho: float | None) -> float:
    if longitud is None or ancho is None:
        return 0.0
    return round(longitud * ancho, 2)


def compute_dimensional_volume(
    longitud: float | None,
    ancho: float | None,
    espesor: float | None,
) -> float:
    if longitud is None or ancho is None or espesor is None:
        return 0.0
    return round(longitud * ancho * espesor, 3)


def _sum_lines(lines: list[Any], activity_quantity: Decimal) -> Decimal:
    return sum(
        (
            as_decimal(line.cantidad)
            * as_decimal(line.precio_unitario)
            * activity_quantity
            for line in lines
        ),
        Decimal("0"),
    )


def _material_category(name: str) -> str:
    key = name.casefold().strip()
    if "cemento" in key or "cal" in key:
        return "Aglomerantes"
    if any(term in key for term in ("arena", "grava", "triturada", "piedra", "base")):
        return "Agregados"
    if any(term in key for term in ("acero", "varilla", "alambre", "perfil", "lámina", "perno")):
        return "Acero y Metales"
    if any(term in key for term in ("tubo", "malla", "poste")):
        return "Tubería y Malla"
    return "Pinturas y Químicos"


def calculate_project(project: Project) -> dict[str, Any]:
    totals = {
        "materiales": Decimal("0"),
        "equipos": Decimal("0"),
        "herramientas": Decimal("0"),
        "transporte": Decimal("0"),
        "otros": Decimal("0"),
    }
    material_rows: dict[tuple[str, str], dict[str, Any]] = {}
    activity_rows = []

    for activity in project.actividades:
        quantity = as_decimal(activity.cantidad)
        material_unit = _sum_lines(activity.apu.materiales, Decimal("1"))
        equipment_unit = _sum_lines(activity.apu.equipos, Decimal("1"))
        tools_unit = _sum_lines(activity.apu.herramientas, Decimal("1"))
        other_unit = sum(
            (
                as_decimal(line.cantidad) * as_decimal(line.precio_unitario)
                for line in activity.otros_costos
            ),
            Decimal("0"),
        )

        totals["materiales"] += material_unit * quantity
        totals["equipos"] += equipment_unit * quantity
        totals["herramientas"] += tools_unit * quantity
        for line in activity.otros_costos:
            totals[line.categoria] += (
                as_decimal(line.cantidad)
                * as_decimal(line.precio_unitario)
                * quantity
            )

        for line in activity.apu.materiales:
            key = (line.nombre.casefold().strip(), line.unidad)
            amount = as_decimal(line.cantidad) * quantity
            row = material_rows.get(key)
            if row is None:
                row = {
                    "nombre": line.nombre,
                    "categoria": _material_category(line.nombre),
                    "unidad": line.unidad,
                    "cantidad_total": Decimal("0"),
                    "costo_unitario_estimado": as_decimal(line.precio_unitario),
                    "costo_total_estimado": Decimal("0"),
                    "items_relacionados": [],
                }
                material_rows[key] = row
            row["cantidad_total"] += amount
            row["costo_total_estimado"] += amount * as_decimal(line.precio_unitario)
            if activity.item not in row["items_relacionados"]:
                row["items_relacionados"].append(activity.item)

        activity_direct = (
            material_unit + equipment_unit + tools_unit + other_unit
        )
        activity_rows.append(
            {
                "id": activity.id,
                "item": activity.item,
                "codigo": activity.codigo,
                "descripcion": activity.descripcion,
                "unidad": activity.unidad,
                "cantidad": activity.cantidad,
                "precio_unitario_directo": money(activity_direct),
                "costo_directo": money(activity_direct * quantity),
                "area_estimada": compute_dimensional_area(
                    activity.medidas.longitud, activity.medidas.ancho
                ),
                "volumen_estimado": compute_dimensional_volume(
                    activity.medidas.longitud,
                    activity.medidas.ancho,
                    activity.medidas.espesor or activity.medidas.alto,
                ),
            }
        )

    direct = sum(totals.values(), Decimal("0"))
    overhead = project.meta.aiu
    administration = direct * as_decimal(overhead.administracion_pct) / 100
    unforeseen = direct * as_decimal(overhead.imprevistos_pct) / 100
    profit = direct * as_decimal(overhead.utilidad_pct) / 100
    profit_tax = profit * as_decimal(overhead.iva_utilidad_pct) / 100
    indirect = administration + unforeseen + profit + profit_tax

    material_output = [
        {
            **row,
            "cantidad_total": round(float(row["cantidad_total"]), 2),
            "costo_unitario_estimado": float(money(row["costo_unitario_estimado"])),
            "costo_total_estimado": float(money(row["costo_total_estimado"])),
        }
        for row in material_rows.values()
    ]
    material_output.sort(key=lambda row: row["costo_total_estimado"], reverse=True)

    return {
        "moneda": "USD",
        "costo_materiales": float(money(totals["materiales"])),
        "costo_equipos": float(money(totals["equipos"])),
        "costo_herramientas": float(money(totals["herramientas"])),
        "costo_transporte": float(money(totals["transporte"])),
        "otros_costos": float(money(totals["otros"])),
        "costo_directo": float(money(direct)),
        "administracion": float(money(administration)),
        "imprevistos": float(money(unforeseen)),
        "utilidad": float(money(profit)),
        "iva_utilidad": float(money(profit_tax)),
        "costo_indirecto_total": float(money(indirect)),
        "gran_total": float(money(direct + indirect)),
        "materiales_consolidados": material_output,
        "actividades": activity_rows,
    }


def quote_rental(project: Project, quote: RentalQuote) -> dict[str, float | str]:
    benchmark = next(
        (item for item in project.tarifas_equipos if item.id == quote.equipo_id),
        None,
    )
    if benchmark is None:
        raise ValueError(f"No existe la tarifa de equipo '{quote.equipo_id}'.")

    rate_field = {
        "dia": "costo_diario_promedio_usd",
        "semana": "costo_semanal_promedio_usd",
        "mes": "costo_mensual_promedio_usd",
    }[quote.modalidad]
    rate = as_decimal(getattr(benchmark, rate_field))
    total_usd = money(
        rate * as_decimal(quote.periodos) * as_decimal(quote.unidades)
    )
    total_nio = money(total_usd * as_decimal(quote.tasa_cambio_nio))
    return {
        "equipo": benchmark.equipo,
        "modalidad": quote.modalidad,
        "total_usd": float(total_usd),
        "total_nio": float(total_nio),
    }
