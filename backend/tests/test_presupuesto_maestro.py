import tempfile
import unittest
from decimal import Decimal
from pathlib import Path

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.api.v1.plataforma import crear_empresa, crear_proyecto, crear_version
from app.api.v1.wbs import (
    actualizar_capitulo,
    actualizar_partida_wbs,
    crear_capitulo,
    crear_partida_wbs,
)
from app.db.base import Base
from app.models.database_models import (
    AuditoriaEvento,
    PresupuestoMaestro,
    PresupuestoMaestroCapitulo,
    PresupuestoMaestroPartida,
)
from app.schemas.plataforma import (
    EmpresaCreate,
    ProyectoCreate,
    VersionProyectoCreate,
    WbsCapituloCreate,
    WbsCapituloUpdate,
    WbsPartidaCreate,
    WbsPartidaUpdate,
)
from app.services.presupuesto_maestro import (
    actualizar_costo_partida,
    calcular_presupuesto_maestro,
)


class FaseDosD1PresupuestoMaestroTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_directory = tempfile.TemporaryDirectory()
        database_path = Path(self.temp_directory.name) / "fase2d1.sqlite"
        self.engine = create_engine(f"sqlite:///{database_path}")
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine, expire_on_commit=False)

    def tearDown(self) -> None:
        self.db.close()
        self.engine.dispose()
        self.temp_directory.cleanup()

    def crear_contexto(self) -> tuple[int, int, int, list[int]]:
        company = crear_empresa(EmpresaCreate(nombre="COS Fase 2D.1"), self.db)
        project = crear_proyecto(
            ProyectoCreate(empresa_id=company.id, nombre="Tanque Elevado"),
            self.db,
        )
        version = crear_version(
            project.id,
            VersionProyectoCreate(motivo="Versión V1"),
            self.db,
        )
        chapter = crear_capitulo(
            project.id,
            version.id,
            WbsCapituloCreate(codigo="01", nombre="Cimentaciones"),
            self.db,
        )
        parts = [
            crear_partida_wbs(
                project.id,
                version.id,
                chapter.id,
                WbsPartidaCreate(codigo="01.01", descripcion="Excavación", unidad="M3", cantidad=10),
                self.db,
            ),
            crear_partida_wbs(
                project.id,
                version.id,
                chapter.id,
                WbsPartidaCreate(codigo="01.02", descripcion="Concreto", unidad="M3", cantidad=20),
                self.db,
            ),
            crear_partida_wbs(
                project.id,
                version.id,
                chapter.id,
                WbsPartidaCreate(codigo="01.03", descripcion="Acero", unidad="KG", cantidad=30),
                self.db,
            ),
        ]
        return project.id, version.id, chapter.id, [part.id for part in parts]

    def test_1_persiste_proyecto_version_capitulo_y_partidas(self) -> None:
        project_id, version_id, chapter_id, part_ids = self.crear_contexto()
        budget = calcular_presupuesto_maestro(self.db, project_id, version_id)

        self.assertIsNotNone(self.db.get(PresupuestoMaestro, budget.id))
        self.assertEqual(budget.version_proyecto_id, version_id)
        self.assertEqual(self.db.scalar(select(PresupuestoMaestroCapitulo.capitulo_id)), chapter_id)
        self.assertEqual(
            self.db.scalar(select(PresupuestoMaestroPartida.partida_id).order_by(PresupuestoMaestroPartida.partida_id)),
            min(part_ids),
        )

    def test_2_asignar_costos_y_calcular_totales(self) -> None:
        project_id, version_id, chapter_id, part_ids = self.crear_contexto()
        for part_id, cost in zip(part_ids, ["100", "200", "50"]):
            actualizar_costo_partida(
                self.db,
                project_id,
                version_id,
                chapter_id,
                part_id,
                Decimal(cost),
                motivo="Asignación de costo de prueba",
            )

        budget = calcular_presupuesto_maestro(self.db, project_id, version_id)
        self.assertEqual(budget.total_general, Decimal("6500.0000"))
        chapter = self.db.scalar(select(PresupuestoMaestroCapitulo))
        self.assertEqual(chapter.total, Decimal("6500.0000"))

    def test_3_modificar_partida_recalcula_capitulo(self) -> None:
        project_id, version_id, chapter_id, part_ids = self.crear_contexto()
        actualizar_costo_partida(
            self.db, project_id, version_id, chapter_id, part_ids[0], Decimal("100"), motivo="Costo inicial"
        )
        actualizar_costo_partida(
            self.db, project_id, version_id, chapter_id, part_ids[1], Decimal("200"), motivo="Costo inicial"
        )
        actualizar_partida_wbs(
            project_id,
            version_id,
            chapter_id,
            part_ids[1],
            WbsPartidaUpdate(cantidad=25),
            self.db,
        )
        budget = calcular_presupuesto_maestro(self.db, project_id, version_id)
        chapter = self.db.scalar(select(PresupuestoMaestroCapitulo))
        self.assertEqual(chapter.total, Decimal("6000.0000"))
        self.assertEqual(budget.total_general, Decimal("6000.0000"))

    def test_4_modificar_capitulo_recalcula_total_general(self) -> None:
        project_id, version_id, chapter_id, part_ids = self.crear_contexto()
        actualizar_costo_partida(
            self.db, project_id, version_id, chapter_id, part_ids[0], Decimal("100"), motivo="Costo inicial"
        )
        before = calcular_presupuesto_maestro(self.db, project_id, version_id)
        before_revision = before.revision
        actualizar_capitulo(
            project_id,
            version_id,
            chapter_id,
            WbsCapituloUpdate(nombre="Cimentaciones modificadas"),
            self.db,
        )
        after = calcular_presupuesto_maestro(self.db, project_id, version_id)
        self.assertEqual(before.total_general, after.total_general)
        self.assertGreater(after.revision, before_revision)

    def test_5_guardar_cerrar_reabrir_y_recuperar(self) -> None:
        project_id, version_id, chapter_id, part_ids = self.crear_contexto()
        actualizar_costo_partida(
            self.db, project_id, version_id, chapter_id, part_ids[0], Decimal("125"), motivo="Costo persistido"
        )
        budget = calcular_presupuesto_maestro(self.db, project_id, version_id)
        self.db.close()
        self.engine.dispose()
        self.engine = create_engine(f"sqlite:///{self.temp_directory.name}/fase2d1.sqlite")
        self.db = Session(self.engine, expire_on_commit=False)

        restored = self.db.get(PresupuestoMaestro, budget.id)
        self.assertEqual(restored.total_general, Decimal("1250.0000"))
        self.assertEqual(len(restored.capitulos), 1)
        self.assertEqual(restored.capitulos[0].nombre, "Cimentaciones")
        self.assertGreaterEqual(
            self.db.scalar(
                select(AuditoriaEvento.id).where(AuditoriaEvento.entidad_tipo == "presupuesto_maestro")
            ),
            1,
        )


if __name__ == "__main__":
    unittest.main()
