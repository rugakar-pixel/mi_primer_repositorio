from __future__ import annotations

from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP
from hashlib import sha1

from app.schemas.consolidado import (
    BudgetSourceLine,
    ConsolidatedItem,
    ConsolidationRequest,
    ConsolidationResponse,
    ConsolidationSummary,
)
from app.services.materiales_costos import calculate_project

CENT = Decimal("0.01")
FOUR_PLACES = Decimal("0.0001")


def _decimal(value: float | Decimal) -> Decimal:
    return Decimal(str(value))


def _round(value: Decimal, places: Decimal = CENT) -> Decimal:
    return value.quantize(places, rounding=ROUND_HALF_UP)


class BudgetConsolidationService:
    """Adapta los presupuestos actuales a una sola lista y calcula sus totales."""

    def consolidate(self, request: ConsolidationRequest) -> ConsolidationResponse:
        rows: list[tuple[str, BudgetSourceLine]] = [
            ("MANO_OBRA", line) for line in request.mano_obra
        ]
        fx = _decimal(request.proyecto_materiales.meta.tasa_cambio_nio)

        for activity in request.proyecto_materiales.actividades:
            for index, line in enumerate(activity.apu.materiales):
                rows.append(
                    (
                        "MATERIAL",
                        BudgetSourceLine(
                            id=f"{activity.id}:material:{index}",
                            categoria="material",
                            descripcion=line.nombre,
                            unidad_medida=line.unidad,
                            cantidad=line.cantidad * activity.cantidad,
                            costo_unitario=line.precio_unitario,
                            moneda="USD",
                            referencia=f"Ítem {activity.item}: {activity.descripcion}",
                        ),
                    )
                )
            for index, line in enumerate(activity.apu.equipos):
                rows.append(
                    (
                        "EQUIPO",
                        BudgetSourceLine(
                            id=f"{activity.id}:equipo:{index}",
                            categoria="equipo",
                            descripcion=line.nombre,
                            unidad_medida=line.unidad,
                            cantidad=line.cantidad * activity.cantidad,
                            costo_unitario=line.precio_unitario,
                            moneda="USD",
                            referencia=f"Ítem {activity.item}: {activity.descripcion}",
                        ),
                    )
                )
            for index, line in enumerate(activity.apu.herramientas):
                rows.append(
                    (
                        "OTRO",
                        BudgetSourceLine(
                            id=f"{activity.id}:herramienta:{index}",
                            categoria="herramientas",
                            descripcion=line.nombre,
                            unidad_medida=line.unidad,
                            cantidad=line.cantidad * activity.cantidad,
                            costo_unitario=line.precio_unitario,
                            moneda="USD",
                            referencia=f"Ítem {activity.item}: {activity.descripcion}",
                        ),
                    )
                )
            for index, line in enumerate(activity.otros_costos):
                rows.append(
                    (
                        "OTRO",
                        BudgetSourceLine(
                            id=f"{activity.id}:otro:{index}",
                            categoria=line.categoria,
                            descripcion=line.concepto,
                            unidad_medida=line.unidad,
                            cantidad=line.cantidad * activity.cantidad,
                            costo_unitario=line.precio_unitario,
                            moneda="USD",
                            referencia=f"Ítem {activity.item}: {activity.descripcion}",
                        ),
                    )
                )

        rows.extend(("SUBCONTRATO", line) for line in request.subcontratos)

        indirect_cost = _decimal(calculate_project(request.proyecto_materiales)["costo_indirecto_total"])
        if indirect_cost:
            rows.append(
                (
                    "OTRO",
                    BudgetSourceLine(
                        id="materiales-costos:costos-indirectos",
                        categoria="costos_indirectos",
                        descripcion="Administración, imprevistos, utilidad e IVA sobre utilidad",
                        unidad_medida="LOTE",
                        cantidad=1,
                        costo_unitario=float(indirect_cost),
                        moneda="USD",
                        referencia=request.proyecto_materiales.meta.nombre,
                    ),
                )
            )

        seen_ids: dict[tuple[str, str], BudgetSourceLine] = {}
        groups: dict[tuple[str, str, str, str, Decimal, str], dict[str, object]] = {}
        for origin, line in rows:
            source_key = (origin, line.id)
            if source_key in seen_ids:
                if seen_ids[source_key] != line:
                    raise ValueError(
                        f"El identificador '{line.id}' está repetido con datos diferentes "
                        f"en el origen {origin}."
                    )
                continue
            seen_ids[source_key] = line

            fx_rate = fx if line.moneda == "USD" else Decimal("1")
            unit_cost = _round(_decimal(line.costo_unitario) * fx_rate, FOUR_PLACES)
            quantity = _decimal(line.cantidad)
            total = _round(quantity * _decimal(line.costo_unitario) * fx_rate)
            grouping_key = (
                origin,
                line.categoria.casefold().strip(),
                line.descripcion.casefold().strip(),
                line.unidad_medida.casefold().strip(),
                unit_cost,
                line.id if origin in ("MANO_OBRA", "SUBCONTRATO") else "",
            )
            group = groups.get(grouping_key)
            if group is None:
                group = {
                    "origin": origin,
                    "category": line.categoria,
                    "description": line.descripcion,
                    "unit": line.unidad_medida,
                    "quantity": Decimal("0"),
                    "unit_cost": unit_cost,
                    "total": Decimal("0"),
                    "references": [],
                }
                groups[grouping_key] = group
            group["quantity"] = _decimal(group["quantity"]) + quantity
            group["total"] = _decimal(group["total"]) + total
            references = group["references"]
            if line.referencia and line.referencia not in references:
                references.append(line.referencia)

        items: list[ConsolidatedItem] = []
        for key, group in groups.items():
            fingerprint = sha1("|".join(map(str, key)).encode("utf-8")).hexdigest()[:12]
            items.append(
                ConsolidatedItem(
                    id=f"{group['origin'].lower()}-{fingerprint}",
                    origen=group["origin"],
                    categoria=str(group["category"]),
                    descripcion=str(group["description"]),
                    unidad_medida=str(group["unit"]),
                    cantidad=float(_round(_decimal(group["quantity"]), FOUR_PLACES)),
                    costo_unitario=float(group["unit_cost"]),
                    costo_total=float(_round(_decimal(group["total"]))),
                    referencias=group["references"],
                )
            )

        summary_values = defaultdict(Decimal)
        for item in items:
            summary_values[item.origen] += _decimal(item.costo_total)
        labor = _round(summary_values["MANO_OBRA"])
        materials = _round(summary_values["MATERIAL"])
        equipment = _round(summary_values["EQUIPO"])
        subcontract = _round(summary_values["SUBCONTRATO"])
        other = _round(summary_values["OTRO"])

        return ConsolidationResponse(
            items=items,
            resumen=ConsolidationSummary(
                tasa_cambio=float(fx),
                mano_obra=float(labor),
                materiales=float(materials),
                equipos=float(equipment),
                subcontratos=float(subcontract),
                otros=float(other),
                total_general=float(_round(labor + materials + equipment + subcontract + other)),
            ),
        )


budget_consolidation_service = BudgetConsolidationService()
