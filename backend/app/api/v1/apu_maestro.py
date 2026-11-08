from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.db.session import get_db
from app.models.database_models import (
    APUMaestro,
    AuditoriaEvento,
    Capitulo,
    MembresiaEmpresa,
    Material,
    MaterialPrecio,
    Partida,
    Proyecto,
    Proveedor,
    Usuario,
    UsoAPU,
    VersionAPU,
    VersionProyecto,
)
from app.schemas.plataforma import (
    APUMaestroCreate,
    APUMaestroResponse,
    APUMaestroUpdate,
    AuditoriaResponse,
    UsoAPUCreate,
    UsoAPUResponse,
    VersionAPUCreate,
    VersionAPUResponse,
)
from app.services.plataforma import registrar_auditoria
from app.services.materiales import obtener_precio_vigente_proveedor

router = APIRouter(prefix="/apu-maestro", tags=["apu-maestro-fase-2b"])


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


def _require_actor(db: Session, actor_id: int | None) -> Usuario | None:
    if actor_id is None:
        return None
    actor = db.get(Usuario, actor_id)
    if actor is None or actor.estado != "Activo":
        raise HTTPException(status_code=404, detail="El usuario indicado no existe o está inactivo.")
    return actor


def _master_response(master: APUMaestro) -> APUMaestroResponse:
    return APUMaestroResponse.model_validate(master)


def _version_response(version: VersionAPU) -> VersionAPUResponse:
    return VersionAPUResponse(
        id=version.id,
        apu_maestro_id=version.apu_maestro_id,
        numero=version.numero,
        nombre=version.nombre,
        descripcion=version.descripcion,
        unidad=version.unidad,
        costo_unitario=version.costo_unitario,
        detalle=version.detalle,
        motivo=version.motivo,
        creado_por_id=version.creado_por_id,
        creado_en=version.creado_en,
    )


def _usage_response(usage: UsoAPU) -> UsoAPUResponse:
    return UsoAPUResponse(
        id=usage.id,
        apu_maestro_id=usage.version_apu.apu_maestro_id,
        version_apu_id=usage.version_apu_id,
        version_proyecto_id=usage.version_proyecto_id,
        proyecto_id=usage.version_proyecto.proyecto_id,
        proyecto_nombre=usage.proyecto_nombre,
        version_proyecto_numero=usage.version_proyecto_numero,
        partida_id=usage.partida_id,
        partida_codigo=usage.partida_codigo,
        partida_descripcion=usage.partida_descripcion,
        capitulo_codigo=usage.capitulo_codigo,
        version_apu_numero=usage.version_apu_numero,
        apu_nombre=usage.apu_nombre,
        snapshot=usage.snapshot,
        motivo=usage.motivo,
        creado_por_id=usage.creado_por_id,
        creado_en=usage.creado_en,
    )


@router.get("", response_model=list[APUMaestroResponse])
def listar_apus_maestros(
    estado: str | None = Query(default=None, pattern="^(Activo|Inactivo)$"),
    db: Session = Depends(get_db),
) -> list[APUMaestroResponse]:
    statement = select(APUMaestro).order_by(APUMaestro.nombre, APUMaestro.id)
    if estado is not None:
        statement = statement.where(APUMaestro.estado == estado)
    return [_master_response(master) for master in db.scalars(statement).all()]


@router.post("", response_model=APUMaestroResponse, status_code=status.HTTP_201_CREATED)
def crear_apu_maestro(
    payload: APUMaestroCreate,
    db: Session = Depends(get_db),
) -> APUMaestroResponse:
    _require_actor(db, payload.creado_por_id)
    if not payload.nombre.strip() or not payload.descripcion.strip() or not payload.unidad.strip():
        raise HTTPException(status_code=422, detail="Nombre, descripción y unidad son obligatorios.")
    master = APUMaestro(
        nombre=payload.nombre.strip(),
        descripcion=payload.descripcion.strip(),
        unidad=payload.unidad.strip(),
        creado_por_id=payload.creado_por_id,
    )
    db.add(master)
    _flush(db)
    registrar_auditoria(
        db,
        accion="crear",
        entidad_tipo="apu_maestro",
        entidad_id=master.id,
        actor_usuario_id=payload.creado_por_id,
        motivo=payload.motivo.strip(),
        nuevos={
            "nombre": master.nombre,
            "descripcion": master.descripcion,
            "unidad": master.unidad,
            "estado": master.estado,
        },
    )
    _commit(db)
    db.refresh(master)
    return _master_response(master)


@router.put("/{apu_maestro_id}", response_model=APUMaestroResponse)
def actualizar_apu_maestro(
    apu_maestro_id: int,
    payload: APUMaestroUpdate,
    db: Session = Depends(get_db),
) -> APUMaestroResponse:
    master = db.get(APUMaestro, apu_maestro_id)
    if master is None:
        raise HTTPException(status_code=404, detail="El APU maestro no existe.")
    _require_actor(db, payload.actualizado_por_id)
    changes = payload.model_dump(
        exclude_unset=True,
        exclude={"actualizado_por_id", "motivo"},
    )
    if not changes:
        raise HTTPException(status_code=422, detail="Indica al menos un campo para actualizar.")
    if any(value is None or (isinstance(value, str) and not value.strip()) for value in changes.values()):
        raise HTTPException(status_code=422, detail="Los campos de texto no pueden quedar vacíos.")
    old_values = {key: getattr(master, key) for key in changes}
    for key, value in changes.items():
        setattr(master, key, value.strip() if isinstance(value, str) else value)
    registrar_auditoria(
        db,
        accion="actualizar",
        entidad_tipo="apu_maestro",
        entidad_id=master.id,
        actor_usuario_id=payload.actualizado_por_id,
        motivo=payload.motivo.strip(),
        anteriores=old_values,
        nuevos={key: getattr(master, key) for key in changes},
    )
    _commit(db)
    db.refresh(master)
    return _master_response(master)


@router.get("/{apu_maestro_id}/versiones", response_model=list[VersionAPUResponse])
def listar_versiones_apu(
    apu_maestro_id: int,
    db: Session = Depends(get_db),
) -> list[VersionAPUResponse]:
    if db.get(APUMaestro, apu_maestro_id) is None:
        raise HTTPException(status_code=404, detail="El APU maestro no existe.")
    versions = db.scalars(
        select(VersionAPU)
        .where(VersionAPU.apu_maestro_id == apu_maestro_id)
        .order_by(VersionAPU.numero)
    ).all()
    return [_version_response(version) for version in versions]


@router.post(
    "/{apu_maestro_id}/versiones",
    response_model=VersionAPUResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_version_apu(
    apu_maestro_id: int,
    payload: VersionAPUCreate,
    db: Session = Depends(get_db),
) -> VersionAPUResponse:
    master = db.get(APUMaestro, apu_maestro_id)
    if master is None:
        raise HTTPException(status_code=404, detail="El APU maestro no existe.")
    if master.estado != "Activo":
        raise HTTPException(status_code=409, detail="No se pueden versionar APUs maestros inactivos.")
    if any(line.material_id is not None for line in payload.detalle) and payload.creado_por_id is None:
        raise HTTPException(
            status_code=422,
            detail="El actor es obligatorio para versionar líneas de materiales.",
        )
    _require_actor(db, payload.creado_por_id)
    detalles: list[dict] = []
    tiene_materiales = False
    costo_detalle = Decimal("0")
    moneda_materiales: str | None = None
    monedas_lineas_genericas: list[str | None] = []
    for line in payload.detalle:
        references = (line.material_id, line.proveedor_id, line.material_precio_id)
        if any(value is not None for value in references):
            if any(value is None for value in references):
                raise HTTPException(
                    status_code=422,
                    detail="Cada línea de material debe indicar material, proveedor y cotización.",
                )
            material = db.get(Material, line.material_id)
            provider = db.get(Proveedor, line.proveedor_id)
            quote = db.get(MaterialPrecio, line.material_precio_id)
            if material is None or not material.activo:
                raise HTTPException(status_code=404, detail="El material indicado no existe o está inactivo.")
            if provider is None or not provider.activo:
                raise HTTPException(status_code=404, detail="El proveedor indicado no existe o está inactivo.")
            if quote is None or quote.material_id != material.id or quote.proveedor_id != provider.id:
                raise HTTPException(
                    status_code=422,
                    detail="La cotización no pertenece al material y proveedor indicados.",
                )
            if (
                line.unidad.strip().casefold() != material.unidad.strip().casefold()
                or quote.unidad_precio.strip().casefold() != material.unidad.strip().casefold()
            ):
                raise HTTPException(
                    status_code=422,
                    detail="La unidad de la línea APU debe coincidir con la unidad del material y su cotización.",
                )
            current_quote = obtener_precio_vigente_proveedor(
                db,
                material.id,
                provider.id,
                fecha=datetime.now(timezone.utc),
                moneda=quote.moneda,
            )
            if current_quote is None or current_quote.id != quote.id:
                raise HTTPException(
                    status_code=409,
                    detail="La cotización seleccionada ya no es la vigente para ese proveedor.",
                )
            if moneda_materiales is not None and moneda_materiales != quote.moneda:
                raise HTTPException(
                    status_code=422,
                    detail="Un APU no puede sumar cotizaciones de monedas distintas sin conversión.",
                )
            moneda_materiales = quote.moneda
            quote_snapshot = {
                "material_id": material.id,
                "codigo": material.codigo,
                "descripcion": material.descripcion,
                "unidad": material.unidad,
                "proveedor_id": provider.id,
                "proveedor_nombre": provider.nombre,
                "material_precio_id": quote.id,
                "precio_unitario": str(quote.costo_unitario),
                "moneda": quote.moneda,
                "unidad_precio": quote.unidad_precio,
                "fecha_vigencia": quote.fecha_vigencia.isoformat(),
                "registrado_en": quote.registrado_en.isoformat(),
                "origen": quote.origen,
                "referencia_cotizacion": quote.referencia_cotizacion,
                "observacion": quote.observacion,
            }
            detail = line.model_dump(
                mode="json",
                exclude={"snapshot_material"},
                exclude_none=True,
            )
            detail["costo_unitario"] = str(quote.costo_unitario)
            detail["moneda"] = quote.moneda
            detail["snapshot_material"] = quote_snapshot
            detalles.append(detail)
            costo_detalle += line.cantidad * quote.costo_unitario
            tiene_materiales = True
        else:
            if line.costo_unitario is None:
                raise HTTPException(
                    status_code=422,
                    detail="Las líneas que no referencian un material requieren costo unitario.",
                )
            detalles.append(
                line.model_dump(mode="json", exclude={"snapshot_material"}, exclude_none=True)
            )
            monedas_lineas_genericas.append(line.moneda.upper() if line.moneda else None)
            costo_detalle += line.cantidad * line.costo_unitario
    if tiene_materiales:
        if any(currency != moneda_materiales for currency in monedas_lineas_genericas):
            raise HTTPException(
                status_code=422,
                detail="Las líneas no materiales deben indicar la misma moneda que las cotizaciones.",
            )
        if payload.costo_unitario is not None and payload.costo_unitario != costo_detalle:
            raise HTTPException(
                status_code=422,
                detail="El costo unitario APU debe coincidir con la suma calculada de sus líneas.",
            )
        costo_unitario = costo_detalle
    elif payload.costo_unitario is not None:
        costo_unitario = payload.costo_unitario
    else:
        raise HTTPException(status_code=422, detail="Indica el costo unitario o líneas de materiales.")
    last_number = db.scalar(
        select(func.max(VersionAPU.numero)).where(VersionAPU.apu_maestro_id == master.id)
    )
    version = VersionAPU(
        apu_maestro_id=master.id,
        numero=(last_number or 0) + 1,
        nombre=master.nombre,
        descripcion=master.descripcion,
        unidad=master.unidad,
        costo_unitario=costo_unitario,
        detalle=detalles,
        motivo=payload.motivo.strip(),
        creado_por_id=payload.creado_por_id,
    )
    db.add(version)
    _flush(db)
    registrar_auditoria(
        db,
        accion="versionar",
        entidad_tipo="apu_maestro",
        entidad_id=master.id,
        actor_usuario_id=payload.creado_por_id,
        motivo=payload.motivo.strip(),
        nuevos={
            "version_apu_id": version.id,
            "numero": version.numero,
            "nombre": version.nombre,
            "unidad": version.unidad,
            "costo_unitario": str(version.costo_unitario),
            "detalle": version.detalle,
        },
    )
    _commit(db)
    db.refresh(version)
    return _version_response(version)


def _require_project_version(
    db: Session,
    proyecto_id: int,
    version_id: int,
    actor_id: int | None,
) -> tuple[Proyecto, VersionProyecto]:
    project = db.get(Proyecto, proyecto_id)
    if project is None:
        raise HTTPException(status_code=404, detail="El proyecto no existe.")
    project_version = db.get(VersionProyecto, version_id)
    if project_version is None or project_version.proyecto_id != project.id:
        raise HTTPException(status_code=404, detail="La versión no pertenece al proyecto indicado.")
    actor = _require_actor(db, actor_id)
    if actor is not None:
        membership = db.scalar(
            select(MembresiaEmpresa.id).where(
                MembresiaEmpresa.empresa_id == project.empresa_id,
                MembresiaEmpresa.usuario_id == actor.id,
                MembresiaEmpresa.estado == "Activa",
            )
        )
        if membership is None:
            raise HTTPException(status_code=403, detail="El usuario no tiene membresía activa en la empresa.")
    return project, project_version


@router.post(
    "/proyectos/{proyecto_id}/versiones/{version_id}/partidas/{partida_id}/usos",
    response_model=UsoAPUResponse,
    status_code=status.HTTP_201_CREATED,
)
def asociar_apu_a_partida(
    proyecto_id: int,
    version_id: int,
    partida_id: int,
    payload: UsoAPUCreate,
    db: Session = Depends(get_db),
) -> UsoAPUResponse:
    project, project_version = _require_project_version(
        db,
        proyecto_id,
        version_id,
        payload.creado_por_id,
    )
    part = db.scalar(
        select(Partida)
        .join(Capitulo, Partida.capitulo_id == Capitulo.id)
        .where(
            Partida.id == partida_id,
            Capitulo.proyecto_id == project.id,
            Capitulo.version_proyecto_id == project_version.id,
        )
    )
    if part is None:
        raise HTTPException(status_code=404, detail="La partida no existe en la versión indicada.")
    apu_version = db.scalar(
        select(VersionAPU)
        .options(selectinload(VersionAPU.apu_maestro))
        .where(VersionAPU.id == payload.version_apu_id)
    )
    if apu_version is None:
        raise HTTPException(status_code=404, detail="La versión APU indicada no existe.")
    if apu_version.apu_maestro.estado != "Activo":
        raise HTTPException(status_code=409, detail="No se pueden asociar APUs maestros inactivos.")
    if (
        any(line.get("snapshot_material") for line in apu_version.detalle)
        and payload.creado_por_id is None
    ):
        raise HTTPException(
            status_code=422,
            detail="El actor es obligatorio para asociar un APU con materiales.",
        )
    chapter = db.get(Capitulo, part.capitulo_id)
    snapshot = {
        "apu_maestro_id": apu_version.apu_maestro_id,
        "version_apu_id": apu_version.id,
        "version_apu_numero": apu_version.numero,
        "apu_nombre": apu_version.nombre,
        "apu_descripcion": apu_version.descripcion,
        "apu_unidad": apu_version.unidad,
        "costo_unitario": str(apu_version.costo_unitario),
        "detalle": apu_version.detalle,
        "proyecto_id": project.id,
        "proyecto_nombre": project.nombre,
        "version_proyecto_id": project_version.id,
        "version_proyecto_numero": project_version.numero,
        "capitulo_codigo": chapter.codigo,
        "partida_id": part.id,
        "partida_codigo": part.codigo,
        "partida_descripcion": part.descripcion,
        "partida_unidad": part.unidad,
        "partida_cantidad": str(part.cantidad),
    }
    usage = UsoAPU(
        version_apu_id=apu_version.id,
        version_proyecto_id=project_version.id,
        partida_id=part.id,
        partida_codigo=part.codigo,
        partida_descripcion=part.descripcion,
        capitulo_codigo=chapter.codigo,
        proyecto_nombre=project.nombre,
        version_proyecto_numero=project_version.numero,
        apu_nombre=apu_version.nombre,
        version_apu_numero=apu_version.numero,
        snapshot=snapshot,
        motivo=payload.motivo.strip(),
        creado_por_id=payload.creado_por_id,
    )
    db.add(usage)
    _flush(db)
    registrar_auditoria(
        db,
        accion="uso",
        entidad_tipo="apu_maestro",
        entidad_id=apu_version.apu_maestro_id,
        actor_usuario_id=payload.creado_por_id,
        empresa_id=project.empresa_id,
        proyecto_id=project.id,
        version_proyecto_id=project_version.id,
        motivo=payload.motivo.strip(),
        nuevos={**snapshot, "uso_apu_id": usage.id},
    )
    _commit(db)
    db.refresh(usage)
    return _usage_response(usage)


def _usage_query():
    return select(UsoAPU).options(
        selectinload(UsoAPU.version_apu),
        selectinload(UsoAPU.version_proyecto),
    )


@router.get(
    "/{apu_maestro_id}/usos",
    response_model=list[UsoAPUResponse],
)
def listar_usos_apu(
    apu_maestro_id: int,
    db: Session = Depends(get_db),
) -> list[UsoAPUResponse]:
    if db.get(APUMaestro, apu_maestro_id) is None:
        raise HTTPException(status_code=404, detail="El APU maestro no existe.")
    usages = db.scalars(
        _usage_query()
        .join(VersionAPU, UsoAPU.version_apu_id == VersionAPU.id)
        .where(VersionAPU.apu_maestro_id == apu_maestro_id)
        .order_by(UsoAPU.creado_en, UsoAPU.id)
    ).all()
    return [_usage_response(usage) for usage in usages]


@router.get(
    "/proyectos/{proyecto_id}/versiones/{version_id}/partidas/{partida_id}/usos",
    response_model=list[UsoAPUResponse],
)
def listar_usos_apu_partida(
    proyecto_id: int,
    version_id: int,
    partida_id: int,
    db: Session = Depends(get_db),
) -> list[UsoAPUResponse]:
    _require_project_version(db, proyecto_id, version_id, None)
    usages = db.scalars(
        _usage_query().where(
            UsoAPU.version_proyecto_id == version_id,
            UsoAPU.partida_id == partida_id,
        ).order_by(UsoAPU.creado_en, UsoAPU.id)
    ).all()
    return [_usage_response(usage) for usage in usages]


@router.get(
    "/{apu_maestro_id}/auditoria",
    response_model=list[AuditoriaResponse],
)
def listar_auditoria_apu(
    apu_maestro_id: int,
    limite: int = Query(default=100, ge=1, le=500),
    antes_de_id: int | None = Query(default=None, gt=0),
    db: Session = Depends(get_db),
) -> list[AuditoriaEvento]:
    if db.get(APUMaestro, apu_maestro_id) is None:
        raise HTTPException(status_code=404, detail="El APU maestro no existe.")
    statement = select(AuditoriaEvento).where(
        AuditoriaEvento.entidad_tipo == "apu_maestro",
        AuditoriaEvento.entidad_id == str(apu_maestro_id),
    )
    if antes_de_id is not None:
        statement = statement.where(AuditoriaEvento.id < antes_de_id)
    return list(
        db.scalars(statement.order_by(AuditoriaEvento.id.desc()).limit(limite)).all()
    )
