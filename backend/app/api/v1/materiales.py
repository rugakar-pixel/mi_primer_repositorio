from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.database_models import (
    CategoriaMaterial,
    Material,
    MaterialPrecio,
    Proveedor,
    Usuario,
)
from app.schemas.materiales_reales import (
    CategoriaMaterialCreate,
    CategoriaMaterialResponse,
    CotizacionMaterialCreate,
    CotizacionMaterialResponse,
    MaterialCreate,
    MaterialResponse,
    ProveedorCreate,
    ProveedorResponse,
)
from app.services.materiales import _validar_consulta
from app.services.plataforma import registrar_auditoria

router = APIRouter(prefix="/materiales", tags=["materiales-reales-fase-2c"])


def _commit(db: Session) -> None:
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El registro entra en conflicto con una clave o restricción existente.",
        ) from error


def _require_actor(db: Session, actor_id: int | None) -> None:
    if actor_id is None:
        return
    actor = db.get(Usuario, actor_id)
    if actor is None or actor.estado != "Activo":
        raise HTTPException(status_code=404, detail="El usuario indicado no existe o está inactivo.")


def _category_response(category: CategoriaMaterial) -> CategoriaMaterialResponse:
    return CategoriaMaterialResponse.model_validate(category)


def _material_response(material: Material) -> MaterialResponse:
    return MaterialResponse(
        id=material.id,
        codigo=material.codigo,
        descripcion=material.descripcion,
        unidad=material.unidad,
        categoria_id=material.categoria_id,
        categoria_nombre=material.categoria.nombre,
        activo=material.activo,
    )


def _provider_response(provider: Proveedor) -> ProveedorResponse:
    return ProveedorResponse.model_validate(provider)


def _quote_response(quote: MaterialPrecio) -> CotizacionMaterialResponse:
    return CotizacionMaterialResponse(
        id=quote.id,
        material_id=quote.material_id,
        material_descripcion=quote.material.descripcion,
        proveedor_id=quote.proveedor_id,
        proveedor_nombre=quote.proveedor.nombre,
        costo_unitario=quote.costo_unitario,
        moneda=quote.moneda,
        unidad_precio=quote.unidad_precio,
        fecha_vigencia=quote.fecha_vigencia,
        registrado_en=quote.registrado_en,
        origen=quote.origen,
        referencia_cotizacion=quote.referencia_cotizacion,
        observacion=quote.observacion,
    )


@router.get("/categorias", response_model=list[CategoriaMaterialResponse])
def listar_categorias(
    db: Session = Depends(get_db),
) -> list[CategoriaMaterialResponse]:
    categories = db.scalars(
        select(CategoriaMaterial)
        .where(CategoriaMaterial.activo.is_(True))
        .order_by(CategoriaMaterial.nombre, CategoriaMaterial.id)
    ).all()
    return [_category_response(category) for category in categories]


@router.post(
    "/categorias",
    response_model=CategoriaMaterialResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_categoria(
    payload: CategoriaMaterialCreate,
    db: Session = Depends(get_db),
) -> CategoriaMaterialResponse:
    _require_actor(db, payload.creado_por_id)
    category = CategoriaMaterial(
        codigo=payload.codigo.strip(),
        nombre=payload.nombre.strip(),
        descripcion=payload.descripcion.strip() if payload.descripcion else None,
    )
    db.add(category)
    try:
        db.flush()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una categoría con ese código o nombre.",
        ) from error
    registrar_auditoria(
        db,
        accion="crear",
        entidad_tipo="categoria_material",
        entidad_id=category.id,
        actor_usuario_id=payload.creado_por_id,
        motivo=payload.motivo.strip(),
        nuevos={"codigo": category.codigo, "nombre": category.nombre},
    )
    _commit(db)
    db.refresh(category)
    return _category_response(category)


@router.get("", response_model=list[MaterialResponse])
def listar_materiales(
    categoria_id: int | None = Query(default=None, gt=0),
    db: Session = Depends(get_db),
) -> list[MaterialResponse]:
    statement = (
        select(Material, CategoriaMaterial)
        .join(CategoriaMaterial, Material.categoria_id == CategoriaMaterial.id)
        .where(Material.activo.is_(True))
    )
    if categoria_id is not None:
        statement = statement.where(Material.categoria_id == categoria_id)
    materials = db.execute(statement.order_by(Material.descripcion, Material.id)).all()
    return [
        MaterialResponse(
            id=material.id,
            codigo=material.codigo,
            descripcion=material.descripcion,
            unidad=material.unidad,
            categoria_id=material.categoria_id,
            categoria_nombre=category.nombre,
            activo=material.activo,
        )
        for material, category in materials
    ]


@router.post("", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
def crear_material(
    payload: MaterialCreate,
    db: Session = Depends(get_db),
) -> MaterialResponse:
    _require_actor(db, payload.creado_por_id)
    category = db.get(CategoriaMaterial, payload.categoria_id)
    if category is None or not category.activo:
        raise HTTPException(status_code=404, detail="La categoría indicada no existe o está inactiva.")
    material = Material(
        codigo=payload.codigo.strip(),
        descripcion=payload.descripcion.strip(),
        unidad=payload.unidad.strip(),
        categoria_id=category.id,
        maestro_partida_id=payload.maestro_partida_id,
    )
    db.add(material)
    try:
        db.flush()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El código de material o la referencia al catálogo ya existe.",
        ) from error
    registrar_auditoria(
        db,
        accion="crear",
        entidad_tipo="material",
        entidad_id=material.id,
        actor_usuario_id=payload.creado_por_id,
        motivo=payload.motivo.strip(),
        nuevos={
            "codigo": material.codigo,
            "descripcion": material.descripcion,
            "unidad": material.unidad,
            "categoria_id": category.id,
        },
    )
    _commit(db)
    db.refresh(material)
    return _material_response(material)


@router.get("/proveedores", response_model=list[ProveedorResponse])
def listar_proveedores(
    db: Session = Depends(get_db),
) -> list[ProveedorResponse]:
    providers = db.scalars(
        select(Proveedor)
        .where(Proveedor.activo.is_(True))
        .order_by(Proveedor.nombre, Proveedor.id)
    ).all()
    return [_provider_response(provider) for provider in providers]


@router.post(
    "/proveedores",
    response_model=ProveedorResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_proveedor(
    payload: ProveedorCreate,
    db: Session = Depends(get_db),
) -> ProveedorResponse:
    _require_actor(db, payload.creado_por_id)
    provider = Proveedor(
        nombre=payload.nombre.strip(),
        ruc=payload.ruc.strip() if payload.ruc else None,
        telefono=payload.telefono.strip() if payload.telefono else None,
        correo=payload.correo.strip() if payload.correo else None,
    )
    db.add(provider)
    try:
        db.flush()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un proveedor con ese RUC.",
        ) from error
    registrar_auditoria(
        db,
        accion="crear",
        entidad_tipo="proveedor",
        entidad_id=provider.id,
        actor_usuario_id=payload.creado_por_id,
        motivo=payload.motivo.strip(),
        nuevos={"nombre": provider.nombre, "ruc": provider.ruc, "correo": provider.correo},
    )
    _commit(db)
    db.refresh(provider)
    return _provider_response(provider)


@router.get("/{material_id}/cotizaciones", response_model=list[CotizacionMaterialResponse])
def listar_cotizaciones(
    material_id: int,
    moneda: str | None = Query(default=None, min_length=3, max_length=3),
    db: Session = Depends(get_db),
) -> list[CotizacionMaterialResponse]:
    material = db.get(Material, material_id)
    if material is None:
        raise HTTPException(status_code=404, detail="El material no existe.")
    statement = select(MaterialPrecio).where(MaterialPrecio.material_id == material.id)
    if moneda is not None:
        try:
            _, currency = _validar_consulta(None, moneda)
        except ValueError as error:
            raise HTTPException(status_code=422, detail=str(error)) from error
        statement = statement.where(MaterialPrecio.moneda == currency)
    quotes = db.scalars(
        statement.order_by(
            MaterialPrecio.fecha_vigencia.desc(),
            MaterialPrecio.registrado_en.desc(),
            MaterialPrecio.id.desc(),
        )
    ).all()
    return [_quote_response(quote) for quote in quotes]


@router.post(
    "/{material_id}/cotizaciones",
    response_model=CotizacionMaterialResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_cotizacion(
    material_id: int,
    payload: CotizacionMaterialCreate,
    db: Session = Depends(get_db),
) -> CotizacionMaterialResponse:
    _require_actor(db, payload.creado_por_id)
    material = db.get(Material, material_id)
    if material is None or not material.activo:
        raise HTTPException(status_code=404, detail="El material no existe o está inactivo.")
    provider = db.get(Proveedor, payload.proveedor_id)
    if provider is None or not provider.activo:
        raise HTTPException(status_code=404, detail="El proveedor no existe o está inactivo.")
    if payload.unidad_precio.strip().casefold() != material.unidad.strip().casefold():
        raise HTTPException(status_code=422, detail="La unidad del precio debe coincidir con la del material.")
    try:
        _, currency = _validar_consulta(payload.fecha_vigencia, payload.moneda)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    quote = MaterialPrecio(
        material_id=material.id,
        proveedor_id=provider.id,
        costo_unitario=payload.costo_unitario,
        moneda=currency,
        unidad_precio=material.unidad,
        fecha_vigencia=payload.fecha_vigencia,
        origen=payload.origen.strip(),
        referencia_cotizacion=(
            payload.referencia_cotizacion.strip() if payload.referencia_cotizacion else None
        ),
        observacion=payload.observacion.strip() if payload.observacion else None,
    )
    db.add(quote)
    db.flush()
    db.refresh(quote)
    registrar_auditoria(
        db,
        accion="crear",
        entidad_tipo="cotizacion_material",
        entidad_id=quote.id,
        actor_usuario_id=payload.creado_por_id,
        motivo=payload.motivo.strip(),
        nuevos={
            "material_id": material.id,
            "proveedor_id": provider.id,
            "costo_unitario": str(quote.costo_unitario),
            "moneda": quote.moneda,
            "unidad_precio": quote.unidad_precio,
            "fecha_vigencia": quote.fecha_vigencia.isoformat(),
            "origen": quote.origen,
            "referencia_cotizacion": quote.referencia_cotizacion,
        },
    )
    _commit(db)
    db.refresh(quote)
    return _quote_response(quote)


@router.get(
    "/{material_id}/precios-vigentes",
    response_model=list[CotizacionMaterialResponse],
)
def listar_precios_vigentes(
    material_id: int,
    fecha: datetime | None = Query(default=None),
    moneda: str = Query(default="NIO", min_length=3, max_length=3),
    db: Session = Depends(get_db),
) -> list[CotizacionMaterialResponse]:
    material = db.get(Material, material_id)
    if material is None or not material.activo:
        raise HTTPException(status_code=404, detail="El material no existe o está inactivo.")
    try:
        query_date, currency = _validar_consulta(fecha, moneda)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    quotes = db.scalars(
        select(MaterialPrecio)
        .join(Proveedor, MaterialPrecio.proveedor_id == Proveedor.id)
        .where(
            MaterialPrecio.material_id == material.id,
            MaterialPrecio.fecha_vigencia <= query_date,
            MaterialPrecio.moneda == currency,
            MaterialPrecio.unidad_precio == material.unidad,
            Proveedor.activo.is_(True),
        )
        .order_by(
            MaterialPrecio.proveedor_id,
            MaterialPrecio.fecha_vigencia.desc(),
            MaterialPrecio.registrado_en.desc(),
            MaterialPrecio.id.desc(),
        )
    ).all()
    newest_per_provider: list[MaterialPrecio] = []
    seen_provider_ids: set[int] = set()
    for quote in quotes:
        if quote.proveedor_id not in seen_provider_ids:
            seen_provider_ids.add(quote.proveedor_id)
            newest_per_provider.append(quote)
    newest_per_provider.sort(key=lambda quote: (quote.costo_unitario, quote.proveedor.nombre, quote.id))
    return [_quote_response(quote) for quote in newest_per_provider]


@router.get(
    "/{material_id}/precio-vigente",
    response_model=CotizacionMaterialResponse,
)
def obtener_mejor_precio_vigente(
    material_id: int,
    fecha: datetime | None = Query(default=None),
    moneda: str = Query(default="NIO", min_length=3, max_length=3),
    db: Session = Depends(get_db),
) -> CotizacionMaterialResponse:
    quotes = listar_precios_vigentes(material_id, fecha, moneda, db)
    if not quotes:
        raise HTTPException(status_code=404, detail="El material no tiene cotizaciones vigentes.")
    return quotes[0]


@router.get("/{material_id}", response_model=MaterialResponse)
def obtener_material(material_id: int, db: Session = Depends(get_db)) -> MaterialResponse:
    material = db.get(Material, material_id)
    if material is None:
        raise HTTPException(status_code=404, detail="El material no existe.")
    return _material_response(material)
