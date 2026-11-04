from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db.session import get_db
from app.models.database_models import AnalisisPrecioUnitario, Capitulo, Partida, TipoAPU

router = APIRouter(prefix="/partidas", tags=["partidas-apu"])


class LineaAPUCreate(BaseModel):
    tipo: TipoAPU = TipoAPU.MANO_DE_OBRA
    descripcion: str = Field(min_length=1, max_length=300)
    unidad: str = Field(min_length=1, max_length=30)
    cantidad: Decimal = Field(ge=0)
    costo_unitario: Decimal = Field(ge=0)
    rendimiento: Decimal | None = Field(default=None, gt=0)


class PartidaCreate(BaseModel):
    capitulo_id: int = Field(gt=0)
    codigo: str = Field(min_length=1, max_length=50)
    descripcion: str = Field(min_length=1, max_length=500)
    unidad: str = Field(min_length=1, max_length=30)
    cantidad: Decimal = Field(default=Decimal("1"), gt=0)
    rendimiento: Decimal | None = Field(default=None, gt=0)
    analisis_unitarios: list[LineaAPUCreate] = Field(default_factory=list)


class LineaAPUResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tipo: TipoAPU
    descripcion: str
    unidad: str
    cantidad: Decimal
    costo_unitario: Decimal
    rendimiento: Decimal | None
    costo_parcial: Decimal


class PartidaResponse(BaseModel):
    id: int
    capitulo_id: int
    codigo: str
    descripcion: str
    unidad: str
    cantidad: Decimal
    rendimiento: Decimal | None
    mano_obra: Decimal
    materiales: Decimal
    equipos: Decimal
    costo_total: Decimal
    analisis_unitarios: list[LineaAPUResponse]


def _serialize_partida(partida: Partida) -> PartidaResponse:
    subtotals = {tipo: Decimal("0") for tipo in TipoAPU}
    lineas = []
    for linea in partida.analisis_unitarios:
        parcial = linea.cantidad * linea.costo_unitario
        subtotals[linea.tipo] += parcial
        lineas.append(
            LineaAPUResponse(
                id=linea.id,
                tipo=linea.tipo,
                descripcion=linea.descripcion,
                unidad=linea.unidad,
                cantidad=linea.cantidad,
                costo_unitario=linea.costo_unitario,
                rendimiento=linea.rendimiento,
                costo_parcial=parcial,
            )
        )
    mano_obra = subtotals[TipoAPU.MANO_DE_OBRA]
    materiales = subtotals[TipoAPU.MATERIAL]
    equipos = subtotals[TipoAPU.EQUIPO_MAQUINARIA]
    return PartidaResponse(
        id=partida.id,
        capitulo_id=partida.capitulo_id,
        codigo=partida.codigo,
        descripcion=partida.descripcion,
        unidad=partida.unidad,
        cantidad=partida.cantidad,
        rendimiento=partida.rendimiento,
        mano_obra=mano_obra,
        materiales=materiales,
        equipos=equipos,
        costo_total=mano_obra + materiales + equipos,
        analisis_unitarios=lineas,
    )


@router.get("", response_model=list[PartidaResponse])
def listar_partidas(
    capitulo_id: int | None = Query(default=None, gt=0),
    db: Session = Depends(get_db),
) -> list[PartidaResponse]:
    statement = select(Partida).options(selectinload(Partida.analisis_unitarios))
    if capitulo_id is not None:
        statement = statement.where(Partida.capitulo_id == capitulo_id)
    partidas = db.scalars(statement.order_by(Partida.codigo)).all()
    return [_serialize_partida(partida) for partida in partidas]


@router.post("", response_model=PartidaResponse, status_code=status.HTTP_201_CREATED)
def crear_partida(payload: PartidaCreate, db: Session = Depends(get_db)) -> PartidaResponse:
    capitulo = db.get(Capitulo, payload.capitulo_id)
    if capitulo is None:
        raise HTTPException(status_code=404, detail="El capítulo indicado no existe.")

    costo_mano_obra = sum(
        (linea.cantidad * linea.costo_unitario for linea in payload.analisis_unitarios if linea.tipo == TipoAPU.MANO_DE_OBRA),
        Decimal("0"),
    )
    costo_materiales = sum(
        (linea.cantidad * linea.costo_unitario for linea in payload.analisis_unitarios if linea.tipo == TipoAPU.MATERIAL),
        Decimal("0"),
    )
    costo_equipos = sum(
        (linea.cantidad * linea.costo_unitario for linea in payload.analisis_unitarios if linea.tipo == TipoAPU.EQUIPO_MAQUINARIA),
        Decimal("0"),
    )
    partida = Partida(
        capitulo_id=payload.capitulo_id,
        codigo=payload.codigo,
        descripcion=payload.descripcion,
        unidad=payload.unidad,
        cantidad=payload.cantidad,
        rendimiento=payload.rendimiento,
        costo_unitario=costo_mano_obra + costo_materiales + costo_equipos,
        analisis_unitarios=[AnalisisPrecioUnitario(**linea.model_dump()) for linea in payload.analisis_unitarios],
    )
    db.add(partida)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(partida)
    return _serialize_partida(partida)
