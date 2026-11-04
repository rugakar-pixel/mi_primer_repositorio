from math import ceil

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.database_models import MaestroPartidas

router = APIRouter(tags=["catálogo"])


class CatalogoItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    codigo: str
    descripcion: str
    unidad: str
    costo_unitario: float
    categoria: str


class CatalogoResponse(BaseModel):
    items: list[CatalogoItem]
    total: int
    page: int
    limit: int
    total_pages: int
    categorias: list[str]


@router.get("/catalogo", response_model=CatalogoResponse)
def listar_catalogo(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None, max_length=120),
    categoria: str | None = Query(default=None, max_length=80),
    db: Session = Depends(get_db),
) -> CatalogoResponse:
    filters = []
    if search and search.strip():
        term = f"%{search.strip()}%"
        filters.append(
            or_(
                MaestroPartidas.codigo.ilike(term),
                MaestroPartidas.descripcion.ilike(term),
                MaestroPartidas.unidad.ilike(term),
            )
        )
    if categoria:
        filters.append(MaestroPartidas.categoria == categoria)

    total = db.scalar(
        select(func.count()).select_from(MaestroPartidas).where(*filters)
    ) or 0
    records = db.scalars(
        select(MaestroPartidas)
        .where(*filters)
        .order_by(MaestroPartidas.codigo)
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()
    categorias = db.scalars(
        select(MaestroPartidas.categoria)
        .distinct()
        .order_by(MaestroPartidas.categoria)
    ).all()

    return CatalogoResponse(
        items=[CatalogoItem.model_validate(record) for record in records],
        total=total,
        page=page,
        limit=limit,
        total_pages=ceil(total / limit) if total else 0,
        categorias=categorias,
    )