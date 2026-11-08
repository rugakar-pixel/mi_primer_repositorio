import tempfile
import unittest
from pathlib import Path

from fastapi import HTTPException
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.api.v1.plataforma import (
    CONFIGURACION_MO_DEFAULT,
    comparar_mano_obra,
    crear_empresa,
    crear_membresia,
    crear_proyecto,
    crear_usuario,
    crear_version,
    guardar_mano_obra,
    listar_auditoria,
    obtener_mano_obra,
)
from app.db.base import Base
from app.models.database_models import AuditoriaEvento, Proyecto, VersionProyecto
from app.schemas.plataforma import (
    EmpresaCreate,
    MembresiaCreate,
    ManoObraLinea,
    ManoObraSnapshotWrite,
    ProyectoCreate,
    UsuarioCreate,
    VersionProyectoCreate,
)


class PlataformaFaseUnoTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_directory = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temp_directory.name) / "phase1.sqlite"
        self.engine = create_engine(f"sqlite:///{self.database_path}")
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine, expire_on_commit=False)

    def tearDown(self) -> None:
        self.db.close()
        self.engine.dispose()
        self.temp_directory.cleanup()

    def crear_contexto(self) -> tuple[int, int, int]:
        empresa = crear_empresa(EmpresaCreate(nombre="Constructora Norte"), self.db)
        usuario = crear_usuario(
            UsuarioCreate(nombre="Ana Arquitecta", correo="ANA@example.com"),
            self.db,
        )
        crear_membresia(
            empresa.id,
            MembresiaCreate(usuario_id=usuario.id, rol="Administrador"),
            self.db,
        )
        proyecto = crear_proyecto(
            ProyectoCreate(
                empresa_id=empresa.id,
                nombre="Obra de prueba",
                creado_por_id=usuario.id,
            ),
            self.db,
        )
        return empresa.id, usuario.id, proyecto.id

    def test_persists_company_users_membership_and_audits(self) -> None:
        empresa_id, usuario_id, proyecto_id = self.crear_contexto()

        self.assertIsNotNone(self.db.get(Proyecto, proyecto_id))
        events = list(self.db.scalars(select(AuditoriaEvento)).all())
        self.assertGreaterEqual(len(events), 4)
        self.assertTrue(any(event.entidad_tipo == "empresa" for event in events))
        self.assertTrue(any(event.entidad_tipo == "membresia_empresa" for event in events))
        self.assertEqual(self.db.get(Proyecto, proyecto_id).empresa_id, empresa_id)
        self.assertEqual(events[1].actor_tipo, "no_autenticado")

    def test_labor_round_trip_new_version_comparison_and_audit(self) -> None:
        _, user_id, project_id = self.crear_contexto()
        version_one = crear_version(
            project_id,
            VersionProyectoCreate(motivo="Presupuesto inicial", creado_por_id=user_id),
            self.db,
        )
        source_line = ManoObraLinea(
            id="item-1",
            item=1,
            descripcion="Excavación manual",
            unidad_medida="M3",
            cantidad=12,
            rendimiento_base_oficial=2,
            cant_oficiales=1,
            cant_ayudantes=1,
            ratio_ayudantes=1,
        )
        saved_one = guardar_mano_obra(
            project_id,
            version_one.id,
            ManoObraSnapshotWrite(
                motivo="Guardar versión inicial",
                actualizado_por_id=user_id,
                configuracion=CONFIGURACION_MO_DEFAULT,
                actividades=[source_line],
            ),
            self.db,
        )
        self.assertTrue(saved_one.guardado)
        self.assertEqual(saved_one.revision, 1)
        self.assertGreater(saved_one.total_mo, 0)

        version_two = crear_version(
            project_id,
            VersionProyectoCreate(
                version_origen_id=version_one.id,
                motivo="Ajuste de rendimiento",
                creado_por_id=user_id,
            ),
            self.db,
        )
        restored_two = obtener_mano_obra(project_id, version_two.id, self.db)
        self.assertEqual(restored_two.actividades[0].cantidad, 12)
        self.assertEqual(restored_two.revision, 1)

        changed_line = source_line.model_copy(update={"cantidad": 15})
        changed_config = CONFIGURACION_MO_DEFAULT.model_copy(
            update={"pct_vacaciones": 0.09}
        )
        saved_two = guardar_mano_obra(
            project_id,
            version_two.id,
            ManoObraSnapshotWrite(
                revision_esperada=restored_two.revision,
                motivo="Aumentó la cantidad de excavación",
                actualizado_por_id=user_id,
                configuracion=changed_config,
                actividades=[changed_line],
            ),
            self.db,
        )
        self.assertEqual(saved_two.revision, 2)

        comparison = comparar_mano_obra(
            project_id,
            desde=version_one.id,
            hasta=version_two.id,
            db=self.db,
        )
        self.assertEqual(len(comparison.modificadas), 1)
        self.assertEqual(
            comparison.modificadas[0].cambios["cantidad"],
            {"anterior": 12.0, "nuevo": 15.0},
        )
        self.assertGreater(comparison.diferencia_total, 0)
        self.assertTrue(comparison.configuracion_modificada)
        self.assertEqual(
            comparison.configuracion_cambios["pct_vacaciones"],
            {"anterior": 0.0833, "nuevo": 0.09},
        )

        recovered_one = obtener_mano_obra(project_id, version_one.id, self.db)
        self.assertEqual(recovered_one.actividades[0].cantidad, 12)
        self.assertEqual(recovered_one.revision, 1)
        self.db.close()
        self.engine.dispose()
        self.engine = create_engine(f"sqlite:///{self.database_path}")
        self.db = Session(self.engine, expire_on_commit=False)
        recovered_after_session_restart = obtener_mano_obra(project_id, version_two.id, self.db)
        self.assertEqual(recovered_after_session_restart.actividades[0].cantidad, 15)

        events = listar_auditoria(project_id, limite=100, antes_de_id=None, db=self.db)
        self.assertTrue(any(event.accion == "actualizar" for event in events))
        self.assertTrue(
            any(
                event.version_proyecto_id == version_two.id
                and event.valores_anteriores is not None
                and event.valores_nuevos is not None
                for event in events
            )
        )

    def test_rejects_stale_revision_and_cross_project_version(self) -> None:
        _, user_id, project_id = self.crear_contexto()
        version = crear_version(
            project_id,
            VersionProyectoCreate(motivo="Inicial", creado_por_id=user_id),
            self.db,
        )
        saved = guardar_mano_obra(
            project_id,
            version.id,
            ManoObraSnapshotWrite(
                configuracion=CONFIGURACION_MO_DEFAULT,
                actividades=[],
            ),
            self.db,
        )
        updated = guardar_mano_obra(
            project_id,
            version.id,
            ManoObraSnapshotWrite(
                revision_esperada=saved.revision,
                motivo="Cambio de revisión para validar concurrencia",
                configuracion=CONFIGURACION_MO_DEFAULT,
                actividades=[],
            ),
            self.db,
        )
        with self.assertRaises(HTTPException) as stale_revision:
            guardar_mano_obra(
                project_id,
                version.id,
                ManoObraSnapshotWrite(
                    revision_esperada=saved.revision,
                    configuracion=CONFIGURACION_MO_DEFAULT,
                    actividades=[],
                ),
                self.db,
            )
        self.assertEqual(stale_revision.exception.status_code, 409)
        other_project = crear_proyecto(
            ProyectoCreate(empresa_id=self.db.get(Proyecto, project_id).empresa_id, nombre="Otra obra"),
            self.db,
        )
        with self.assertRaises(HTTPException) as cross_project:
            obtener_mano_obra(other_project.id, version.id, self.db)
        self.assertEqual(cross_project.exception.status_code, 404)

    def test_normalizes_user_email_and_rejects_duplicate_identity(self) -> None:
        first = crear_usuario(
            UsuarioCreate(nombre="Usuario uno", correo=" Persona@Ejemplo.com "),
            self.db,
        )
        self.assertEqual(first.correo_normalizado, "persona@ejemplo.com")
        with self.assertRaises(HTTPException) as duplicate:
            crear_usuario(
                UsuarioCreate(nombre="Usuario duplicado", correo="persona@ejemplo.com"),
                self.db,
            )
        self.assertEqual(duplicate.exception.status_code, 409)


if __name__ == "__main__":
    unittest.main()
