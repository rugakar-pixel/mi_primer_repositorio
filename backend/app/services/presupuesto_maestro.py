from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import Session, selectinload

from app.models.database_models import (
    Capitulo,
    Partida,
    PresupuestoMaestro,
    PresupuestoMaestroCapitulo,
    PresupuestoMaestroPartida,
    Proyecto,
    UsoAPU,
    VersionAPU,
    VersionProyecto,
)
from app.services.plataforma import registrar_auditoria


MONEY_PLACES = Decimal("0.0001")


def _money(value: Decimal) -> Decimal:
    return value.quantize(MONEY_PLACES, rounding=ROUND_HALF_UP)


def _context(db: Session, proyecto_id: int, version_id: int) -> tuple[Proyecto, VersionProyecto]:
    project = db.get(Proyecto, proyecto_id)
    version = db.get(VersionProyecto, version_id)
    if project is None:
        raise HTTPException(status_code=404, detail="El proyecto no existe.")
    if version is None or version.proyecto_id != project.id:
        raise HTTPException(status_code=404, detail="La versión no pertenece al proyecto indicado.")
    return project, version


def _latest_usages(db: Session, version_id: int, partida_ids: list[int]) -> dict[int, tuple[UsoAPU, VersionAPU]]:
    if not partida_ids:
        return {}
    rows = db.execute(
        select(UsoAPU, VersionAPU)
        .join(VersionAPU, VersionAPU.id == UsoAPU.version_apu_id)
        .where(
            UsoAPU.version_proyecto_id == version_id,
            UsoAPU.partida_id.in_(partida_ids),
        )
        .order_by(UsoAPU.creado_en.desc(), UsoAPU.id.desc())
    ).all()
    result: dict[int, tuple[UsoAPU, VersionAPU]] = {}
    for usage, apu_version in rows:
        if usage.partida_id is not None and usage.partida_id not in result:
            result[usage.partida_id] = (usage, apu_version)
    return result


def calcular_presupuesto_maestro(
    db: Session,
    proyecto_id: int,
    version_id: int,
    *,
    actor_id: int | None = None,
    motivo: str = "Cálculo del Presupuesto Maestro",
) -> PresupuestoMaestro:
    project, version = _context(db, proyecto_id, version_id)
    chapters = db.scalars(
        select(Capitulo)
        .options(selectinload(Capitulo.partidas))
        .where(
            Capitulo.proyecto_id == project.id,
            Capitulo.version_proyecto_id == version.id,
        )
        .order_by(Capitulo.codigo, Capitulo.id)
    ).all()
    parts = [part for chapter in chapters for part in chapter.partidas]
    usages = _latest_usages(db, version.id, [part.id for part in parts])

    master = db.scalar(
        select(PresupuestoMaestro).where(PresupuestoMaestro.version_proyecto_id == version.id)
    )
    previous = None
    if master is None:
        master = PresupuestoMaestro(
            proyecto_id=project.id,
            version_proyecto_id=version.id,
            moneda=project.empresa.moneda_base if project.empresa is not None else "NIO",
            actualizado_por_id=actor_id,
        )
        db.add(master)
        db.flush()
    else:
        previous = {"total_general": str(master.total_general), "revision": master.revision}
        master.revision += 1
        master.actualizado_por_id = actor_id

    db.execute(delete(PresupuestoMaestroPartida).where(PresupuestoMaestroPartida.presupuesto_maestro_id == master.id))
    db.execute(delete(PresupuestoMaestroCapitulo).where(PresupuestoMaestroCapitulo.presupuesto_maestro_id == master.id))

    general = Decimal("0")
    for chapter in chapters:
        chapter_total = Decimal("0")
        for part in sorted(chapter.partidas, key=lambda item: (item.codigo, item.id)):
            usage_and_apu = usages.get(part.id)
            if usage_and_apu is not None:
                usage, apu_version = usage_and_apu
                unit_cost = Decimal(str(apu_version.costo_unitario))
                source = "uso_apu"
                apu_id = apu_version.id
                usage_id = usage.id
            else:
                unit_cost = Decimal(str(part.costo_unitario or 0))
                source = "partida_persistida"
                apu_id = None
                usage_id = None
            quantity = Decimal(str(part.cantidad))
            total = _money(quantity * unit_cost)
            chapter_total += total
            db.add(
                PresupuestoMaestroPartida(
                    presupuesto_maestro_id=master.id,
                    partida_id=part.id,
                    capitulo_id=chapter.id,
                    codigo=part.codigo,
                    descripcion=part.descripcion,
                    unidad=part.unidad,
                    cantidad=quantity,
                    costo_unitario=_money(unit_cost),
                    total=total,
                    origen_costo=source,
                    version_apu_id=apu_id,
                    uso_apu_id=usage_id,
                )
            )
        chapter_total = _money(chapter_total)
        general += chapter_total
        db.add(
            PresupuestoMaestroCapitulo(
                presupuesto_maestro_id=master.id,
                capitulo_id=chapter.id,
                codigo=chapter.codigo,
                nombre=chapter.nombre,
                total=chapter_total,
                cantidad_partidas=len(chapter.partidas),
            )
        )

    master.total_general = _money(general)
    master.estado = "Borrador"
    registrar_auditoria(
        db,
        accion="recalcular" if previous is not None else "crear",
        entidad_tipo="presupuesto_maestro",
        entidad_id=master.id,
        actor_usuario_id=actor_id,
        empresa_id=project.empresa_id,
        proyecto_id=project.id,
        version_proyecto_id=version.id,
        motivo=motivo.strip(),
        anteriores=previous,
        nuevos={
            "total_general": str(master.total_general),
            "revision": master.revision,
            "capitulos": len(chapters),
            "partidas": len(parts),
        },
    )
    db.commit()
    db.refresh(master)
    return master


def actualizar_costo_partida(
    db: Session,
    proyecto_id: int,
    version_id: int,
    capitulo_id: int,
    partida_id: int,
    costo_unitario: Decimal,
    *,
    actor_id: int | None = None,
    motivo: str,
) -> PresupuestoMaestro:
    project, version = _context(db, proyecto_id, version_id)
    part = db.scalar(
        select(Partida)
        .join(Capitulo, Partida.capitulo_id == Capitulo.id)
        .where(
            Partida.id == partida_id,
            Capitulo.id == capitulo_id,
            Capitulo.proyecto_id == project.id,
            Capitulo.version_proyecto_id == version.id,
        )
    )
    if part is None:
        raise HTTPException(status_code=404, detail="La partida no existe en la versión indicada.")
    old_value = str(part.costo_unitario)
    part.costo_unitario = _money(costo_unitario)
    registrar_auditoria(
        db,
        accion="actualizar_costo",
        entidad_tipo="partida",
        entidad_id=part.id,
        actor_usuario_id=actor_id,
        empresa_id=project.empresa_id,
        proyecto_id=project.id,
        version_proyecto_id=version.id,
        motivo=motivo.strip(),
        anteriores={"costo_unitario": old_value},
        nuevos={"costo_unitario": str(part.costo_unitario)},
    )
    db.flush()
    return calcular_presupuesto_maestro(
        db,
        proyecto_id,
        version_id,
        actor_id=actor_id,
        motivo=motivo,
    )
