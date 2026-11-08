from __future__ import annotations

from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.database_models import (
    AuditoriaEvento,
    PresupuestoMOBorrador,
    PresupuestoMOLinea,
    VersionProyecto,
)
from app.schemas.plataforma import (
    ConfiguracionLaboralSnapshot,
    ManoObraLinea,
    ManoObraSnapshotResponse,
)


def registrar_auditoria(
    db: Session,
    *,
    accion: str,
    entidad_tipo: str,
    entidad_id: int | str,
    actor_usuario_id: int | None = None,
    empresa_id: int | None = None,
    proyecto_id: int | None = None,
    version_proyecto_id: int | None = None,
    motivo: str | None = None,
    anteriores: dict | None = None,
    nuevos: dict | None = None,
    origen: str = "api",
) -> AuditoriaEvento:
    evento = AuditoriaEvento(
        actor_usuario_id=actor_usuario_id,
        actor_tipo="usuario" if actor_usuario_id is not None else "no_autenticado",
        empresa_id=empresa_id,
        proyecto_id=proyecto_id,
        version_proyecto_id=version_proyecto_id,
        accion=accion,
        entidad_tipo=entidad_tipo,
        entidad_id=str(entidad_id),
        motivo=motivo,
        origen=origen,
        valores_anteriores=anteriores,
        valores_nuevos=nuevos,
    )
    db.add(evento)
    return evento


def total_mano_obra(
    configuracion: ConfiguracionLaboralSnapshot,
    actividades: list[ManoObraLinea],
) -> Decimal:
    config = configuracion
    salario_ayudante = Decimal(str(config.salario_minimo_mensual)) / Decimal(str(config.dias_mes_comercial))
    salario_oficial = salario_ayudante * Decimal(str(config.factor_oficial))
    fsr = Decimal("1") + sum(
        (
            Decimal(str(config.pct_aguinaldo)),
            Decimal(str(config.pct_vacaciones)),
            Decimal(str(config.pct_inss_patronal)),
            Decimal(str(config.pct_inatec)),
            Decimal(str(config.pct_indemnizacion)),
        ),
        Decimal("0"),
    )
    total = Decimal("0")
    for actividad in actividades:
        rendimiento_total = (
            Decimal(str(actividad.rendimiento_base_oficial))
            * Decimal(str(actividad.cant_oficiales))
        )
        if rendimiento_total <= 0:
            continue
        costo_diario = (
            Decimal(str(actividad.cant_oficiales)) * salario_oficial
            + Decimal(str(actividad.cant_ayudantes)) * salario_ayudante
        ) * fsr
        total += (
            Decimal(str(actividad.cantidad))
            * costo_diario
            / rendimiento_total
        )
    return total.quantize(Decimal("0.0001"))


def cargar_snapshot_mo(
    db: Session,
    version: VersionProyecto,
    *,
    bloquear: bool = False,
) -> PresupuestoMOBorrador | None:
    statement = (
        select(PresupuestoMOBorrador)
        .options(selectinload(PresupuestoMOBorrador.lineas))
        .where(PresupuestoMOBorrador.version_proyecto_id == version.id)
    )
    if bloquear:
        statement = statement.with_for_update()
    return db.scalar(statement)


def serializar_snapshot_mo(
    version_id: int,
    snapshot: PresupuestoMOBorrador | None,
    configuracion_default: ConfiguracionLaboralSnapshot,
) -> ManoObraSnapshotResponse:
    if snapshot is None:
        return ManoObraSnapshotResponse(
            version_proyecto_id=version_id,
            guardado=False,
            revision=None,
            configuracion=configuracion_default,
            actividades=[],
            total_mo=0,
            algoritmo_version=None,
            actualizado_en=None,
        )
    actividades = [
        ManoObraLinea(
            id=linea.id_origen,
            item=linea.item,
            descripcion=linea.descripcion,
            unidad_medida=linea.unidad_medida,
            cantidad=float(linea.cantidad),
            rendimiento_base_oficial=float(linea.rendimiento_base),
            cant_oficiales=float(linea.cant_oficiales),
            cant_ayudantes=float(linea.cant_ayudantes),
            ratio_ayudantes=(
                float(linea.ratio_ayudantes) if linea.ratio_ayudantes is not None else None
            ),
        )
        for linea in snapshot.lineas
    ]
    return ManoObraSnapshotResponse(
        version_proyecto_id=version_id,
        guardado=True,
        revision=snapshot.revision,
        configuracion=ConfiguracionLaboralSnapshot.model_validate(snapshot.configuracion),
        actividades=actividades,
        total_mo=float(snapshot.total_mo),
        algoritmo_version=snapshot.algoritmo_version,
        actualizado_en=snapshot.actualizado_en.isoformat() if snapshot.actualizado_en else None,
    )


def reemplazar_lineas_mo(
    db: Session,
    snapshot: PresupuestoMOBorrador,
    actividades: list[ManoObraLinea],
) -> None:
    snapshot.lineas.clear()
    db.flush()
    snapshot.lineas.extend(
        PresupuestoMOLinea(
            orden=orden,
            id_origen=actividad.id,
            item=actividad.item,
            descripcion=actividad.descripcion,
            unidad_medida=actividad.unidad_medida,
            cantidad=Decimal(str(actividad.cantidad)),
            rendimiento_base=Decimal(str(actividad.rendimiento_base_oficial)),
            cant_oficiales=Decimal(str(actividad.cant_oficiales)),
            cant_ayudantes=Decimal(str(actividad.cant_ayudantes)),
            ratio_ayudantes=(
                Decimal(str(actividad.ratio_ayudantes))
                if actividad.ratio_ayudantes is not None
                else None
            ),
        )
        for orden, actividad in enumerate(actividades, start=1)
    )
