from datetime import datetime
from decimal import Decimal

from pydantic import Field

from app.schemas.plataforma import PlatformModel


class CategoriaMaterialCreate(PlatformModel):
    codigo: str = Field(min_length=1, max_length=50)
    nombre: str = Field(min_length=1, max_length=120)
    descripcion: str | None = Field(default=None, max_length=2000)
    creado_por_id: int = Field(gt=0)
    motivo: str = Field(min_length=1, max_length=1000)


class CategoriaMaterialResponse(PlatformModel):
    id: int
    codigo: str
    nombre: str
    descripcion: str | None
    activo: bool


class MaterialCreate(PlatformModel):
    codigo: str = Field(min_length=1, max_length=50)
    descripcion: str = Field(min_length=1, max_length=500)
    unidad: str = Field(min_length=1, max_length=30)
    categoria_id: int = Field(gt=0)
    maestro_partida_id: int | None = Field(default=None, gt=0)
    creado_por_id: int = Field(gt=0)
    motivo: str = Field(min_length=1, max_length=1000)


class MaterialResponse(PlatformModel):
    id: int
    codigo: str
    descripcion: str
    unidad: str
    categoria_id: int
    categoria_nombre: str
    activo: bool


class ProveedorCreate(PlatformModel):
    nombre: str = Field(min_length=1, max_length=200)
    ruc: str | None = Field(default=None, max_length=20)
    telefono: str | None = Field(default=None, max_length=40)
    correo: str | None = Field(default=None, max_length=254)
    creado_por_id: int = Field(gt=0)
    motivo: str = Field(min_length=1, max_length=1000)


class ProveedorResponse(PlatformModel):
    id: int
    nombre: str
    ruc: str | None
    telefono: str | None
    correo: str | None
    activo: bool


class CotizacionMaterialCreate(PlatformModel):
    proveedor_id: int = Field(gt=0)
    costo_unitario: Decimal = Field(ge=0)
    moneda: str = Field(default="NIO", min_length=3, max_length=3, pattern="^[A-Za-z]{3}$")
    unidad_precio: str = Field(min_length=1, max_length=30)
    fecha_vigencia: datetime
    origen: str = Field(default="manual", min_length=1, max_length=100)
    referencia_cotizacion: str | None = Field(default=None, max_length=200)
    observacion: str | None = Field(default=None, max_length=2000)
    creado_por_id: int = Field(gt=0)
    motivo: str = Field(min_length=1, max_length=1000)


class CotizacionMaterialResponse(PlatformModel):
    id: int
    material_id: int
    material_descripcion: str
    proveedor_id: int
    proveedor_nombre: str
    costo_unitario: Decimal
    moneda: str
    unidad_precio: str
    fecha_vigencia: datetime
    registrado_en: datetime
    origen: str
    referencia_cotizacion: str | None
    observacion: str | None
