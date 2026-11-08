from __future__ import annotations

from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.db.session import get_db
from app.models.database_models import (
    AuditoriaEvento,
    Capitulo,
    Empresa,
    MembresiaEmpresa,
    Partida,
    PresupuestoMOBorrador,
    PresupuestoMOLinea,
    Proyecto,
    Usuario,
    UsoAPU,
    VersionProyecto,
)
from app.schemas.plataforma import (
    AuditoriaResponse,
    ComparacionManoObraResponse,
    ConfiguracionLaboralSnapshot,
    DiferenciaLinea,
    EmpresaCreate,
    EmpresaResponse,
    MembresiaCreate,
    MembresiaResponse,
    ManoObraLinea,
    ManoObraSnapshotResponse,
    ManoObraSnapshotWrite,
    ProyectoCreate,
    ProyectoResponse,
    UsuarioCreate,
    UsuarioResponse,
    VersionProyectoCreate,
    VersionProyectoResponse,
)
from app.services.plataforma import (
    cargar_snapshot_mo,
    registrar_auditoria,
    reemplazar_lineas_mo,
    serializar_snapshot_mo,
    total_mano_obra,
)

router = APIRouter(tags=["plataforma-fase-1"])
CONFIGURACION_MO_DEFAULT = ConfiguracionLaboralSnapshot(
    salario_minimo_mensual=13848.23,
    dias_mes_comercial=26,
    horas_jornada_diaria=8,
    horas_semana_max=48,
    dias_semana_laboral=6,
    factor_oficial=1.5,
    pct_aguinaldo=0.0833,
    pct_vacaciones=0.0833,
    pct_inss_patronal=0.225,
    pct_inatec=0.02,
    pct_indemnizacion=0.0416,
    pct_inss_laboral=0.07,
)


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


def _require_project_actor(db: Session, proyecto: Proyecto, actor_id: int | None) -> None:
    actor = _require_actor(db, actor_id)
    if actor is None:
        return
    member = db.scalar(
        select(MembresiaEmpresa.id).where(
            MembresiaEmpresa.empresa_id == proyecto.empresa_id,
            MembresiaEmpresa.usuario_id == actor.id,
            MembresiaEmpresa.estado == "Activa",
        )
    )
    if member is None:
        raise HTTPException(status_code=403, detail="El usuario no tiene membresía activa en la empresa.")


def _require_version(db: Session, proyecto_id: int, version_id: int) -> VersionProyecto:
    version = db.get(VersionProyecto, version_id)
    if version is None or version.proyecto_id != proyecto_id:
        raise HTTPException(status_code=404, detail="La versión no pertenece al proyecto indicado.")
    return version


def _version_response(db: Session, version: VersionProyecto) -> VersionProyectoResponse:
    snapshot_exists = db.scalar(
        select(PresupuestoMOBorrador.id).where(
            PresupuestoMOBorrador.version_proyecto_id == version.id
        )
    )
    return VersionProyectoResponse(
        id=version.id,
        proyecto_id=version.proyecto_id,
        numero=version.numero,
        estado=version.estado,
        motivo=version.motivo,
        version_anterior_id=version.version_anterior_id,
        creado_por_id=version.creado_por_id,
        creado_en=version.creado_en,
        tiene_mano_obra=snapshot_exists is not None,
    )


def _project_response(proyecto: Proyecto) -> ProyectoResponse:
    return ProyectoResponse(
        id=proyecto.id,
        empresa_id=proyecto.empresa_id,
        nombre=proyecto.nombre,
        ubicacion=proyecto.ubicacion,
        estado=proyecto.estado,
        fecha_creacion=proyecto.fecha_creacion,
    )


@router.get("/empresas", response_model=list[EmpresaResponse])
def listar_empresas(db: Session = Depends(get_db)) -> list[Empresa]:
    return list(db.scalars(select(Empresa).order_by(Empresa.nombre)).all())


@router.post("/empresas", response_model=EmpresaResponse, status_code=status.HTTP_201_CREATED)
def crear_empresa(payload: EmpresaCreate, db: Session = Depends(get_db)) -> Empresa:
    _require_actor(db, payload.creado_por_id)
    empresa = Empresa(
        nombre=payload.nombre.strip(),
        razon_social=payload.razon_social.strip() if payload.razon_social else None,
        identificacion_fiscal=(
            payload.identificacion_fiscal.strip() if payload.identificacion_fiscal else None
        ),
        pais=payload.pais.upper(),
        moneda_base=payload.moneda_base.upper(),
    )
    db.add(empresa)
    _flush(db)
    registrar_auditoria(
        db,
        accion="crear",
        entidad_tipo="empresa",
        entidad_id=empresa.id,
        actor_usuario_id=payload.creado_por_id,
        nuevos={"nombre": empresa.nombre, "pais": empresa.pais, "moneda_base": empresa.moneda_base},
        motivo=(payload.motivo or "").strip() or "Alta de empresa",
    )
    _commit(db)
    db.refresh(empresa)
    return empresa


@router.get("/usuarios", response_model=list[UsuarioResponse])
def listar_usuarios(db: Session = Depends(get_db)) -> list[Usuario]:
    return list(db.scalars(select(Usuario).order_by(Usuario.nombre)).all())


@router.post("/usuarios", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def crear_usuario(payload: UsuarioCreate, db: Session = Depends(get_db)) -> Usuario:
    _require_actor(db, payload.creado_por_id)
    correo = payload.correo.strip()
    normalized_email = correo.casefold()
    if normalized_email.count("@") != 1 or "." not in normalized_email.rsplit("@", 1)[-1]:
        raise HTTPException(status_code=422, detail="El correo no tiene un formato válido.")
    usuario = Usuario(
        nombre=payload.nombre.strip(),
        correo=correo,
        correo_normalizado=normalized_email,
    )
    db.add(usuario)
    _flush(db)
    registrar_auditoria(
        db,
        accion="crear",
        entidad_tipo="usuario",
        entidad_id=usuario.id,
        actor_usuario_id=payload.creado_por_id,
        nuevos={"nombre": usuario.nombre, "correo": usuario.correo},
        motivo=(payload.motivo or "").strip() or "Alta de usuario",
    )
    _commit(db)
    db.refresh(usuario)
    return usuario


@router.get(
    "/empresas/{empresa_id}/membresias",
    response_model=list[MembresiaResponse],
)
def listar_membresias(empresa_id: int, db: Session = Depends(get_db)) -> list[MembresiaEmpresa]:
    if db.get(Empresa, empresa_id) is None:
        raise HTTPException(status_code=404, detail="La empresa no existe.")
    return list(
        db.scalars(
            select(MembresiaEmpresa)
            .options(selectinload(MembresiaEmpresa.usuario))
            .where(MembresiaEmpresa.empresa_id == empresa_id)
            .order_by(MembresiaEmpresa.id)
        ).all()
    )


@router.post(
    "/empresas/{empresa_id}/membresias",
    response_model=MembresiaResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_membresia(
    empresa_id: int,
    payload: MembresiaCreate,
    db: Session = Depends(get_db),
) -> MembresiaEmpresa:
    empresa = db.get(Empresa, empresa_id)
    usuario = db.get(Usuario, payload.usuario_id)
    if empresa is None:
        raise HTTPException(status_code=404, detail="La empresa no existe.")
    if usuario is None or usuario.estado != "Activo":
        raise HTTPException(status_code=404, detail="El usuario no existe o está inactivo.")
    _require_actor(db, payload.creado_por_id)
    membresia = MembresiaEmpresa(
        empresa_id=empresa_id,
        usuario_id=usuario.id,
        rol=payload.rol,
    )
    db.add(membresia)
    _flush(db)
    registrar_auditoria(
        db,
        accion="asociar",
        entidad_tipo="membresia_empresa",
        entidad_id=membresia.id,
        actor_usuario_id=payload.creado_por_id,
        empresa_id=empresa_id,
        nuevos={"usuario_id": usuario.id, "rol": membresia.rol},
        motivo=(payload.motivo or "").strip() or "Asociación de usuario a empresa",
    )
    _commit(db)
    return db.scalar(
        select(MembresiaEmpresa)
        .options(selectinload(MembresiaEmpresa.usuario))
        .where(MembresiaEmpresa.id == membresia.id)
    )


@router.get("/proyectos", response_model=list[ProyectoResponse])
def listar_proyectos(
    empresa_id: int | None = Query(default=None, gt=0),
    db: Session = Depends(get_db),
) -> list[ProyectoResponse]:
    statement = select(Proyecto).order_by(Proyecto.fecha_creacion.desc(), Proyecto.id.desc())
    if empresa_id is not None:
        statement = statement.where(Proyecto.empresa_id == empresa_id)
    return [_project_response(proyecto) for proyecto in db.scalars(statement).all()]


@router.post("/proyectos", response_model=ProyectoResponse, status_code=status.HTTP_201_CREATED)
def crear_proyecto(payload: ProyectoCreate, db: Session = Depends(get_db)) -> ProyectoResponse:
    empresa = db.get(Empresa, payload.empresa_id)
    if empresa is None or empresa.estado != "Activa":
        raise HTTPException(status_code=404, detail="La empresa no existe o está inactiva.")
    _require_actor(db, payload.creado_por_id)
    if payload.creado_por_id is not None:
        membership = db.scalar(
            select(MembresiaEmpresa.id).where(
                MembresiaEmpresa.empresa_id == payload.empresa_id,
                MembresiaEmpresa.usuario_id == payload.creado_por_id,
                MembresiaEmpresa.estado == "Activa",
            )
        )
        if membership is None:
            raise HTTPException(status_code=403, detail="El usuario no tiene membresía activa en la empresa.")
    proyecto = Proyecto(
        empresa_id=empresa.id,
        nombre=payload.nombre.strip(),
        ubicacion=payload.ubicacion.strip() if payload.ubicacion else None,
        estado="Borrador",
        costo_total_mo=Decimal("0"),
    )
    db.add(proyecto)
    _flush(db)
    registrar_auditoria(
        db,
        accion="crear",
        entidad_tipo="proyecto",
        entidad_id=proyecto.id,
        actor_usuario_id=payload.creado_por_id,
        empresa_id=empresa.id,
        proyecto_id=proyecto.id,
        nuevos={"nombre": proyecto.nombre, "ubicacion": proyecto.ubicacion, "estado": proyecto.estado},
        motivo=(payload.motivo or "").strip() or "Creación de proyecto",
    )
    _commit(db)
    db.refresh(proyecto)
    return _project_response(proyecto)


@router.get(
    "/proyectos/{proyecto_id}/versiones",
    response_model=list[VersionProyectoResponse],
)
def listar_versiones(proyecto_id: int, db: Session = Depends(get_db)) -> list[VersionProyectoResponse]:
    if db.get(Proyecto, proyecto_id) is None:
        raise HTTPException(status_code=404, detail="El proyecto no existe.")
    versiones = db.scalars(
        select(VersionProyecto)
        .where(VersionProyecto.proyecto_id == proyecto_id)
        .order_by(VersionProyecto.numero)
    ).all()
    return [_version_response(db, version) for version in versiones]


@router.post(
    "/proyectos/{proyecto_id}/versiones",
    response_model=VersionProyectoResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_version(
    proyecto_id: int,
    payload: VersionProyectoCreate,
    db: Session = Depends(get_db),
) -> VersionProyectoResponse:
    proyecto = db.get(Proyecto, proyecto_id)
    if proyecto is None:
        raise HTTPException(status_code=404, detail="El proyecto no existe.")
    _require_project_actor(db, proyecto, payload.creado_por_id)
    source = None
    if payload.version_origen_id is not None:
        source = _require_version(db, proyecto_id, payload.version_origen_id)
    last_number = db.scalar(
        select(func.max(VersionProyecto.numero)).where(VersionProyecto.proyecto_id == proyecto_id)
    )
    version = VersionProyecto(
        proyecto_id=proyecto_id,
        numero=(last_number or 0) + 1,
        estado="Borrador",
        motivo=payload.motivo.strip(),
        version_anterior_id=source.id if source else None,
        creado_por_id=payload.creado_por_id,
    )
    db.add(version)
    _flush(db)
    source_snapshot = None
    source_chapters = []
    source_apu_usages: list[UsoAPU] = []
    if source is not None:
        source_chapters = db.scalars(
            select(Capitulo)
            .options(selectinload(Capitulo.partidas))
            .where(Capitulo.version_proyecto_id == source.id)
            .order_by(Capitulo.codigo, Capitulo.id)
        ).all()
        copied_part_ids: dict[int, int] = {}
        for source_chapter in source_chapters:
            copied_chapter = Capitulo(
                proyecto_id=proyecto.id,
                version_proyecto_id=version.id,
                codigo=source_chapter.codigo,
                nombre=source_chapter.nombre,
            )
            db.add(copied_chapter)
            _flush(db)
            for source_part in source_chapter.partidas:
                copied_part = Partida(
                    capitulo_id=copied_chapter.id,
                    codigo=source_part.codigo,
                    descripcion=source_part.descripcion,
                    unidad=source_part.unidad,
                    cantidad=source_part.cantidad,
                    costo_unitario=Decimal("0"),
                    rendimiento=source_part.rendimiento,
                )
                db.add(copied_part)
                _flush(db)
                copied_part_ids[source_part.id] = copied_part.id
        if copied_part_ids:
            source_apu_usages = db.scalars(
                select(UsoAPU)
                .where(
                    UsoAPU.version_proyecto_id == source.id,
                    UsoAPU.partida_id.in_(copied_part_ids),
                )
                .order_by(UsoAPU.id)
            ).all()
            for source_usage in source_apu_usages:
                if source_usage.partida_id is None:
                    continue
                copied_part_id = copied_part_ids[source_usage.partida_id]
                copied_snapshot = dict(source_usage.snapshot)
                copied_snapshot.update(
                    {
                        "version_proyecto_id": version.id,
                        "version_proyecto_numero": version.numero,
                        "partida_id": copied_part_id,
                    }
                )
                copied_usage = UsoAPU(
                    version_apu_id=source_usage.version_apu_id,
                    version_proyecto_id=version.id,
                    partida_id=copied_part_id,
                    partida_codigo=source_usage.partida_codigo,
                    partida_descripcion=source_usage.partida_descripcion,
                    capitulo_codigo=source_usage.capitulo_codigo,
                    proyecto_nombre=proyecto.nombre,
                    version_proyecto_numero=version.numero,
                    apu_nombre=source_usage.apu_nombre,
                    version_apu_numero=source_usage.version_apu_numero,
                    snapshot=copied_snapshot,
                    motivo=f"Copiado desde la versión de presupuesto {source.numero}",
                    creado_por_id=payload.creado_por_id,
                )
                db.add(copied_usage)
                _flush(db)
                registrar_auditoria(
                    db,
                    accion="copiar_uso",
                    entidad_tipo="apu_maestro",
                    entidad_id=source_usage.version_apu.apu_maestro_id,
                    actor_usuario_id=payload.creado_por_id,
                    empresa_id=proyecto.empresa_id,
                    proyecto_id=proyecto.id,
                    version_proyecto_id=version.id,
                    motivo=f"Copiado desde la versión de presupuesto {source.numero}",
                    nuevos={**copied_snapshot, "uso_apu_id": copied_usage.id},
                )
        source_snapshot = cargar_snapshot_mo(db, source)
        if source_snapshot is not None:
            copy = PresupuestoMOBorrador(
                version_proyecto_id=version.id,
                configuracion=dict(source_snapshot.configuracion),
                revision=1,
                total_mo=source_snapshot.total_mo,
                algoritmo_version=source_snapshot.algoritmo_version,
                actualizado_por_id=payload.creado_por_id,
            )
            db.add(copy)
            _flush(db)
            copy.lineas = [
                PresupuestoMOLinea(
                    orden=source_line.orden,
                    id_origen=source_line.id_origen,
                    item=source_line.item,
                    descripcion=source_line.descripcion,
                    unidad_medida=source_line.unidad_medida,
                    cantidad=source_line.cantidad,
                    rendimiento_base=source_line.rendimiento_base,
                    cant_oficiales=source_line.cant_oficiales,
                    cant_ayudantes=source_line.cant_ayudantes,
                    ratio_ayudantes=source_line.ratio_ayudantes,
                )
                for source_line in source_snapshot.lineas
            ]
    registrar_auditoria(
        db,
        accion="crear_version",
        entidad_tipo="version_proyecto",
        entidad_id=version.id,
        actor_usuario_id=payload.creado_por_id,
        empresa_id=proyecto.empresa_id,
        proyecto_id=proyecto.id,
        version_proyecto_id=version.id,
        motivo=payload.motivo,
        nuevos={
            "numero": version.numero,
            "version_anterior_id": version.version_anterior_id,
            "mano_obra_copiada": source is not None and source_snapshot is not None,
            "estructura_wbs_copiada": source is not None and bool(source_chapters),
            "usos_apu_copiados": len(source_apu_usages),
        },
    )
    _commit(db)
    db.refresh(version)
    return _version_response(db, version)


@router.get(
    "/proyectos/{proyecto_id}/versiones/{version_id}",
    response_model=VersionProyectoResponse,
)
def obtener_version(proyecto_id: int, version_id: int, db: Session = Depends(get_db)) -> VersionProyectoResponse:
    return _version_response(db, _require_version(db, proyecto_id, version_id))


@router.get(
    "/proyectos/{proyecto_id}/versiones/{version_id}/mano-obra",
    response_model=ManoObraSnapshotResponse,
)
def obtener_mano_obra(
    proyecto_id: int,
    version_id: int,
    db: Session = Depends(get_db),
) -> ManoObraSnapshotResponse:
    version = _require_version(db, proyecto_id, version_id)
    snapshot = cargar_snapshot_mo(db, version)
    return serializar_snapshot_mo(version.id, snapshot, CONFIGURACION_MO_DEFAULT)


@router.put(
    "/proyectos/{proyecto_id}/versiones/{version_id}/mano-obra",
    response_model=ManoObraSnapshotResponse,
)
def guardar_mano_obra(
    proyecto_id: int,
    version_id: int,
    payload: ManoObraSnapshotWrite,
    db: Session = Depends(get_db),
) -> ManoObraSnapshotResponse:
    version = _require_version(db, proyecto_id, version_id)
    if version.estado != "Borrador":
        raise HTTPException(status_code=409, detail="Solo se pueden editar versiones en borrador.")
    proyecto = db.get(Proyecto, proyecto_id)
    if proyecto is None:
        raise HTTPException(status_code=404, detail="El proyecto no existe.")
    _require_project_actor(db, proyecto, payload.actualizado_por_id)
    if len({linea.id for linea in payload.actividades}) != len(payload.actividades):
        raise HTTPException(status_code=422, detail="Cada actividad debe tener un identificador único.")
    if len({linea.item for linea in payload.actividades}) != len(payload.actividades):
        raise HTTPException(status_code=422, detail="Cada actividad debe tener un número de ítem único.")

    snapshot = cargar_snapshot_mo(db, version, bloquear=True)
    previous = None
    if snapshot is None:
        if payload.revision_esperada is not None:
            raise HTTPException(status_code=409, detail="La revisión indicada no existe.")
        snapshot = PresupuestoMOBorrador(
            version_proyecto_id=version.id,
            configuracion=payload.configuracion.model_dump(mode="json"),
            revision=1,
            total_mo=Decimal("0"),
            actualizado_por_id=payload.actualizado_por_id,
        )
        db.add(snapshot)
        _flush(db)
        accion = "crear"
    else:
        if payload.revision_esperada != snapshot.revision:
            raise HTTPException(
                status_code=409,
                detail="La mano de obra cambió desde la última lectura; recargue antes de guardar.",
            )
        previous = {
            "configuracion": snapshot.configuracion,
            "actividades": [
                {
                    "id": line.id_origen,
                    "item": line.item,
                    "descripcion": line.descripcion,
                    "unidad_medida": line.unidad_medida,
                    "cantidad": float(line.cantidad),
                    "rendimiento_base_oficial": float(line.rendimiento_base),
                    "cant_oficiales": float(line.cant_oficiales),
                    "cant_ayudantes": float(line.cant_ayudantes),
                    "ratio_ayudantes": (
                        float(line.ratio_ayudantes) if line.ratio_ayudantes is not None else None
                    ),
                }
                for line in snapshot.lineas
            ],
        }
        snapshot.revision += 1
        accion = "actualizar"

    snapshot.configuracion = payload.configuracion.model_dump(mode="json")
    snapshot.total_mo = total_mano_obra(payload.configuracion, payload.actividades)
    snapshot.algoritmo_version = "mo-2026-v1"
    snapshot.actualizado_por_id = payload.actualizado_por_id
    reemplazar_lineas_mo(db, snapshot, payload.actividades)
    new_values = {
        "revision": snapshot.revision,
        "configuracion": snapshot.configuracion,
        "actividades": [linea.model_dump(mode="json") for linea in payload.actividades],
        "total_mo": float(snapshot.total_mo),
    }
    registrar_auditoria(
        db,
        accion=accion,
        entidad_tipo="presupuesto_mo",
        entidad_id=snapshot.id,
        actor_usuario_id=payload.actualizado_por_id,
        empresa_id=proyecto.empresa_id,
        proyecto_id=proyecto_id,
        version_proyecto_id=version.id,
        motivo=(payload.motivo or "").strip() or "Guardado de mano de obra",
        anteriores=previous,
        nuevos=new_values,
    )
    _commit(db)
    refreshed = cargar_snapshot_mo(db, version)
    return serializar_snapshot_mo(version.id, refreshed, CONFIGURACION_MO_DEFAULT)


@router.get(
    "/proyectos/{proyecto_id}/mano-obra/comparar",
    response_model=ComparacionManoObraResponse,
)
def comparar_mano_obra(
    proyecto_id: int,
    desde: int = Query(gt=0),
    hasta: int = Query(gt=0),
    db: Session = Depends(get_db),
) -> ComparacionManoObraResponse:
    source_version = _require_version(db, proyecto_id, desde)
    target_version = _require_version(db, proyecto_id, hasta)
    source = cargar_snapshot_mo(db, source_version)
    target = cargar_snapshot_mo(db, target_version)
    source_data = serializar_snapshot_mo(desde, source, CONFIGURACION_MO_DEFAULT)
    target_data = serializar_snapshot_mo(hasta, target, CONFIGURACION_MO_DEFAULT)
    source_lines = {line.id: line for line in source_data.actividades}
    target_lines = {line.id: line for line in target_data.actividades}
    added = [target_lines[key] for key in sorted(target_lines.keys() - source_lines.keys())]
    removed = [source_lines[key] for key in sorted(source_lines.keys() - target_lines.keys())]
    modified: list[DiferenciaLinea] = []
    comparable_fields = (
        "item",
        "descripcion",
        "unidad_medida",
        "cantidad",
        "rendimiento_base_oficial",
        "cant_oficiales",
        "cant_ayudantes",
        "ratio_ayudantes",
    )
    for line_id in sorted(source_lines.keys() & target_lines.keys()):
        old_line = source_lines[line_id].model_dump()
        new_line = target_lines[line_id].model_dump()
        changes = {
            field: {"anterior": old_line[field], "nuevo": new_line[field]}
            for field in comparable_fields
            if old_line[field] != new_line[field]
        }
        if changes:
            modified.append(DiferenciaLinea(id=line_id, cambios=changes))
    source_config = source_data.configuracion.model_dump()
    target_config = target_data.configuracion.model_dump()
    config_changes = {
        field: {"anterior": source_config[field], "nuevo": target_config[field]}
        for field in source_config
        if source_config[field] != target_config[field]
    }
    return ComparacionManoObraResponse(
        version_origen_id=desde,
        version_destino_id=hasta,
        total_origen=source_data.total_mo,
        total_destino=target_data.total_mo,
        diferencia_total=round(target_data.total_mo - source_data.total_mo, 4),
        configuracion_modificada=bool(config_changes),
        configuracion_cambios=config_changes,
        agregadas=added,
        eliminadas=removed,
        modificadas=modified,
    )


@router.get(
    "/proyectos/{proyecto_id}/auditoria",
    response_model=list[AuditoriaResponse],
)
def listar_auditoria(
    proyecto_id: int,
    limite: int = Query(default=100, ge=1, le=500),
    antes_de_id: int | None = Query(default=None, gt=0),
    db: Session = Depends(get_db),
) -> list[AuditoriaEvento]:
    if db.get(Proyecto, proyecto_id) is None:
        raise HTTPException(status_code=404, detail="El proyecto no existe.")
    statement = select(AuditoriaEvento).where(AuditoriaEvento.proyecto_id == proyecto_id)
    if antes_de_id is not None:
        statement = statement.where(AuditoriaEvento.id < antes_de_id)
    return list(
        db.scalars(statement.order_by(AuditoriaEvento.id.desc()).limit(limite)).all()
    )
