from __future__ import annotations

from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.db.session import get_db
from app.models.database_models import (
    Capitulo,
    MembresiaEmpresa,
    Partida,
    Proyecto,
    Usuario,
    VersionProyecto,
)
from app.schemas.plataforma import (
    WbsCapituloCreate,
    WbsCapituloResponse,
    WbsCapituloUpdate,
    WbsPartidaCreate,
    WbsPartidaResponse,
    WbsPartidaUpdate,
    WbsResponse,
)
from app.services.plataforma import registrar_auditoria

router = APIRouter(tags=["estructura-wbs-fase-2a"])


def _require_context(
    db: Session,
    proyecto_id: int,
    version_id: int,
    actor_id: int | None = None,
) -> tuple[Proyecto, VersionProyecto]:
    project = db.get(Proyecto, proyecto_id)
    if project is None:
        raise HTTPException(status_code=404, detail="El proyecto no existe.")
    version = db.get(VersionProyecto, version_id)
    if version is None or version.proyecto_id != project.id:
        raise HTTPException(status_code=404, detail="La versión no pertenece al proyecto indicado.")
    if actor_id is not None:
        actor = db.get(Usuario, actor_id)
        if actor is None or actor.estado != "Activo":
            raise HTTPException(status_code=404, detail="El usuario indicado no existe o está inactivo.")
        membership = db.scalar(
            select(MembresiaEmpresa.id).where(
                MembresiaEmpresa.empresa_id == project.empresa_id,
                MembresiaEmpresa.usuario_id == actor_id,
                MembresiaEmpresa.estado == "Activa",
            )
        )
        if membership is None:
            raise HTTPException(status_code=403, detail="El usuario no tiene membresía activa en la empresa.")
    return project, version


def _commit(db: Session) -> None:
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El registro entra en conflicto con una clave o restricción existente.",
        ) from error


def _flush(db: Session) -> None:
    try:
        db.flush()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El registro entra en conflicto con una clave o restricción existente.",
        ) from error


def _capitulo_response(chapter: Capitulo) -> WbsCapituloResponse:
    return WbsCapituloResponse(
        id=chapter.id,
        proyecto_id=chapter.proyecto_id,
        version_proyecto_id=chapter.version_proyecto_id,
        codigo=chapter.codigo,
        nombre=chapter.nombre,
        partidas=[
            WbsPartidaResponse(
                id=part.id,
                capitulo_id=part.capitulo_id,
                codigo=part.codigo,
                descripcion=part.descripcion,
                unidad=part.unidad,
                cantidad=float(part.cantidad),
                rendimiento=float(part.rendimiento) if part.rendimiento is not None else None,
            )
            for part in sorted(chapter.partidas, key=lambda item: (item.codigo, item.id))
        ],
    )


def _require_capitulo(
    db: Session,
    project_id: int,
    version_id: int,
    chapter_id: int,
) -> Capitulo:
    chapter = db.scalar(
        select(Capitulo)
        .options(selectinload(Capitulo.partidas))
        .where(
            Capitulo.id == chapter_id,
            Capitulo.proyecto_id == project_id,
            Capitulo.version_proyecto_id == version_id,
        )
    )
    if chapter is None:
        raise HTTPException(status_code=404, detail="El capítulo no existe en la versión indicada.")
    return chapter


def _require_partida(
    db: Session,
    project_id: int,
    version_id: int,
    chapter_id: int,
    partida_id: int,
) -> Partida:
    partida = db.scalar(
        select(Partida)
        .join(Capitulo, Partida.capitulo_id == Capitulo.id)
        .options(selectinload(Partida.analisis_unitarios))
        .where(
            Partida.id == partida_id,
            Capitulo.id == chapter_id,
            Capitulo.proyecto_id == project_id,
            Capitulo.version_proyecto_id == version_id,
        )
    )
    if partida is None:
        raise HTTPException(status_code=404, detail="La partida no existe en la versión indicada.")
    return partida


@router.get(
    "/proyectos/{proyecto_id}/versiones/{version_id}/wbs",
    response_model=WbsResponse,
)
def obtener_wbs(
    proyecto_id: int,
    version_id: int,
    db: Session = Depends(get_db),
) -> WbsResponse:
    project, version = _require_context(db, proyecto_id, version_id)
    chapters = db.scalars(
        select(Capitulo)
        .options(selectinload(Capitulo.partidas))
        .where(Capitulo.version_proyecto_id == version.id)
        .order_by(Capitulo.codigo, Capitulo.id)
    ).all()
    return WbsResponse(
        empresa_id=project.empresa_id,
        proyecto_id=project.id,
        version_proyecto_id=version.id,
        numero_version=version.numero,
        capitulos=[_capitulo_response(chapter) for chapter in chapters],
    )


@router.post(
    "/proyectos/{proyecto_id}/versiones/{version_id}/capitulos",
    response_model=WbsCapituloResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_capitulo(
    proyecto_id: int,
    version_id: int,
    payload: WbsCapituloCreate,
    db: Session = Depends(get_db),
) -> WbsCapituloResponse:
    project, version = _require_context(db, proyecto_id, version_id, payload.creado_por_id)
    if not payload.codigo.strip() or not payload.nombre.strip():
        raise HTTPException(status_code=422, detail="El código y el nombre del capítulo son obligatorios.")
    chapter = Capitulo(
        proyecto_id=project.id,
        version_proyecto_id=version.id,
        codigo=payload.codigo.strip(),
        nombre=payload.nombre.strip(),
    )
    db.add(chapter)
    _flush(db)
    registrar_auditoria(
        db,
        accion="crear",
        entidad_tipo="capitulo",
        entidad_id=chapter.id,
        actor_usuario_id=payload.creado_por_id,
        empresa_id=project.empresa_id,
        proyecto_id=project.id,
        version_proyecto_id=version.id,
        nuevos={"codigo": chapter.codigo, "nombre": chapter.nombre},
    )
    _commit(db)
    db.refresh(chapter)
    return _capitulo_response(chapter)


@router.put(
    "/proyectos/{proyecto_id}/versiones/{version_id}/capitulos/{capitulo_id}",
    response_model=WbsCapituloResponse,
)
def actualizar_capitulo(
    proyecto_id: int,
    version_id: int,
    capitulo_id: int,
    payload: WbsCapituloUpdate,
    db: Session = Depends(get_db),
) -> WbsCapituloResponse:
    project, version = _require_context(db, proyecto_id, version_id, payload.actualizado_por_id)
    chapter = _require_capitulo(db, project.id, version.id, capitulo_id)
    changes = payload.model_dump(exclude_unset=True, exclude={"actualizado_por_id"})
    if not changes:
        raise HTTPException(status_code=422, detail="Indica al menos un campo para actualizar.")
    if any(value is None or not value.strip() for value in changes.values()):
        raise HTTPException(status_code=422, detail="El código y el nombre no pueden quedar vacíos.")
    old_values = {key: getattr(chapter, key) for key in changes}
    for key, value in changes.items():
        setattr(chapter, key, value.strip())
    registrar_auditoria(
        db,
        accion="actualizar",
        entidad_tipo="capitulo",
        entidad_id=chapter.id,
        actor_usuario_id=payload.actualizado_por_id,
        empresa_id=project.empresa_id,
        proyecto_id=project.id,
        version_proyecto_id=version.id,
        anteriores=old_values,
        nuevos=changes,
    )
    _commit(db)
    return _capitulo_response(chapter)


@router.delete(
    "/proyectos/{proyecto_id}/versiones/{version_id}/capitulos/{capitulo_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def eliminar_capitulo(
    proyecto_id: int,
    version_id: int,
    capitulo_id: int,
    db: Session = Depends(get_db),
) -> Response:
    project, version = _require_context(db, proyecto_id, version_id)
    chapter = _require_capitulo(db, project.id, version.id, capitulo_id)
    registrar_auditoria(
        db,
        accion="eliminar",
        entidad_tipo="capitulo",
        entidad_id=chapter.id,
        empresa_id=project.empresa_id,
        proyecto_id=project.id,
        version_proyecto_id=version.id,
        anteriores={
            "codigo": chapter.codigo,
            "nombre": chapter.nombre,
            "partidas": [part.codigo for part in chapter.partidas],
        },
    )
    db.delete(chapter)
    _commit(db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/proyectos/{proyecto_id}/versiones/{version_id}/capitulos/{capitulo_id}/partidas",
    response_model=WbsPartidaResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_partida_wbs(
    proyecto_id: int,
    version_id: int,
    capitulo_id: int,
    payload: WbsPartidaCreate,
    db: Session = Depends(get_db),
) -> WbsPartidaResponse:
    project, version = _require_context(db, proyecto_id, version_id, payload.creado_por_id)
    chapter = _require_capitulo(db, project.id, version.id, capitulo_id)
    if not payload.codigo.strip() or not payload.descripcion.strip() or not payload.unidad.strip():
        raise HTTPException(
            status_code=422,
            detail="El código, la descripción y la unidad de la partida son obligatorios.",
        )
    partida = Partida(
        capitulo_id=chapter.id,
        codigo=payload.codigo.strip(),
        descripcion=payload.descripcion.strip(),
        unidad=payload.unidad.strip(),
        cantidad=Decimal(str(payload.cantidad)),
        costo_unitario=Decimal("0"),
        rendimiento=(
            Decimal(str(payload.rendimiento)) if payload.rendimiento is not None else None
        ),
    )
    db.add(partida)
    _flush(db)
    registrar_auditoria(
        db,
        accion="crear",
        entidad_tipo="partida",
        entidad_id=partida.id,
        actor_usuario_id=payload.creado_por_id,
        empresa_id=project.empresa_id,
        proyecto_id=project.id,
        version_proyecto_id=version.id,
        nuevos={
            "capitulo_id": chapter.id,
            "codigo": partida.codigo,
            "descripcion": partida.descripcion,
            "unidad": partida.unidad,
            "cantidad": str(partida.cantidad),
            "rendimiento": str(partida.rendimiento) if partida.rendimiento is not None else None,
        },
    )
    _commit(db)
    return WbsPartidaResponse(
        id=partida.id,
        capitulo_id=partida.capitulo_id,
        codigo=partida.codigo,
        descripcion=partida.descripcion,
        unidad=partida.unidad,
        cantidad=float(partida.cantidad),
        rendimiento=float(partida.rendimiento) if partida.rendimiento is not None else None,
    )


@router.put(
    "/proyectos/{proyecto_id}/versiones/{version_id}/capitulos/{capitulo_id}/partidas/{partida_id}",
    response_model=WbsPartidaResponse,
)
def actualizar_partida_wbs(
    proyecto_id: int,
    version_id: int,
    capitulo_id: int,
    partida_id: int,
    payload: WbsPartidaUpdate,
    db: Session = Depends(get_db),
) -> WbsPartidaResponse:
    project, version = _require_context(db, proyecto_id, version_id, payload.actualizado_por_id)
    partida = _require_partida(db, project.id, version.id, capitulo_id, partida_id)
    changes = payload.model_dump(exclude_unset=True, exclude={"actualizado_por_id"})
    if not changes:
        raise HTTPException(status_code=422, detail="Indica al menos un campo para actualizar.")
    if any(
        value is None or (isinstance(value, str) and not value.strip())
        for key, value in changes.items()
        if key != "rendimiento"
    ):
        raise HTTPException(status_code=422, detail="Los campos de la partida no pueden quedar vacíos.")
    old_values = {
        key: str(getattr(partida, key)) if getattr(partida, key) is not None else None
        for key in changes
    }
    for key, value in changes.items():
        setattr(
            partida,
            key,
            Decimal(str(value)) if key in {"cantidad", "rendimiento"} and value is not None
            else value.strip() if isinstance(value, str)
            else value,
        )
    registrar_auditoria(
        db,
        accion="actualizar",
        entidad_tipo="partida",
        entidad_id=partida.id,
        actor_usuario_id=payload.actualizado_por_id,
        empresa_id=project.empresa_id,
        proyecto_id=project.id,
        version_proyecto_id=version.id,
        anteriores=old_values,
        nuevos={
            key: str(value) if isinstance(value, Decimal) else value
            for key, value in changes.items()
        },
    )
    _commit(db)
    return WbsPartidaResponse(
        id=partida.id,
        capitulo_id=partida.capitulo_id,
        codigo=partida.codigo,
        descripcion=partida.descripcion,
        unidad=partida.unidad,
        cantidad=float(partida.cantidad),
        rendimiento=float(partida.rendimiento) if partida.rendimiento is not None else None,
    )


@router.delete(
    "/proyectos/{proyecto_id}/versiones/{version_id}/capitulos/{capitulo_id}/partidas/{partida_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def eliminar_partida_wbs(
    proyecto_id: int,
    version_id: int,
    capitulo_id: int,
    partida_id: int,
    db: Session = Depends(get_db),
) -> Response:
    project, version = _require_context(db, proyecto_id, version_id)
    partida = _require_partida(db, project.id, version.id, capitulo_id, partida_id)
    registrar_auditoria(
        db,
        accion="eliminar",
        entidad_tipo="partida",
        entidad_id=partida.id,
        empresa_id=project.empresa_id,
        proyecto_id=project.id,
        version_proyecto_id=version.id,
        anteriores={"codigo": partida.codigo, "descripcion": partida.descripcion},
    )
    db.delete(partida)
    _commit(db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
