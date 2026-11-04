from __future__ import annotations

from typing import Literal

from pydantic import Field

from app.schemas.materiales_costos import ApiModel, Project


Origen = Literal["MANO_OBRA", "MATERIAL", "EQUIPO", "SUBCONTRATO", "OTRO"]
Moneda = Literal["NIO", "USD"]


class BudgetSourceLine(ApiModel):
    id: str = Field(min_length=1, max_length=160)
    categoria: str = Field(min_length=1, max_length=120)
    descripcion: str = Field(min_length=1, max_length=500)
    unidad_medida: str = Field(min_length=1, max_length=30)
    cantidad: float = Field(ge=0, allow_inf_nan=False)
    costo_unitario: float = Field(ge=0, allow_inf_nan=False)
    moneda: Moneda = "NIO"
    referencia: str | None = Field(default=None, max_length=500)


class ConsolidationRequest(ApiModel):
    mano_obra: list[BudgetSourceLine] = Field(default_factory=list)
    proyecto_materiales: Project
    subcontratos: list[BudgetSourceLine] = Field(default_factory=list)


class ConsolidatedItem(ApiModel):
    id: str
    origen: Origen
    categoria: str
    descripcion: str
    unidad_medida: str
    cantidad: float
    costo_unitario: float
    costo_total: float
    referencias: list[str] = Field(default_factory=list)


class ConsolidationSummary(ApiModel):
    moneda: Literal["NIO"] = "NIO"
    tasa_cambio: float
    mano_obra: float
    materiales: float
    equipos: float
    subcontratos: float
    otros: float
    total_general: float


class ConsolidationResponse(ApiModel):
    items: list[ConsolidatedItem]
    resumen: ConsolidationSummary
