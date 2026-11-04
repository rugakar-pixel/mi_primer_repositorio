from datetime import datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Enum as SqlEnum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TipoAPU(str, Enum):
    MATERIAL = "Material"
    MANO_DE_OBRA = "Mano de Obra"
    EQUIPO_MAQUINARIA = "Equipo/Maquinaria"


class Proyecto(Base):
    __tablename__ = "proyectos"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    ubicacion: Mapped[str | None] = mapped_column(String(250))
    estado: Mapped[str] = mapped_column(String(50), default="Borrador", server_default="Borrador", nullable=False)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    costo_total_mo: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
        default=Decimal("0.00"),
        server_default="0.00",
        nullable=False,
    )

    capitulos: Mapped[list["Capitulo"]] = relationship(
        back_populates="proyecto",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Capitulo(Base):
    __tablename__ = "capitulos"
    __table_args__ = (UniqueConstraint("proyecto_id", "codigo", name="uq_capitulos_proyecto_codigo"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    proyecto_id: Mapped[int] = mapped_column(ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False)
    codigo: Mapped[str] = mapped_column(String(30), nullable=False)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)

    proyecto: Mapped[Proyecto] = relationship(back_populates="capitulos")
    partidas: Mapped[list["Partida"]] = relationship(
        back_populates="capitulo",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Partida(Base):
    __tablename__ = "partidas"
    __table_args__ = (UniqueConstraint("capitulo_id", "codigo", name="uq_partidas_capitulo_codigo"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    capitulo_id: Mapped[int] = mapped_column(ForeignKey("capitulos.id", ondelete="CASCADE"), nullable=False)
    codigo: Mapped[str] = mapped_column(String(50), nullable=False)
    descripcion: Mapped[str] = mapped_column(String(500), nullable=False)
    unidad: Mapped[str] = mapped_column(String(30), nullable=False)
    cantidad: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)
    costo_unitario: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)
    rendimiento: Mapped[Decimal | None] = mapped_column(Numeric(18, 4))

    capitulo: Mapped[Capitulo] = relationship(back_populates="partidas")
    analisis_unitarios: Mapped[list["AnalisisPrecioUnitario"]] = relationship(
        back_populates="partida",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class AnalisisPrecioUnitario(Base):
    __tablename__ = "analisis_precios_unitarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    partida_id: Mapped[int] = mapped_column(ForeignKey("partidas.id", ondelete="CASCADE"), nullable=False)
    tipo: Mapped[TipoAPU] = mapped_column(
        SqlEnum(
            TipoAPU,
            name="tipo_apu",
            values_callable=lambda enum_type: [member.value for member in enum_type],
        ),
        nullable=False,
    )
    descripcion: Mapped[str] = mapped_column(String(300), nullable=False)
    unidad: Mapped[str] = mapped_column(String(30), nullable=False)
    cantidad: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)
    costo_unitario: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)
    rendimiento: Mapped[Decimal | None] = mapped_column(Numeric(18, 4))

    partida: Mapped[Partida] = relationship(back_populates="analisis_unitarios")


class MaestroPartidas(Base):
    __tablename__ = "maestro_partidas"

    id: Mapped[int] = mapped_column(primary_key=True)
    codigo: Mapped[str] = mapped_column(String(50), nullable=False, unique=True, index=True)
    descripcion: Mapped[str] = mapped_column(String(500), nullable=False)
    unidad: Mapped[str] = mapped_column(String(30), nullable=False)
    costo_unitario: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)
    categoria: Mapped[str] = mapped_column(
        String(80),
        default="General",
        server_default="General",
        nullable=False,
        index=True,
    )
    fecha_actualizacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now().astimezone(),
        onupdate=func.now(),
        server_default=func.now(),
        nullable=False,
    )

    material: Mapped["Material | None"] = relationship(back_populates="maestro_partida")


class CategoriaMaterial(Base):
    __tablename__ = "categorias_materiales"
    __table_args__ = (
        UniqueConstraint("codigo", name="uq_categorias_materiales_codigo"),
        UniqueConstraint("nombre", name="uq_categorias_materiales_nombre"),
        CheckConstraint("length(trim(codigo)) > 0", name="ck_categorias_materiales_codigo_no_vacio"),
        CheckConstraint("length(trim(nombre)) > 0", name="ck_categorias_materiales_nombre_no_vacio"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    codigo: Mapped[str] = mapped_column(String(50), nullable=False)
    nombre: Mapped[str] = mapped_column(String(120), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true", nullable=False)
    creado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    materiales: Mapped[list["Material"]] = relationship(back_populates="categoria")


class Proveedor(Base):
    __tablename__ = "proveedores"
    __table_args__ = (
        UniqueConstraint("ruc", name="uq_proveedores_ruc"),
        CheckConstraint("length(trim(nombre)) > 0", name="ck_proveedores_nombre_no_vacio"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    ruc: Mapped[str | None] = mapped_column(String(20))
    telefono: Mapped[str | None] = mapped_column(String(40))
    correo: Mapped[str | None] = mapped_column(String(254))
    activo: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true", nullable=False)
    creado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    precios: Mapped[list["MaterialPrecio"]] = relationship(back_populates="proveedor")


class Material(Base):
    __tablename__ = "materiales"
    __table_args__ = (
        UniqueConstraint("codigo", name="uq_materiales_codigo"),
        UniqueConstraint("maestro_partida_id", name="uq_materiales_maestro_partida"),
        CheckConstraint("length(trim(codigo)) > 0", name="ck_materiales_codigo_no_vacio"),
        CheckConstraint("length(trim(descripcion)) > 0", name="ck_materiales_descripcion_no_vacia"),
        CheckConstraint("length(trim(unidad)) > 0", name="ck_materiales_unidad_no_vacia"),
        Index("ix_materiales_categoria_activo", "categoria_id", "activo"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    codigo: Mapped[str] = mapped_column(String(50), nullable=False)
    descripcion: Mapped[str] = mapped_column(String(500), nullable=False)
    unidad: Mapped[str] = mapped_column(String(30), nullable=False)
    categoria_id: Mapped[int] = mapped_column(
        ForeignKey("categorias_materiales.id", ondelete="RESTRICT"),
        nullable=False,
    )
    maestro_partida_id: Mapped[int | None] = mapped_column(
        ForeignKey("maestro_partidas.id", ondelete="RESTRICT"),
    )
    activo: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true", nullable=False)
    creado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    categoria: Mapped[CategoriaMaterial] = relationship(back_populates="materiales")
    maestro_partida: Mapped[MaestroPartidas | None] = relationship(back_populates="material")
    precios: Mapped[list["MaterialPrecio"]] = relationship(
        back_populates="material",
        order_by=lambda: MaterialPrecio.fecha_vigencia.desc(),
    )


class MaterialPrecio(Base):
    __tablename__ = "materiales_precios"
    __table_args__ = (
        CheckConstraint("costo_unitario >= 0", name="ck_materiales_precios_costo_no_negativo"),
        CheckConstraint("length(moneda) = 3", name="ck_materiales_precios_moneda_iso"),
        CheckConstraint("moneda = upper(moneda)", name="ck_materiales_precios_moneda_mayusculas"),
        CheckConstraint("length(trim(unidad_precio)) > 0", name="ck_materiales_precios_unidad_no_vacia"),
        Index(
            "ix_materiales_precios_material_proveedor_vigencia",
            "material_id",
            "proveedor_id",
            "fecha_vigencia",
            "registrado_en",
        ),
        Index("ix_materiales_precios_material_vigencia", "material_id", "fecha_vigencia"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    material_id: Mapped[int] = mapped_column(
        ForeignKey("materiales.id", ondelete="RESTRICT"),
        nullable=False,
    )
    proveedor_id: Mapped[int] = mapped_column(
        ForeignKey("proveedores.id", ondelete="RESTRICT"),
        nullable=False,
    )
    costo_unitario: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)
    moneda: Mapped[str] = mapped_column(String(3), default="NIO", server_default="NIO", nullable=False)
    unidad_precio: Mapped[str] = mapped_column(String(30), nullable=False)
    fecha_vigencia: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    registrado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    observacion: Mapped[str | None] = mapped_column(Text)

    material: Mapped[Material] = relationship(back_populates="precios")
    proveedor: Mapped[Proveedor] = relationship(back_populates="precios")
