import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path

from fastapi import HTTPException
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.api.v1.apu_maestro import (
    asociar_apu_a_partida,
    crear_apu_maestro,
    crear_version_apu,
)
from app.api.v1.materiales import (
    crear_categoria,
    crear_cotizacion,
    crear_material,
    crear_proveedor,
    listar_cotizaciones,
    listar_precios_vigentes,
)
from app.api.v1.plataforma import (
    crear_empresa,
    crear_membresia,
    crear_proyecto,
    crear_usuario,
    crear_version,
)
from app.api.v1.wbs import crear_capitulo, crear_partida_wbs
from app.db.base import Base
from app.models.database_models import (
    AuditoriaEvento,
    Material,
    MaterialPrecio,
    Proveedor,
    UsoAPU,
    VersionAPU,
)
from app.schemas.materiales_reales import (
    CategoriaMaterialCreate,
    CotizacionMaterialCreate,
    MaterialCreate,
    ProveedorCreate,
)
from app.schemas.plataforma import (
    APUMaestroCreate,
    APUCostoDetalle,
    EmpresaCreate,
    MembresiaCreate,
    ProyectoCreate,
    UsoAPUCreate,
    UsuarioCreate,
    VersionAPUCreate,
    VersionProyectoCreate,
    WbsCapituloCreate,
    WbsPartidaCreate,
)


class Fase2CMaterialesTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_directory = tempfile.TemporaryDirectory()
        database_path = Path(self.temp_directory.name) / "fase2c.sqlite"
        self.engine = create_engine(f"sqlite:///{database_path}")
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine, expire_on_commit=False)

        self.actor = crear_usuario(
            UsuarioCreate(nombre="Arquitecto COS", correo="arquitecto@cos.test"),
            self.db,
        )
        self.company = crear_empresa(
            EmpresaCreate(nombre="Constructora COS"),
            self.db,
        )
        crear_membresia(
            self.company.id,
            MembresiaCreate(usuario_id=self.actor.id),
            self.db,
        )
        self.project = crear_proyecto(
            ProyectoCreate(
                empresa_id=self.company.id,
                nombre="Tanque Elevado",
                creado_por_id=self.actor.id,
            ),
            self.db,
        )
        self.project_version = crear_version(
            self.project.id,
            VersionProyectoCreate(motivo="Versión inicial V1", creado_por_id=self.actor.id),
            self.db,
        )
        chapter = crear_capitulo(
            self.project.id,
            self.project_version.id,
            WbsCapituloCreate(
                codigo="01",
                nombre="Cimentaciones",
                creado_por_id=self.actor.id,
            ),
            self.db,
        )
        self.part = crear_partida_wbs(
            self.project.id,
            self.project_version.id,
            chapter.id,
            WbsPartidaCreate(
                codigo="01.01",
                descripcion="Concreto 3000 PSI",
                unidad="M3",
                cantidad=1,
                creado_por_id=self.actor.id,
            ),
            self.db,
        )
        category = crear_categoria(
            CategoriaMaterialCreate(
                codigo="CEM",
                nombre="Cemento",
                creado_por_id=self.actor.id,
                motivo="Catálogo de materiales del proyecto",
            ),
            self.db,
        )
        self.material = crear_material(
            MaterialCreate(
                codigo="CEM-GU",
                descripcion="Cemento GU",
                unidad="SACO",
                categoria_id=category.id,
                creado_por_id=self.actor.id,
                motivo="Alta de material para concreto",
            ),
            self.db,
        )
        self.providers = [
            crear_proveedor(
                ProveedorCreate(
                    nombre=f"Proveedor {letter}",
                    creado_por_id=self.actor.id,
                    motivo="Alta de proveedor del proyecto",
                ),
                self.db,
            )
            for letter in ("A", "B", "C")
        ]
        self.fecha_precio = datetime.now(timezone.utc) - timedelta(days=1)

    def tearDown(self) -> None:
        self.db.close()
        self.engine.dispose()
        self.temp_directory.cleanup()

    def agregar_cotizacion(self, proveedor_id: int, precio: str):
        return crear_cotizacion(
            self.material.id,
            CotizacionMaterialCreate(
                proveedor_id=proveedor_id,
                costo_unitario=Decimal(precio),
                moneda="NIO",
                unidad_precio="SACO",
                fecha_vigencia=self.fecha_precio,
                origen="cotización de proveedor",
                referencia_cotizacion=f"COT-{proveedor_id}-{precio}",
                observacion="Precio confirmado para pruebas",
                creado_por_id=self.actor.id,
                motivo="Registrar oferta recibida",
            ),
            self.db,
        )

    def crear_apu_con_cotizacion(self, quote_id: int):
        master = crear_apu_maestro(
            APUMaestroCreate(
                nombre="Concreto 3000 PSI",
                descripcion="Análisis unitario de concreto estructural",
                unidad="M3",
                creado_por_id=self.actor.id,
                motivo="Alta del APU funcional",
            ),
            self.db,
        )
        version = crear_version_apu(
            master.id,
            VersionAPUCreate(
                detalle=[
                    APUCostoDetalle(
                        concepto="Cemento GU",
                        unidad="SACO",
                        cantidad=Decimal("1"),
                        material_id=self.material.id,
                        proveedor_id=self.providers[1].id,
                        material_precio_id=quote_id,
                    )
                ],
                motivo="Seleccionar cotización vigente del proveedor B",
                creado_por_id=self.actor.id,
            ),
            self.db,
        )
        usage = asociar_apu_a_partida(
            self.project.id,
            self.project_version.id,
            self.part.id,
            UsoAPUCreate(
                version_apu_id=version.id,
                motivo="Aplicar cemento a Concreto 3000 PSI",
                creado_por_id=self.actor.id,
            ),
            self.db,
        )
        return version, usage

    def test_creates_persistent_material_and_provider(self) -> None:
        self.assertIsNone(self.db.scalar(select(MaterialPrecio.id).limit(1)))
        self.assertIsNotNone(self.db.get(Material, self.material.id))
        self.assertIsNotNone(self.db.get(Proveedor, self.providers[1].id))
        self.assertEqual(self.material.descripcion, "Cemento GU")
        self.assertEqual(self.providers[1].nombre, "Proveedor B")
        self.assertEqual(self.material.unidad, "SACO")

    def test_keeps_three_historical_quotes_and_selects_provider_b(self) -> None:
        self.agregar_cotizacion(self.providers[0].id, "12.00")
        self.agregar_cotizacion(self.providers[1].id, "11.00")
        self.agregar_cotizacion(self.providers[2].id, "13.00")

        history = listar_cotizaciones(self.material.id, None, self.db)
        current = listar_precios_vigentes(
            self.material.id,
            datetime.now(timezone.utc),
            "NIO",
            self.db,
        )

        self.assertEqual(len(history), 3)
        self.assertEqual(len(current), 3)
        self.assertEqual(current[0].proveedor_nombre, "Proveedor B")
        self.assertEqual(current[0].costo_unitario, Decimal("11.0000"))
        self.assertEqual(current[0].moneda, "NIO")
        self.assertEqual(current[0].origen, "cotización de proveedor")

    def test_apu_snapshots_quote_and_new_price_does_not_change_project(self) -> None:
        for provider, price in zip(self.providers, ("12.00", "11.00", "13.00"), strict=True):
            self.agregar_cotizacion(provider.id, price)
        quote_b = self.db.scalar(
            select(MaterialPrecio).where(
                MaterialPrecio.material_id == self.material.id,
                MaterialPrecio.proveedor_id == self.providers[1].id,
            )
        )
        version_response, usage_response = self.crear_apu_con_cotizacion(quote_b.id)
        version = self.db.get(VersionAPU, version_response.id)
        usage = self.db.get(UsoAPU, usage_response.id)

        self.assertEqual(version.costo_unitario, Decimal("11.0000"))
        self.assertEqual(usage.snapshot["proyecto_nombre"], "Tanque Elevado")
        self.assertEqual(usage.snapshot["version_proyecto_numero"], 1)
        self.assertEqual(usage.snapshot["partida_descripcion"], "Concreto 3000 PSI")
        line = usage.snapshot["detalle"][0]
        self.assertEqual(line["snapshot_material"]["material_precio_id"], quote_b.id)
        self.assertEqual(line["snapshot_material"]["proveedor_nombre"], "Proveedor B")
        self.assertEqual(line["snapshot_material"]["precio_unitario"], "11.0000")
        self.assertEqual(line["snapshot_material"]["origen"], "cotización de proveedor")

        self.agregar_cotizacion(self.providers[1].id, "9.50")
        current_after_new_quote = listar_precios_vigentes(
            self.material.id,
            datetime.now(timezone.utc),
            "NIO",
            self.db,
        )
        self.db.refresh(version)
        self.db.refresh(usage)

        self.assertEqual(current_after_new_quote[0].proveedor_nombre, "Proveedor B")
        self.assertEqual(current_after_new_quote[0].costo_unitario, Decimal("9.5000"))
        self.assertEqual(version.costo_unitario, Decimal("11.0000"))
        self.assertEqual(usage.snapshot["detalle"][0]["snapshot_material"]["precio_unitario"], "11.0000")
        self.assertEqual(len(listar_cotizaciones(self.material.id, None, self.db)), 4)

    def test_material_line_rejects_mismatched_provider_quote(self) -> None:
        quote = self.agregar_cotizacion(self.providers[0].id, "12.00")
        master = crear_apu_maestro(
            APUMaestroCreate(
                nombre="APU inválido",
                descripcion="Prueba de integridad",
                unidad="M3",
                creado_por_id=self.actor.id,
                motivo="Prueba",
            ),
            self.db,
        )

        with self.assertRaises(HTTPException) as error:
            crear_version_apu(
                master.id,
                VersionAPUCreate(
                    detalle=[
                        APUCostoDetalle(
                            concepto="Cemento GU",
                            unidad="SACO",
                            cantidad=1,
                            material_id=self.material.id,
                            proveedor_id=self.providers[1].id,
                            material_precio_id=quote.id,
                        )
                    ],
                    motivo="No debe persistir",
                    creado_por_id=self.actor.id,
                ),
                self.db,
            )
        self.assertEqual(error.exception.status_code, 422)

    def test_apu_rejects_mixed_material_quote_currencies(self) -> None:
        quote_nio = self.agregar_cotizacion(self.providers[1].id, "11.00")
        quote_usd = crear_cotizacion(
            self.material.id,
            CotizacionMaterialCreate(
                proveedor_id=self.providers[0].id,
                costo_unitario=Decimal("12.00"),
                moneda="USD",
                unidad_precio="SACO",
                fecha_vigencia=self.fecha_precio,
                creado_por_id=self.actor.id,
                motivo="Prueba de moneda USD",
            ),
            self.db,
        )
        master = crear_apu_maestro(
            APUMaestroCreate(
                nombre="APU moneda mixta",
                descripcion="Prueba de moneda",
                unidad="M3",
                creado_por_id=self.actor.id,
                motivo="Prueba",
            ),
            self.db,
        )

        with self.assertRaises(HTTPException) as error:
            crear_version_apu(
                master.id,
                VersionAPUCreate(
                    detalle=[
                        APUCostoDetalle(
                            concepto="Cemento GU",
                            unidad="SACO",
                            cantidad=1,
                            material_id=self.material.id,
                            proveedor_id=self.providers[1].id,
                            material_precio_id=quote_nio.id,
                        ),
                        APUCostoDetalle(
                            concepto="Cemento GU importado",
                            unidad="SACO",
                            cantidad=1,
                            material_id=self.material.id,
                            proveedor_id=self.providers[0].id,
                            material_precio_id=quote_usd.id,
                        ),
                    ],
                    motivo="No debe mezclar monedas",
                    creado_por_id=self.actor.id,
                ),
                self.db,
            )
        self.assertEqual(error.exception.status_code, 422)

    def test_material_and_apu_actions_are_audited_with_actor_and_reason(self) -> None:
        quote = self.agregar_cotizacion(self.providers[1].id, "11.00")
        self.crear_apu_con_cotizacion(quote.id)

        events = self.db.scalars(
            select(AuditoriaEvento).where(
                AuditoriaEvento.entidad_tipo.in_(
                    {"material", "proveedor", "cotizacion_material", "apu_maestro"}
                )
            )
        ).all()
        material_event = next(event for event in events if event.entidad_tipo == "material")
        quote_event = next(event for event in events if event.entidad_tipo == "cotizacion_material")
        usage_event = next(
            event for event in events if event.entidad_tipo == "apu_maestro" and event.accion == "uso"
        )

        for event in (material_event, quote_event, usage_event):
            self.assertEqual(event.actor_usuario_id, self.actor.id)
            self.assertTrue(event.motivo)
            self.assertIsNotNone(event.creado_en)
        self.assertEqual(quote_event.valores_nuevos["costo_unitario"], "11.0000")
        self.assertEqual(usage_event.proyecto_id, self.project.id)
        self.assertEqual(usage_event.version_proyecto_id, self.project_version.id)
        self.assertIsNotNone(self.db.get(UsoAPU, 1))
        self.assertEqual(self.db.get(VersionAPU, 1).numero, 1)


if __name__ == "__main__":
    unittest.main()
