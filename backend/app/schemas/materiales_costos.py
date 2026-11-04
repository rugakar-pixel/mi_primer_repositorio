from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


def to_camel(value: str) -> str:
    first, *rest = value.split("_")
    return (
        first + "".join(part.capitalize() for part in rest)
    ).replace("Usd", "USD").replace("Nio", "NIO")


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        extra="forbid",
        populate_by_name=True,
    )


class CostLine(ApiModel):
    nombre: str = Field(min_length=1, max_length=200)
    unidad: str = Field(min_length=1, max_length=30)
    cantidad: float = Field(ge=0, allow_inf_nan=False)
    precio_unitario: float = Field(ge=0, allow_inf_nan=False)


class Apu(ApiModel):
    materiales: list[CostLine] = Field(default_factory=list)
    equipos: list[CostLine] = Field(default_factory=list)
    herramientas: list[CostLine] = Field(default_factory=list)


class OtherCost(ApiModel):
    concepto: str = Field(min_length=1, max_length=200)
    categoria: Literal["transporte", "otro"]
    unidad: str = Field(min_length=1, max_length=30)
    cantidad: float = Field(ge=0, allow_inf_nan=False)
    precio_unitario: float = Field(ge=0, allow_inf_nan=False)


class Dimensions(ApiModel):
    longitud: float | None = Field(default=None, ge=0, allow_inf_nan=False)
    ancho: float | None = Field(default=None, ge=0, allow_inf_nan=False)
    alto: float | None = Field(default=None, ge=0, allow_inf_nan=False)
    espesor: float | None = Field(default=None, ge=0, allow_inf_nan=False)
    diametro: float | None = Field(default=None, ge=0, allow_inf_nan=False)
    peso_por_metro: float | None = Field(default=None, ge=0, allow_inf_nan=False)
    piezas: float | None = Field(default=None, ge=0, allow_inf_nan=False)


class Activity(ApiModel):
    id: str
    item: int = Field(ge=1)
    codigo: str
    descripcion: str
    unidad: str
    cantidad: float = Field(gt=0, allow_inf_nan=False)
    medidas: Dimensions = Field(default_factory=Dimensions)
    apu: Apu = Field(default_factory=Apu)
    otros_costos: list[OtherCost] = Field(default_factory=list)


class Overheads(ApiModel):
    administracion_pct: float = Field(default=10, ge=0, le=100, allow_inf_nan=False)
    imprevistos_pct: float = Field(default=5, ge=0, le=100, allow_inf_nan=False)
    utilidad_pct: float = Field(default=5, ge=0, le=100, allow_inf_nan=False)
    iva_utilidad_pct: float = Field(default=15, ge=0, le=100, allow_inf_nan=False)


class ProjectMeta(ApiModel):
    nombre: str
    moneda: Literal["USD", "NIO"] = "USD"
    tasa_cambio_nio: float = Field(default=36.8, gt=0, allow_inf_nan=False)
    aiu: Overheads = Field(default_factory=Overheads)


class EquipmentBenchmark(ApiModel):
    id: str
    equipo: str
    categoria: str
    costo_diario_min_usd: float = Field(ge=0)
    costo_diario_max_usd: float = Field(ge=0)
    costo_diario_promedio_usd: float = Field(ge=0)
    costo_semanal_min_usd: float = Field(ge=0)
    costo_semanal_max_usd: float = Field(ge=0)
    costo_semanal_promedio_usd: float = Field(ge=0)
    costo_mensual_min_usd: float = Field(ge=0)
    costo_mensual_max_usd: float = Field(ge=0)
    costo_mensual_promedio_usd: float = Field(ge=0)
    unidad_medida_tarifa: str
    observaciones: str


class Project(ApiModel):
    meta: ProjectMeta
    actividades: list[Activity]
    tarifas_equipos: list[EquipmentBenchmark] = Field(default_factory=list)


class RentalQuote(ApiModel):
    equipo_id: str
    modalidad: Literal["dia", "semana", "mes"]
    periodos: float = Field(gt=0, allow_inf_nan=False)
    unidades: float = Field(gt=0, allow_inf_nan=False)
    tasa_cambio_nio: float = Field(
        default=36.8,
        alias="tasaCambioNio",
        gt=0,
        allow_inf_nan=False,
    )
