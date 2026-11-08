from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class PlatformModel(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True)


class EmpresaCreate(PlatformModel):
    creado_por_id: int | None = Field(default=None, gt=0)
    nombre: str = Field(min_length=1, max_length=200)
    razon_social: str | None = Field(default=None, max_length=250)
    identificacion_fiscal: str | None = Field(default=None, max_length=40)
    pais: str = Field(default="NI", min_length=2, max_length=2, pattern="^[A-Za-z]{2}$")
    moneda_base: str = Field(default="NIO", min_length=3, max_length=3, pattern="^[A-Za-z]{3}$")
    motivo: str | None = Field(default=None, max_length=1000)


class EmpresaResponse(PlatformModel):
    id: int
    nombre: str
    razon_social: str | None
    identificacion_fiscal: str | None
    pais: str
    moneda_base: str
    estado: str


class UsuarioCreate(PlatformModel):
    creado_por_id: int | None = Field(default=None, gt=0)
    nombre: str = Field(min_length=1, max_length=200)
    correo: str = Field(min_length=3, max_length=254)
    motivo: str | None = Field(default=None, max_length=1000)


class UsuarioResponse(PlatformModel):
    id: int
    nombre: str
    correo: str
    estado: str


class MembresiaCreate(PlatformModel):
    usuario_id: int = Field(gt=0)
    rol: str = Field(default="Editor", pattern="^(Administrador|Editor|Lector)$")
    creado_por_id: int | None = Field(default=None, gt=0)
    motivo: str | None = Field(default=None, max_length=1000)


class MembresiaResponse(PlatformModel):
    id: int
    empresa_id: int
    usuario_id: int
    rol: str
    estado: str
    usuario: UsuarioResponse


class ProyectoCreate(PlatformModel):
    empresa_id: int = Field(gt=0)
    nombre: str = Field(min_length=1, max_length=200)
    ubicacion: str | None = Field(default=None, max_length=250)
    creado_por_id: int | None = Field(default=None, gt=0)
    motivo: str | None = Field(default=None, max_length=1000)


class ProyectoResponse(PlatformModel):
    id: int
    empresa_id: int | None
    nombre: str
    ubicacion: str | None
    estado: str
    fecha_creacion: datetime


class VersionProyectoCreate(PlatformModel):
    version_origen_id: int | None = Field(default=None, gt=0)
    motivo: str = Field(min_length=1, max_length=1000)
    creado_por_id: int | None = Field(default=None, gt=0)


class VersionProyectoResponse(PlatformModel):
    id: int
    proyecto_id: int
    numero: int
    estado: str
    motivo: str
    version_anterior_id: int | None
    creado_por_id: int | None
    creado_en: datetime
    tiene_mano_obra: bool = False


class AuditoriaResponse(PlatformModel):
    id: int
    actor_usuario_id: int | None
    actor_tipo: str
    empresa_id: int | None
    proyecto_id: int | None
    version_proyecto_id: int | None
    accion: str
    entidad_tipo: str
    entidad_id: str
    motivo: str | None
    origen: str
    valores_anteriores: dict | None
    valores_nuevos: dict | None
    creado_en: datetime


class ConfiguracionLaboralSnapshot(PlatformModel):
    salario_minimo_mensual: float = Field(ge=0, allow_inf_nan=False)
    dias_mes_comercial: float = Field(gt=0, allow_inf_nan=False)
    horas_jornada_diaria: float = Field(gt=0, allow_inf_nan=False)
    horas_semana_max: float = Field(gt=0, allow_inf_nan=False)
    dias_semana_laboral: float = Field(gt=0, allow_inf_nan=False)
    factor_oficial: float = Field(ge=0, allow_inf_nan=False)
    pct_aguinaldo: float = Field(ge=0, allow_inf_nan=False)
    pct_vacaciones: float = Field(ge=0, allow_inf_nan=False)
    pct_inss_patronal: float = Field(ge=0, allow_inf_nan=False)
    pct_inatec: float = Field(ge=0, allow_inf_nan=False)
    pct_indemnizacion: float = Field(ge=0, allow_inf_nan=False)
    pct_inss_laboral: float = Field(ge=0, allow_inf_nan=False)


class ManoObraLinea(PlatformModel):
    id: str = Field(min_length=1, max_length=100)
    item: int = Field(ge=1)
    descripcion: str = Field(min_length=1, max_length=500)
    unidad_medida: str = Field(min_length=1, max_length=30)
    cantidad: float = Field(ge=0, allow_inf_nan=False)
    rendimiento_base_oficial: float = Field(ge=0, allow_inf_nan=False)
    cant_oficiales: float = Field(ge=0, allow_inf_nan=False)
    cant_ayudantes: float = Field(ge=0, allow_inf_nan=False)
    ratio_ayudantes: float | None = Field(default=None, ge=0, allow_inf_nan=False)


class ManoObraSnapshotWrite(PlatformModel):
    revision_esperada: int | None = Field(default=None, ge=1)
    motivo: str = Field(default="Guardado de mano de obra", min_length=1, max_length=1000)
    actualizado_por_id: int | None = Field(default=None, gt=0)
    configuracion: ConfiguracionLaboralSnapshot
    actividades: list[ManoObraLinea]


class ManoObraSnapshotResponse(PlatformModel):
    version_proyecto_id: int
    guardado: bool
    revision: int | None
    configuracion: ConfiguracionLaboralSnapshot
    actividades: list[ManoObraLinea]
    total_mo: float
    algoritmo_version: str | None
    actualizado_en: datetime | None


class DiferenciaLinea(PlatformModel):
    id: str
    cambios: dict[str, dict[str, str | int | float | None]]


class ComparacionManoObraResponse(PlatformModel):
    version_origen_id: int
    version_destino_id: int
    total_origen: float
    total_destino: float
    diferencia_total: float
    configuracion_modificada: bool
    configuracion_cambios: dict[str, dict[str, str | int | float | None]]
    agregadas: list[ManoObraLinea]
    eliminadas: list[ManoObraLinea]
    modificadas: list[DiferenciaLinea]


class WbsCapituloCreate(PlatformModel):
    codigo: str = Field(min_length=1, max_length=30)
    nombre: str = Field(min_length=1, max_length=200)
    creado_por_id: int | None = Field(default=None, gt=0)


class WbsCapituloUpdate(PlatformModel):
    codigo: str | None = Field(default=None, min_length=1, max_length=30)
    nombre: str | None = Field(default=None, min_length=1, max_length=200)
    actualizado_por_id: int | None = Field(default=None, gt=0)


class WbsPartidaCreate(PlatformModel):
    codigo: str = Field(min_length=1, max_length=50)
    descripcion: str = Field(min_length=1, max_length=500)
    unidad: str = Field(min_length=1, max_length=30)
    cantidad: float = Field(default=1, ge=0, allow_inf_nan=False)
    rendimiento: float | None = Field(default=None, gt=0, allow_inf_nan=False)
    creado_por_id: int | None = Field(default=None, gt=0)


class WbsPartidaUpdate(PlatformModel):
    codigo: str | None = Field(default=None, min_length=1, max_length=50)
    descripcion: str | None = Field(default=None, min_length=1, max_length=500)
    unidad: str | None = Field(default=None, min_length=1, max_length=30)
    cantidad: float | None = Field(default=None, ge=0, allow_inf_nan=False)
    rendimiento: float | None = Field(default=None, gt=0, allow_inf_nan=False)
    actualizado_por_id: int | None = Field(default=None, gt=0)


class WbsPartidaResponse(PlatformModel):
    id: int
    capitulo_id: int
    codigo: str
    descripcion: str
    unidad: str
    cantidad: float
    rendimiento: float | None


class WbsCapituloResponse(PlatformModel):
    id: int
    proyecto_id: int
    version_proyecto_id: int
    codigo: str
    nombre: str
    partidas: list[WbsPartidaResponse]


class WbsResponse(PlatformModel):
    empresa_id: int | None
    proyecto_id: int
    version_proyecto_id: int
    numero_version: int
    capitulos: list[WbsCapituloResponse]


class APUMaestroCreate(PlatformModel):
    nombre: str = Field(min_length=1, max_length=200)
    descripcion: str = Field(min_length=1, max_length=1000)
    unidad: str = Field(min_length=1, max_length=30)
    creado_por_id: int | None = Field(default=None, gt=0)
    motivo: str = Field(default="Alta de APU maestro", min_length=1, max_length=1000)


class APUMaestroUpdate(PlatformModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=200)
    descripcion: str | None = Field(default=None, min_length=1, max_length=1000)
    unidad: str | None = Field(default=None, min_length=1, max_length=30)
    estado: str | None = Field(default=None, pattern="^(Activo|Inactivo)$")
    actualizado_por_id: int | None = Field(default=None, gt=0)
    motivo: str = Field(min_length=1, max_length=1000)


class APUMaestroResponse(PlatformModel):
    id: int
    nombre: str
    descripcion: str
    unidad: str
    estado: str
    creado_por_id: int | None
    creado_en: datetime
    actualizado_en: datetime


class APUCostoDetalle(PlatformModel):
    concepto: str = Field(min_length=1, max_length=300)
    unidad: str = Field(min_length=1, max_length=30)
    cantidad: Decimal = Field(ge=0)
    costo_unitario: Decimal | None = Field(default=None, ge=0)
    moneda: str | None = Field(default=None, min_length=3, max_length=3, pattern="^[A-Za-z]{3}$")
    material_id: int | None = Field(default=None, gt=0)
    proveedor_id: int | None = Field(default=None, gt=0)
    material_precio_id: int | None = Field(default=None, gt=0)
    snapshot_material: dict | None = None


class VersionAPUCreate(PlatformModel):
    costo_unitario: Decimal | None = Field(default=None, ge=0)
    detalle: list[APUCostoDetalle] = Field(default_factory=list)
    motivo: str = Field(min_length=1, max_length=1000)
    creado_por_id: int | None = Field(default=None, gt=0)


class VersionAPUResponse(PlatformModel):
    id: int
    apu_maestro_id: int
    numero: int
    nombre: str
    descripcion: str
    unidad: str
    costo_unitario: Decimal
    detalle: list[APUCostoDetalle]
    motivo: str
    creado_por_id: int | None
    creado_en: datetime


class UsoAPUCreate(PlatformModel):
    version_apu_id: int = Field(gt=0)
    motivo: str = Field(default="Asociación APU a partida", min_length=1, max_length=1000)
    creado_por_id: int | None = Field(default=None, gt=0)


class UsoAPUResponse(PlatformModel):
    id: int
    apu_maestro_id: int
    version_apu_id: int
    version_proyecto_id: int
    proyecto_id: int
    proyecto_nombre: str
    version_proyecto_numero: int
    partida_id: int | None
    partida_codigo: str
    partida_descripcion: str
    capitulo_codigo: str
    version_apu_numero: int
    apu_nombre: str
    snapshot: dict
    motivo: str
    creado_por_id: int | None
    creado_en: datetime
