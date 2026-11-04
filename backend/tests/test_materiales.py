import unittest
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db.base import Base
from app.models.database_models import CategoriaMaterial, Material, MaterialPrecio, Proveedor
from app.services.materiales import (
    obtener_precio_promedio_vigente,
    obtener_precio_vigente_proveedor,
)


class ConsultasPreciosMaterialTest(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine)
        self.ahora = datetime(2026, 11, 4, 12, tzinfo=timezone.utc)

        categoria = CategoriaMaterial(codigo="CEM", nombre="Cemento")
        self.proveedor_1 = Proveedor(nombre="Proveedor 1")
        self.proveedor_2 = Proveedor(nombre="Proveedor 2")
        self.proveedor_inactivo = Proveedor(nombre="Proveedor inactivo", activo=False)
        self.db.add_all([categoria, self.proveedor_1, self.proveedor_2, self.proveedor_inactivo])
        self.db.flush()

        self.material = Material(
            codigo="MAT-1",
            descripcion="Cemento tipo I",
            unidad="SACO",
            categoria_id=categoria.id,
        )
        self.db.add(self.material)
        self.db.commit()

    def tearDown(self) -> None:
        self.db.close()
        self.engine.dispose()

    def agregar_precio(
        self,
        proveedor: Proveedor,
        costo: str,
        dias_atras: int,
        moneda: str = "NIO",
    ) -> None:
        self.db.add(
            MaterialPrecio(
                material_id=self.material.id,
                proveedor_id=proveedor.id,
                costo_unitario=Decimal(costo),
                moneda=moneda,
                unidad_precio=self.material.unidad,
                fecha_vigencia=self.ahora - timedelta(days=dias_atras),
            )
        )
        self.db.commit()

    def test_promedio_usa_precio_mas_reciente_por_proveedor_activo(self) -> None:
        self.agregar_precio(self.proveedor_1, "100", 3)
        self.agregar_precio(self.proveedor_1, "120", 1)
        self.agregar_precio(self.proveedor_2, "140", 2)
        self.agregar_precio(self.proveedor_inactivo, "1", 0)
        self.agregar_precio(self.proveedor_2, "5", 0, moneda="USD")

        promedio = obtener_precio_promedio_vigente(
            self.db,
            self.material.id,
            fecha=self.ahora,
        )

        self.assertEqual(promedio, Decimal("130"))

    def test_consulta_filtra_proveedor_y_fecha_de_vigencia(self) -> None:
        self.agregar_precio(self.proveedor_1, "100", 3)
        self.agregar_precio(self.proveedor_1, "120", 1)

        precio_anterior = obtener_precio_vigente_proveedor(
            self.db,
            self.material.id,
            self.proveedor_1.id,
            fecha=self.ahora - timedelta(days=2),
        )
        precio_actual = obtener_precio_vigente_proveedor(
            self.db,
            self.material.id,
            self.proveedor_1.id,
            fecha=self.ahora,
        )

        self.assertIsNotNone(precio_anterior)
        self.assertEqual(precio_anterior.costo_unitario, Decimal("100.0000"))
        self.assertIsNotNone(precio_actual)
        self.assertEqual(precio_actual.costo_unitario, Decimal("120.0000"))

    def test_promedio_sin_cotizaciones_es_none(self) -> None:
        self.assertIsNone(
            obtener_precio_promedio_vigente(
                self.db,
                self.material.id,
                fecha=self.ahora,
            )
        )


if __name__ == "__main__":
    unittest.main()
