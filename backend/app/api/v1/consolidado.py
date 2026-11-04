from fastapi import APIRouter, HTTPException

from app.schemas.consolidado import ConsolidationRequest, ConsolidationResponse, ConsolidationSummary
from app.services.consolidado import budget_consolidation_service

router = APIRouter(prefix="/consolidado", tags=["consolidado"])


@router.post("", response_model=ConsolidationResponse)
def consolidate_budget(payload: ConsolidationRequest) -> ConsolidationResponse:
    try:
        return budget_consolidation_service.consolidate(payload)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@router.post("/resumen", response_model=ConsolidationSummary)
def consolidate_summary(payload: ConsolidationRequest) -> ConsolidationSummary:
    try:
        return budget_consolidation_service.consolidate(payload).resumen
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
