from fastapi import APIRouter, HTTPException

from app.schemas.materiales_costos import Project, RentalQuote
from app.services.materiales_costos import (
    calculate_project,
    load_demo_project,
    quote_rental,
)

router = APIRouter(prefix="/materiales-costos", tags=["materiales-y-costos"])


@router.get("/demo", response_model=Project)
def get_demo_project() -> Project:
    return load_demo_project()


@router.post("/calcular")
def calculate(payload: Project) -> dict[str, object]:
    return calculate_project(payload)


@router.post("/renta")
def calculate_rental(payload: RentalQuote) -> dict[str, float | str]:
    try:
        return quote_rental(load_demo_project(), payload)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
