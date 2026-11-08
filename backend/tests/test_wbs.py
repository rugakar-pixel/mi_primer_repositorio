import tempfile
import unittest
from pathlib import Path

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.api.v1.plataforma import crear_empresa, crear_proyecto, crear_version
from app.api.v1.wbs import (
    actualizar_capitulo,
    actualizar_partida_wbs,
    crear_capitulo,
    crear_partida_wbs,
    eliminar_capitulo,
    eliminar_partida_wbs,
    obtener_wbs,
)
from app.db.base import Base
from app.models.database_models import VersionProyecto
from app.schemas.plataforma import (
    EmpresaCreate,
    ProyectoCreate,
    VersionProyectoCreate,
    WbsCapituloCreate,
    WbsCapituloUpdate,
    WbsPartidaCreate,
    WbsPartidaUpdate,
)


class FaseDosAWbsTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_directory = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temp_directory.name) / "fase2a.sqlite"
        self.engine = create_engine(f"sqlite:///{self.database_path}")
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine, expire_on_commit=False)

    def tearDown(self) -> None:
        self.db.close()
        self.engine.dispose()
        self.temp_directory.cleanup()

    def crear_proyecto_y_version(self) -> tuple[int, int]:
        empresa = crear_empresa(EmpresaCreate(nombre="Constructora WBS"), self.db)
        proyecto = crear_proyecto(
            ProyectoCreate(empresa_id=empresa.id, nombre="Edificio de prueba"),
            self.db,
        )
        version = crear_version(
            proyecto.id,
            VersionProyectoCreate(motivo="Versión inicial"),
            self.db,
        )
        return proyecto.id, version.id

    def test_round_trip_restart_and_independent_version_copy(self) -> None:
        project_id, version_one_id = self.crear_proyecto_y_version()
        chapter = crear_capitulo(
            project_id,
            version_one_id,
            WbsCapituloCreate(codigo="01", nombre="Obras preliminares"),
            self.db,
        )
        part = crear_partida_wbs(
            project_id,
            version_one_id,
            chapter.id,
            WbsPartidaCreate(
                codigo="01.01",
                descripcion="Limpieza inicial",
                unidad="M2",
                cantidad=250,
            ),
            self.db,
        )

        self.db.close()
        self.engine.dispose()
        self.engine = create_engine(f"sqlite:///{self.database_path}")
        self.db = Session(self.engine, expire_on_commit=False)

        restored = obtener_wbs(project_id, version_one_id, self.db)
        self.assertEqual(restored.empresa_id, 1)
        self.assertEqual(restored.capitulos[0].nombre, "Obras preliminares")
        self.assertEqual(restored.capitulos[0].partidas[0].descripcion, "Limpieza inicial")
        self.assertEqual(restored.capitulos[0].partidas[0].cantidad, 250)

        version_two = crear_version(
            project_id,
            VersionProyectoCreate(version_origen_id=version_one_id, motivo="Ajuste de alcance"),
            self.db,
        )
        copied = obtener_wbs(project_id, version_two.id, self.db)
        self.assertEqual(len(copied.capitulos), 1)
        self.assertNotEqual(copied.capitulos[0].id, chapter.id)
        self.assertNotEqual(copied.capitulos[0].partidas[0].id, part.id)

        updated_chapter = actualizar_capitulo(
            project_id,
            version_two.id,
            copied.capitulos[0].id,
            WbsCapituloUpdate(nombre="Obras preliminares ampliadas"),
            self.db,
        )
        updated_part = actualizar_partida_wbs(
            project_id,
            version_two.id,
            copied.capitulos[0].id,
            copied.capitulos[0].partidas[0].id,
            WbsPartidaUpdate(cantidad=300),
            self.db,
        )
        self.assertEqual(updated_chapter.nombre, "Obras preliminares ampliadas")
        self.assertEqual(updated_part.cantidad, 300)

        restored_one = obtener_wbs(project_id, version_one_id, self.db)
        restored_two = obtener_wbs(project_id, version_two.id, self.db)
        self.assertEqual(restored_one.capitulos[0].nombre, "Obras preliminares")
        self.assertEqual(restored_one.capitulos[0].partidas[0].cantidad, 250)
        self.assertEqual(restored_two.capitulos[0].nombre, "Obras preliminares ampliadas")
        self.assertEqual(restored_two.capitulos[0].partidas[0].cantidad, 300)

    def test_version_must_belong_to_project(self) -> None:
        project_id, version_id = self.crear_proyecto_y_version()
        other_project = crear_proyecto(
            ProyectoCreate(empresa_id=1, nombre="Otro proyecto"),
            self.db,
        )

        with self.assertRaises(HTTPException) as mismatch:
            obtener_wbs(other_project.id, version_id, self.db)

        self.assertEqual(mismatch.exception.status_code, 404)
        self.assertIsNotNone(self.db.get(VersionProyecto, version_id))
        self.assertNotEqual(project_id, other_project.id)

    def test_deleting_structure_in_derived_version_preserves_source(self) -> None:
        project_id, version_one_id = self.crear_proyecto_y_version()
        chapter = crear_capitulo(
            project_id,
            version_one_id,
            WbsCapituloCreate(codigo="02", nombre="Cimentación"),
            self.db,
        )
        part = crear_partida_wbs(
            project_id,
            version_one_id,
            chapter.id,
            WbsPartidaCreate(
                codigo="02.01",
                descripcion="Excavación",
                unidad="M3",
                cantidad=20,
            ),
            self.db,
        )
        version_two = crear_version(
            project_id,
            VersionProyectoCreate(version_origen_id=version_one_id, motivo="Nueva revisión"),
            self.db,
        )
        copied_chapter = obtener_wbs(project_id, version_two.id, self.db).capitulos[0]
        copied_part = copied_chapter.partidas[0]

        result = eliminar_partida_wbs(
            project_id,
            version_two.id,
            copied_chapter.id,
            copied_part.id,
            self.db,
        )
        self.assertEqual(result.status_code, 204)
        eliminar_capitulo(project_id, version_two.id, copied_chapter.id, self.db)

        source = obtener_wbs(project_id, version_one_id, self.db)
        derived = obtener_wbs(project_id, version_two.id, self.db)
        self.assertEqual(source.capitulos[0].id, chapter.id)
        self.assertEqual(source.capitulos[0].partidas[0].id, part.id)
        self.assertEqual(len(derived.capitulos), 0)


if __name__ == "__main__":
    unittest.main()
