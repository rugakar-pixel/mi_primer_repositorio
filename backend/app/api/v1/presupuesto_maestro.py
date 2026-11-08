from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db.session import get_db
from app.models.database_models import PresupuestoMaestro
from app.schemas.presupuesto_maestro import (
    PresupuestoMaestroCalcular,
    PresupuestoMaestroCosto,
    PresupuestoMaestroResponse,
    PresupuestoMaestroCapituloResponse,
    PresupuestoMaestroPartidaResponse,
)
from app.services.presupuesto_maestro import (
    _context,
    actualizar_costo_partida,
    calcular_presupuesto_maestro,
)


router = APIRouter(tags=["presupuesto-maestro-fase-2d1"])


def _response(master: PresupuestoMaestro) -> PresupuestoMaestroResponse:
    chapters = []
    parts_by_chapter: dict[int, list[PresupuestoMaestroPartidaResponse]] = {}
    for part in master.partidas:
        parts_by_chapter.setdefault(part.capitulo_id, []).append(
            PresupuestoMaestroPartidaResponse(
                id=part.id,
                partida_id=part.partida_id,
                capitulo_id=part.capitulo_id,
                codigo=part.codigo,
                descripcion=part.descripcion,
                unidad=part.unidad,
                cantidad=part.cantidad,
                costo_unitario=part.costo_unitario,
                total=part.total,
                origen_costo=part.origen_costo,
                version_apu_id=part.version_apu_id,
                uso_apu_id=part.uso_apu_id,
            )
        )
    for chapter in master.capitulos:
        chapters.append(
            PresupuestoMaestroCapituloResponse(
                id=chapter.id,
                capitulo_id=chapter.capitulo_id,
                codigo=chapter.codigo,
                nombre=chapter.nombre,
                total=chapter.total,
                cantidad_partidas=chapter.cantidad_partidas,
                partidas=parts_by_chapter.get(chapter.capitulo_id, []),
            )
        )
    return PresupuestoMaestroResponse(
        id=master.id,
        proyecto_id=master.proyecto_id,
        version_proyecto_id=master.version_proyecto_id,
        estado=master.estado,
        moneda=master.moneda,
        total_general=master.total_general,
        revision=master.revision,
        algoritmo_version=master.algoritmo_version,
        actualizado_por_id=master.actualizado_por_id,
        creado_en=master.creado_en,
        actualizado_en=master.actualizado_en,
        capitulos=chapters,
    )


def _load(db: Session, version_id: int) -> PresupuestoMaestro | None:
    return db.scalar(
        select(PresupuestoMaestro)
        .options(
            selectinload(PresupuestoMaestro.capitulos),
            selectinload(PresupuestoMaestro.partidas),
        )
        .where(PresupuestoMaestro.version_proyecto_id == version_id)
    )


@router.get(
    "/proyectos/{proyecto_id}/versiones/{version_id}/presupuesto-maestro",
    response_model=PresupuestoMaestroResponse,
)
def obtener_presupuesto_maestro(
    proyecto_id: int,
    version_id: int,
    db: Session = Depends(get_db),
) -> PresupuestoMaestroResponse:
    master = _load(db, version_id)
    if master is None or master.proyecto_id != proyecto_id:
        # Recalcular no se dispara desde una lectura: el usuario decide cuándo guardar.
        _context(db, proyecto_id, version_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El Presupuesto Maestro aún no ha sido calculado.",
        )
    return _response(master)


@router.post(
    "/proyectos/{proyecto_id}/versiones/{version_id}/presupuesto-maestro/calcular",
    response_model=PresupuestoMaestroResponse,
    status_code=status.HTTP_201_CREATED,
)
def guardar_presupuesto_maestro(
    proyecto_id: int,
    version_id: int,
    payload: PresupuestoMaestroCalcular,
    db: Session = Depends(get_db),
) -> PresupuestoMaestroResponse:
    master = calcular_presupuesto_maestro(
        db,
        proyecto_id,
        version_id,
        actor_id=payload.actualizado_por_id,
        motivo=payload.motivo,
    )
    return _response(_load(db, master.version_proyecto_id) or master)


@router.put(
    "/proyectos/{proyecto_id}/versiones/{version_id}/capitulos/{capitulo_id}/partidas/{partida_id}/costo",
    response_model=PresupuestoMaestroResponse,
)
def guardar_costo_partida(
    proyecto_id: int,
    version_id: int,
    capitulo_id: int,
    partida_id: int,
    payload: PresupuestoMaestroCosto,
    db: Session = Depends(get_db),
) -> PresupuestoMaestroResponse:
    master = actualizar_costo_partida(
        db,
        proyecto_id,
        version_id,
        capitulo_id,
        partida_id,
        payload.costo_unitario,
        actor_id=payload.actualizado_por_id,
        motivo=payload.motivo,
    )
    return _response(_load(db, master.version_proyecto_id) or master)
