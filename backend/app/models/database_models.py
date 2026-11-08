from datetime import datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import (
    JSON,
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
    text,
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
    empresa_id: Mapped[int | None] = mapped_column(
        ForeignKey("empresas.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )

    capitulos: Mapped[list["Capitulo"]] = relationship(
        back_populates="proyecto",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    versiones: Mapped[list["VersionProyecto"]] = relationship(
        back_populates="proyecto",
        order_by="VersionProyecto.numero",
    )


class Empresa(Base):
    __tablename__ = "empresas"
    __table_args__ = (
        CheckConstraint("length(trim(nombre)) > 0", name="ck_empresas_nombre_no_vacio"),
        CheckConstraint(
            "length(pais) = 2 AND pais = upper(pais)",
            name="ck_empresas_pais_iso",
        ),
        CheckConstraint(
            "length(moneda_base) = 3 AND moneda_base = upper(moneda_base)",
            name="ck_empresas_moneda_base_iso",
        ),
        Index("ix_empresas_estado", "estado"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    razon_social: Mapped[str | None] = mapped_column(String(250))
    identificacion_fiscal: Mapped[str | None] = mapped_column(String(40), unique=True)
    pais: Mapped[str] = mapped_column(String(2), default="NI", server_default="NI", nullable=False)
    moneda_base: Mapped[str] = mapped_column(String(3), default="NIO", server_default="NIO", nullable=False)
    estado: Mapped[str] = mapped_column(String(30), default="Activa", server_default="Activa", nullable=False)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    proyectos: Mapped[list["Proyecto"]] = relationship(backref="empresa")
    membresias: Mapped[list["MembresiaEmpresa"]] = relationship(back_populates="empresa")


class Usuario(Base):
    __tablename__ = "usuarios"
    __table_args__ = (
        UniqueConstraint("correo_normalizado", name="uq_usuarios_correo_normalizado"),
        CheckConstraint("length(trim(nombre)) > 0", name="ck_usuarios_nombre_no_vacio"),
        CheckConstraint("length(trim(correo_normalizado)) > 0", name="ck_usuarios_correo_no_vacio"),
        Index("ix_usuarios_estado", "estado"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    correo: Mapped[str] = mapped_column(String(254), nullable=False)
    correo_normalizado: Mapped[str] = mapped_column(String(254), nullable=False)
    estado: Mapped[str] = mapped_column(String(30), default="Activo", server_default="Activo", nullable=False)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    membresias: Mapped[list["MembresiaEmpresa"]] = relationship(back_populates="usuario")


class MembresiaEmpresa(Base):
    __tablename__ = "membresias_empresa"
    __table_args__ = (
        UniqueConstraint("empresa_id", "usuario_id", name="uq_membresias_empresa_usuario"),
        CheckConstraint(
            "rol IN ('Administrador', 'Editor', 'Lector')",
            name="ck_membresias_empresa_rol",
        ),
        Index("ix_membresias_usuario_estado", "usuario_id", "estado"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    empresa_id: Mapped[int] = mapped_column(ForeignKey("empresas.id", ondelete="RESTRICT"), nullable=False)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="RESTRICT"), nullable=False)
    rol: Mapped[str] = mapped_column(String(30), default="Editor", server_default="Editor", nullable=False)
    estado: Mapped[str] = mapped_column(String(30), default="Activa", server_default="Activa", nullable=False)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    empresa: Mapped[Empresa] = relationship(back_populates="membresias")
    usuario: Mapped[Usuario] = relationship(back_populates="membresias")


class VersionProyecto(Base):
    __tablename__ = "versiones_proyecto"
    __table_args__ = (
        UniqueConstraint("proyecto_id", "numero", name="uq_versiones_proyecto_numero"),
        CheckConstraint("numero > 0", name="ck_versiones_proyecto_numero_positivo"),
        Index("ix_versiones_proyecto_proyecto_creado", "proyecto_id", "creado_en"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    proyecto_id: Mapped[int] = mapped_column(ForeignKey("proyectos.id", ondelete="RESTRICT"), nullable=False)
    numero: Mapped[int] = mapped_column(Integer, nullable=False)
    estado: Mapped[str] = mapped_column(String(30), default="Borrador", server_default="Borrador", nullable=False)
    motivo: Mapped[str] = mapped_column(Text, nullable=False)
    version_anterior_id: Mapped[int | None] = mapped_column(
        ForeignKey("versiones_proyecto.id", ondelete="RESTRICT"),
    )
    creado_por_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id", ondelete="SET NULL"))
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    proyecto: Mapped[Proyecto] = relationship(back_populates="versiones")
    version_anterior: Mapped["VersionProyecto | None"] = relationship(remote_side="VersionProyecto.id")
    mano_obra: Mapped["PresupuestoMOBorrador | None"] = relationship(
        back_populates="version_proyecto",
        uselist=False,
    )
    capitulos: Mapped[list["Capitulo"]] = relationship(
        back_populates="version_proyecto",
        order_by="Capitulo.codigo",
    )


class AuditoriaEvento(Base):
    __tablename__ = "auditoria_eventos"
    __table_args__ = (
        Index("ix_auditoria_entidad", "entidad_tipo", "entidad_id", "creado_en"),
        Index("ix_auditoria_proyecto_creado", "proyecto_id", "creado_en"),
        Index("ix_auditoria_empresa_creado", "empresa_id", "creado_en"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    actor_usuario_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id", ondelete="SET NULL"))
    actor_tipo: Mapped[str] = mapped_column(String(30), default="usuario", server_default="usuario", nullable=False)
    empresa_id: Mapped[int | None] = mapped_column(ForeignKey("empresas.id", ondelete="SET NULL"))
    proyecto_id: Mapped[int | None] = mapped_column(ForeignKey("proyectos.id", ondelete="SET NULL"))
    version_proyecto_id: Mapped[int | None] = mapped_column(
        ForeignKey("versiones_proyecto.id", ondelete="SET NULL"),
    )
    accion: Mapped[str] = mapped_column(String(60), nullable=False)
    entidad_tipo: Mapped[str] = mapped_column(String(80), nullable=False)
    entidad_id: Mapped[str] = mapped_column(String(80), nullable=False)
    motivo: Mapped[str | None] = mapped_column(Text)
    origen: Mapped[str] = mapped_column(String(80), default="api", server_default="api", nullable=False)
    correlacion_id: Mapped[str | None] = mapped_column(String(100))
    valores_anteriores: Mapped[dict | None] = mapped_column(JSON)
    valores_nuevos: Mapped[dict | None] = mapped_column(JSON)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class APUMaestro(Base):
    __tablename__ = "apus_maestros"
    __table_args__ = (
        CheckConstraint("length(trim(nombre)) > 0", name="ck_apus_maestros_nombre_no_vacio"),
        CheckConstraint("length(trim(unidad)) > 0", name="ck_apus_maestros_unidad_no_vacia"),
        CheckConstraint("estado IN ('Activo', 'Inactivo')", name="ck_apus_maestros_estado"),
        Index("ix_apus_maestros_estado_nombre", "estado", "nombre"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    descripcion: Mapped[str] = mapped_column(String(1000), nullable=False)
    unidad: Mapped[str] = mapped_column(String(30), nullable=False)
    estado: Mapped[str] = mapped_column(String(30), default="Activo", server_default="Activo", nullable=False)
    creado_por_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id", ondelete="SET NULL"))
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    versiones: Mapped[list["VersionAPU"]] = relationship(
        back_populates="apu_maestro",
        order_by="VersionAPU.numero",
        passive_deletes=True,
    )


class VersionAPU(Base):
    __tablename__ = "versiones_apu"
    __table_args__ = (
        UniqueConstraint("apu_maestro_id", "numero", name="uq_versiones_apu_maestro_numero"),
        CheckConstraint("numero > 0", name="ck_versiones_apu_numero_positivo"),
        CheckConstraint("costo_unitario >= 0", name="ck_versiones_apu_costo_no_negativo"),
        Index("ix_versiones_apu_maestro_creado", "apu_maestro_id", "creado_en"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    apu_maestro_id: Mapped[int] = mapped_column(
        ForeignKey("apus_maestros.id", ondelete="RESTRICT"),
        nullable=False,
    )
    numero: Mapped[int] = mapped_column(Integer, nullable=False)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    descripcion: Mapped[str] = mapped_column(String(1000), nullable=False)
    unidad: Mapped[str] = mapped_column(String(30), nullable=False)
    costo_unitario: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)
    detalle: Mapped[list[dict]] = mapped_column(
        JSON,
        nullable=False,
        default=list,
        server_default=text("'[]'"),
    )
    motivo: Mapped[str] = mapped_column(Text, nullable=False)
    creado_por_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id", ondelete="SET NULL"))
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    apu_maestro: Mapped[APUMaestro] = relationship(back_populates="versiones")
    usos: Mapped[list["UsoAPU"]] = relationship(back_populates="version_apu", passive_deletes=True)


class PresupuestoMOBorrador(Base):
    __tablename__ = "presupuestos_mo_versiones"
    __table_args__ = (
        UniqueConstraint("version_proyecto_id", name="uq_presupuestos_mo_version_proyecto"),
        CheckConstraint("revision > 0", name="ck_presupuestos_mo_revision_positiva"),
        CheckConstraint("total_mo >= 0", name="ck_presupuestos_mo_total_no_negativo"),
        Index("ix_presupuestos_mo_actualizado", "actualizado_en"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    version_proyecto_id: Mapped[int] = mapped_column(
        ForeignKey("versiones_proyecto.id", ondelete="RESTRICT"),
        nullable=False,
    )
    configuracion: Mapped[dict] = mapped_column(JSON, nullable=False)
    revision: Mapped[int] = mapped_column(Integer, default=1, server_default="1", nullable=False)
    total_mo: Mapped[Decimal] = mapped_column(Numeric(18, 4), default=Decimal("0"), nullable=False)
    algoritmo_version: Mapped[str] = mapped_column(String(40), default="mo-2026-v1", nullable=False)
    actualizado_por_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id", ondelete="SET NULL"))
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    version_proyecto: Mapped[VersionProyecto] = relationship(back_populates="mano_obra")
    lineas: Mapped[list["PresupuestoMOLinea"]] = relationship(
        back_populates="presupuesto_mo",
        order_by="PresupuestoMOLinea.orden",
        cascade="all, delete-orphan",
    )


class PresupuestoMOLinea(Base):
    __tablename__ = "presupuestos_mo_lineas"
    __table_args__ = (
        UniqueConstraint("presupuesto_mo_id", "orden", name="uq_presupuestos_mo_lineas_orden"),
        CheckConstraint("cantidad >= 0", name="ck_presupuestos_mo_lineas_cantidad"),
        CheckConstraint("rendimiento_base >= 0", name="ck_presupuestos_mo_lineas_rendimiento"),
        CheckConstraint("cant_oficiales >= 0", name="ck_presupuestos_mo_lineas_oficiales"),
        CheckConstraint("cant_ayudantes >= 0", name="ck_presupuestos_mo_lineas_ayudantes"),
        CheckConstraint("item > 0", name="ck_presupuestos_mo_lineas_item"),
        CheckConstraint(
            "length(trim(descripcion)) > 0",
            name="ck_presupuestos_mo_lineas_descripcion",
        ),
        CheckConstraint(
            "length(trim(unidad_medida)) > 0",
            name="ck_presupuestos_mo_lineas_unidad",
        ),
        Index("ix_presupuestos_mo_lineas_presupuesto", "presupuesto_mo_id", "orden"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    presupuesto_mo_id: Mapped[int] = mapped_column(
        ForeignKey("presupuestos_mo_versiones.id", ondelete="RESTRICT"),
        nullable=False,
    )
    orden: Mapped[int] = mapped_column(Integer, nullable=False)
    id_origen: Mapped[str] = mapped_column(String(100), nullable=False)
    item: Mapped[int] = mapped_column(Integer, nullable=False)
    descripcion: Mapped[str] = mapped_column(String(500), nullable=False)
    unidad_medida: Mapped[str] = mapped_column(String(30), nullable=False)
    cantidad: Mapped[Decimal] = mapped_column(Numeric(18, 6), nullable=False)
    rendimiento_base: Mapped[Decimal] = mapped_column(Numeric(18, 6), nullable=False)
    cant_oficiales: Mapped[Decimal] = mapped_column(Numeric(18, 6), nullable=False)
    cant_ayudantes: Mapped[Decimal] = mapped_column(Numeric(18, 6), nullable=False)
    ratio_ayudantes: Mapped[Decimal | None] = mapped_column(Numeric(18, 6))

    presupuesto_mo: Mapped[PresupuestoMOBorrador] = relationship(back_populates="lineas")


class Capitulo(Base):
    __tablename__ = "capitulos"
    __table_args__ = (
        UniqueConstraint("version_proyecto_id", "codigo", name="uq_capitulos_version_codigo"),
        Index("ix_capitulos_version_proyecto", "version_proyecto_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    proyecto_id: Mapped[int] = mapped_column(ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False)
    version_proyecto_id: Mapped[int | None] = mapped_column(
        ForeignKey("versiones_proyecto.id", ondelete="RESTRICT"),
        nullable=True,
    )
    codigo: Mapped[str] = mapped_column(String(30), nullable=False)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)

    proyecto: Mapped[Proyecto] = relationship(back_populates="capitulos")
    version_proyecto: Mapped[VersionProyecto | None] = relationship(back_populates="capitulos")
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
    usos_apu: Mapped[list["UsoAPU"]] = relationship(back_populates="partida", passive_deletes=True)


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


class UsoAPU(Base):
    __tablename__ = "usos_apu"
    __table_args__ = (
        Index("ix_usos_apu_version_proyecto", "version_proyecto_id", "creado_en"),
        Index("ix_usos_apu_partida", "partida_id", "creado_en"),
        Index("ix_usos_apu_version_apu", "version_apu_id", "creado_en"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    version_apu_id: Mapped[int] = mapped_column(
        ForeignKey("versiones_apu.id", ondelete="RESTRICT"),
        nullable=False,
    )
    version_proyecto_id: Mapped[int] = mapped_column(
        ForeignKey("versiones_proyecto.id", ondelete="RESTRICT"),
        nullable=False,
    )
    partida_id: Mapped[int | None] = mapped_column(ForeignKey("partidas.id", ondelete="SET NULL"))
    partida_codigo: Mapped[str] = mapped_column(String(50), nullable=False)
    partida_descripcion: Mapped[str] = mapped_column(String(500), nullable=False)
    capitulo_codigo: Mapped[str] = mapped_column(String(30), nullable=False)
    proyecto_nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    version_proyecto_numero: Mapped[int] = mapped_column(Integer, nullable=False)
    apu_nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    version_apu_numero: Mapped[int] = mapped_column(Integer, nullable=False)
    snapshot: Mapped[dict] = mapped_column(JSON, nullable=False)
    motivo: Mapped[str] = mapped_column(Text, nullable=False)
    creado_por_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id", ondelete="SET NULL"))
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    version_apu: Mapped[VersionAPU] = relationship(back_populates="usos")
    version_proyecto: Mapped[VersionProyecto] = relationship()
    partida: Mapped[Partida | None] = relationship(back_populates="usos_apu")


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
    origen: Mapped[str] = mapped_column(
        String(100),
        default="manual",
        server_default="manual",
        nullable=False,
    )
    referencia_cotizacion: Mapped[str | None] = mapped_column(String(200))
    observacion: Mapped[str | None] = mapped_column(Text)

    material: Mapped[Material] = relationship(back_populates="precios")
    proveedor: Mapped[Proveedor] = relationship(back_populates="precios")
