import tempfile
import unittest
from decimal import Decimal
from pathlib import Path

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.api.v1.apu_maestro import (
    actualizar_apu_maestro,
    asociar_apu_a_partida,
    crear_apu_maestro,
    crear_version_apu,
    listar_auditoria_apu,
    listar_usos_apu,
    listar_versiones_apu,
)
from app.api.v1.plataforma import crear_empresa, crear_proyecto, crear_version
from app.api.v1.wbs import crear_capitulo, crear_partida_wbs
from app.db.base import Base
from app.models.database_models import APUMaestro, AuditoriaEvento, UsoAPU, VersionAPU
from app.schemas.plataforma import (
    APUMaestroCreate,
    APUMaestroUpdate,
    EmpresaCreate,
    ProyectoCreate,
    UsoAPUCreate,
    VersionAPUCreate,
    VersionProyectoCreate,
    WbsCapituloCreate,
    WbsPartidaCreate,
)


class FaseDosBAPUMaestroTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_directory = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temp_directory.name) / "fase2b.sqlite"
        self.engine = create_engine(f"sqlite:///{self.database_path}")
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine, expire_on_commit=False)

    def tearDown(self) -> None:
        self.db.close()
        self.engine.dispose()
        self.temp_directory.cleanup()

    def crear_proyecto_y_partida(self, nombre: str) -> tuple[int, int, int]:
        empresa = crear_empresa(EmpresaCreate(nombre=f"Empresa {nombre}"), self.db)
        proyecto = crear_proyecto(
            ProyectoCreate(empresa_id=empresa.id, nombre=nombre),
            self.db,
        )
        version = crear_version(
            proyecto.id,
            VersionProyectoCreate(motivo="Presupuesto inicial"),
            self.db,
        )
        chapter = crear_capitulo(
            proyecto.id,
            version.id,
            WbsCapituloCreate(codigo="01", nombre="Obras civiles"),
            self.db,
        )
        part = crear_partida_wbs(
            proyecto.id,
            version.id,
            chapter.id,
            WbsPartidaCreate(
                codigo="01.01",
                descripcion="Concreto estructural",
                unidad="M3",
                cantidad=10,
            ),
            self.db,
        )
        return proyecto.id, version.id, part.id

    def crear_master(self):
        return crear_apu_maestro(
            APUMaestroCreate(
                nombre="Concreto 3000 PSI",
                descripcion="Concreto estructural de resistencia 3000 PSI",
                unidad="M3",
            ),
            self.db,
        )

    def crear_version(self, master_id: int, costo: str, motivo: str):
        return crear_version_apu(
            master_id,
            VersionAPUCreate(costo_unitario=costo, motivo=motivo),
            self.db,
        )

    def asociar(self, context: tuple[int, int, int], version_apu_id: int):
        project_id, project_version_id, part_id = context
        return asociar_apu_a_partida(
            project_id,
            project_version_id,
            part_id,
            UsoAPUCreate(version_apu_id=version_apu_id),
            self.db,
        )

    def test_master_and_multiple_versions_are_persisted(self) -> None:
        master = self.crear_master()
        version_one = self.crear_version(master.id, "1250.00", "Primera revisión")
        version_two = self.crear_version(master.id, "1325.50", "Ajuste de costos")

        self.assertIsNotNone(self.db.get(APUMaestro, master.id))
        self.assertEqual([version.numero for version in listar_versiones_apu(master.id, self.db)], [1, 2])
        self.assertEqual(version_one.costo_unitario, version_two.costo_unitario - Decimal("75.5"))
        self.assertEqual(self.db.scalar(select(VersionAPU).where(VersionAPU.id == version_one.id)).numero, 1)

    def test_two_projects_use_distinct_frozen_versions_and_master_usage_is_queryable(self) -> None:
        master = self.crear_master()
        version_one = self.crear_version(master.id, "1250.00", "Primera revisión")
        version_two = self.crear_version(master.id, "1325.50", "Segunda revisión")
        project_a = self.crear_proyecto_y_partida("Proyecto A")
        project_b = self.crear_proyecto_y_partida("Proyecto B")

        use_a = self.asociar(project_a, version_one.id)
        use_b = self.asociar(project_b, version_two.id)
        uses = listar_usos_apu(master.id, self.db)

        self.assertEqual([(use.proyecto_nombre, use.version_apu_numero) for use in uses], [
            ("Proyecto A", 1),
            ("Proyecto B", 2),
        ])
        self.assertEqual(use_a.snapshot["costo_unitario"], "1250.0000")
        self.assertEqual(use_b.snapshot["costo_unitario"], "1325.5000")
        self.assertEqual(use_a.partida_codigo, "01.01")
        self.assertEqual(self.db.scalar(select(UsoAPU).where(UsoAPU.id == use_a.id)).version_apu_id, version_one.id)

    def test_new_revision_does_not_change_prior_project_snapshot(self) -> None:
        master = self.crear_master()
        version_one = self.crear_version(master.id, "1250.00", "Primera revisión")
        version_two = self.crear_version(master.id, "1325.50", "Segunda revisión")
        project_a = self.crear_proyecto_y_partida("Proyecto A")
        project_b = self.crear_proyecto_y_partida("Proyecto B")
        self.asociar(project_a, version_one.id)
        self.asociar(project_b, version_two.id)

        actualizar_apu_maestro(
            master.id,
            APUMaestroUpdate(nombre="Concreto 3000 PSI - actualizado", motivo="Actualizar catálogo"),
            self.db,
        )
        version_three = self.crear_version(master.id, "1400.00", "Nueva revisión basada en la versión 2")
        uses = listar_usos_apu(master.id, self.db)
        stored_version_two = self.db.get(VersionAPU, version_two.id)

        self.assertEqual(version_three.numero, 3)
        self.assertEqual(stored_version_two.nombre, "Concreto 3000 PSI")
        self.assertEqual(stored_version_two.costo_unitario, 1325.5)
        self.assertEqual(
            [(use.proyecto_nombre, use.version_apu_numero, use.snapshot["costo_unitario"]) for use in uses],
            [("Proyecto A", 1, "1250.0000"), ("Proyecto B", 2, "1325.5000")],
        )

    def test_usage_is_copied_when_a_project_budget_version_is_derived(self) -> None:
        master = self.crear_master()
        apu_version = self.crear_version(master.id, "1250.00", "Primera revisión")
        project_id, version_one_id, part_id = self.crear_proyecto_y_partida("Proyecto con revisiones")
        self.asociar((project_id, version_one_id, part_id), apu_version.id)

        version_two = crear_version(
            project_id,
            VersionProyectoCreate(
                version_origen_id=version_one_id,
                motivo="Nueva revisión del presupuesto",
            ),
            self.db,
        )
        copied_usage = self.db.scalar(
            select(UsoAPU).where(
                UsoAPU.version_proyecto_id == version_two.id,
                UsoAPU.partida_id != part_id,
            )
        )

        self.assertIsNotNone(copied_usage)
        self.assertEqual(copied_usage.version_apu_id, apu_version.id)
        self.assertEqual(copied_usage.snapshot["costo_unitario"], "1250.0000")
        self.assertEqual(copied_usage.snapshot["version_proyecto_id"], version_two.id)

    def test_create_edit_version_and_use_are_audited(self) -> None:
        master = self.crear_master()
        self.crear_version(master.id, "1250.00", "Primera revisión")
        project = self.crear_proyecto_y_partida("Proyecto auditoría")
        self.asociar(project, 1)
        actualizar_apu_maestro(
            master.id,
            APUMaestroUpdate(nombre="Concreto editado", motivo="Corrección de nombre"),
            self.db,
        )

        events = listar_auditoria_apu(master.id, limite=100, antes_de_id=None, db=self.db)

        self.assertEqual({event.accion for event in events}, {"crear", "actualizar", "versionar", "uso"})
        self.assertTrue(all(event.entidad_tipo == "apu_maestro" for event in events))
        self.assertGreaterEqual(
            self.db.scalar(select(AuditoriaEvento.id).where(AuditoriaEvento.entidad_tipo == "apu_maestro")),
            1,
        )


if __name__ == "__main__":
    unittest.main()
