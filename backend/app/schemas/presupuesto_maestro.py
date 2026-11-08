from datetime import datetime
from decimal import Decimal

from pydantic import Field

from app.schemas.plataforma import PlatformModel


class PresupuestoMaestroCalcular(PlatformModel):
    motivo: str = Field(default="Cálculo del Presupuesto Maestro", min_length=1, max_length=1000)
    actualizado_por_id: int | None = Field(default=None, gt=0)


class PresupuestoMaestroCosto(PlatformModel):
    costo_unitario: Decimal = Field(ge=0, max_digits=18, decimal_places=4)
    motivo: str = Field(min_length=1, max_length=1000)
    actualizado_por_id: int | None = Field(default=None, gt=0)


class PresupuestoMaestroPartidaResponse(PlatformModel):
    id: int
    partida_id: int
    capitulo_id: int
    codigo: str
    descripcion: str
    unidad: str
    cantidad: Decimal
    costo_unitario: Decimal
    total: Decimal
    origen_costo: str
    version_apu_id: int | None
    uso_apu_id: int | None


class PresupuestoMaestroCapituloResponse(PlatformModel):
    id: int
    capitulo_id: int
    codigo: str
    nombre: str
    total: Decimal
    cantidad_partidas: int
    partidas: list[PresupuestoMaestroPartidaResponse]


class PresupuestoMaestroResponse(PlatformModel):
    id: int
    proyecto_id: int
    version_proyecto_id: int
    estado: str
    moneda: str
    total_general: Decimal
    revision: int
    algoritmo_version: str
    actualizado_por_id: int | None
    creado_en: datetime
    actualizado_en: datetime
    capitulos: list[PresupuestoMaestroCapituloResponse]
