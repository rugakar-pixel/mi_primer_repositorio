from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
import os
import sys
from pathlib import Path

if __package__ in (None, ""):
	sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.db.base import Base
from app.db.session import engine
from app.api.v1.catalogo import router as catalogo_router
from app.api.v1.consolidado import router as consolidado_router
from app.api.v1.materiales_costos import router as materiales_costos_router
from app.api.v1.materiales import router as materiales_router
from app.api.v1.partidas import router as partidas_router
from app.api.v1.plataforma import router as plataforma_router
from app.api.v1.wbs import router as wbs_router
from app.api.v1.apu_maestro import router as apu_maestro_router
from app.api.v1.presupuesto_maestro import router as presupuesto_maestro_router
from app.models import database_models


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
	if (
		os.getenv("APP_ENV", "").casefold() == "development"
		and os.getenv("RESET_DB_SCHEMA_ON_STARTUP") == "1"
	):
		Base.metadata.drop_all(bind=engine)
	Base.metadata.create_all(bind=engine)
	if "rendimiento" not in {column["name"] for column in inspect(engine).get_columns("partidas")}:
		with engine.begin() as connection:
			connection.execute(text("ALTER TABLE partidas ADD COLUMN rendimiento NUMERIC(18, 4)"))
	yield


app = FastAPI(title="Costos de Obra API", lifespan=lifespan)
app.add_middleware(
	CORSMiddleware,
	allow_origins=[
		"http://localhost:3000",
		"http://127.0.0.1:3000",
		"http://localhost:5173",
		"http://127.0.0.1:5173",
	],
	allow_credentials=False,
	allow_methods=["GET", "POST", "PUT"],
	allow_headers=["*"],
)
app.include_router(catalogo_router, prefix="/api/v1")
app.include_router(consolidado_router, prefix="/api")
app.include_router(partidas_router, prefix="/api/v1")
app.include_router(materiales_costos_router, prefix="/api/v1")
app.include_router(materiales_router, prefix="/api/v1")
app.include_router(plataforma_router, prefix="/api/v1")
app.include_router(wbs_router, prefix="/api/v1")
app.include_router(apu_maestro_router, prefix="/api/v1")
app.include_router(presupuesto_maestro_router, prefix="/api/v1")


@app.get("/")
def read_root() -> dict[str, str]:
	return {"status": "ok", "message": "Backend Presupuestista Activo"}


@app.get("/health")
def health() -> dict[str, str]:
	return {"status": "ok"}


if __name__ == "__main__":
	import uvicorn

	uvicorn.run(app, host="127.0.0.1", port=8000)
