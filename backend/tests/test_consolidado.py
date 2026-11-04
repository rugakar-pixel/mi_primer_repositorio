import unittest

from app.schemas.consolidado import BudgetSourceLine, ConsolidationRequest
from app.services.consolidado import BudgetConsolidationService
from app.services.materiales_costos import load_demo_project


class BudgetConsolidationServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.service = BudgetConsolidationService()
        self.project = load_demo_project()

    def test_consolidates_labor_material_equipment_and_other_in_nio(self) -> None:
        request = ConsolidationRequest(
            mano_obra=[
                BudgetSourceLine(
                    id="labor-1",
                    categoria="actividad",
                    descripcion="Excavación",
                    unidad_medida="M3",
                    cantidad=2,
                    costo_unitario=100,
                )
            ],
            proyecto_materiales=self.project,
        )

        result = self.service.consolidate(request)
        self.assertEqual(result.resumen.mano_obra, 200)
        self.assertGreater(result.resumen.materiales, 0)
        self.assertGreater(result.resumen.equipos, 0)
        self.assertGreater(result.resumen.otros, 0)
        self.assertAlmostEqual(
            result.resumen.total_general,
            sum(
                (
                    result.resumen.mano_obra,
                    result.resumen.materiales,
                    result.resumen.equipos,
                    result.resumen.subcontratos,
                    result.resumen.otros,
                )
            ),
            places=2,
        )
        self.assertTrue(all(item.costo_unitario >= 0 for item in result.items))
        demo_items = [item for item in result.items if item.origen != "MANO_OBRA"]
        self.assertTrue(all(item.referencias for item in demo_items))

    def test_groups_repeated_lines_without_merging_distinct_origins(self) -> None:
        request = ConsolidationRequest(
            mano_obra=[
                BudgetSourceLine(
                    id="labor-a",
                    categoria="actividad",
                    descripcion="Excavación",
                    unidad_medida="M3",
                    cantidad=1,
                    costo_unitario=100,
                ),
                BudgetSourceLine(
                    id="labor-b",
                    categoria="actividad",
                    descripcion="Excavación",
                    unidad_medida="M3",
                    cantidad=2,
                    costo_unitario=100,
                ),
            ],
            proyecto_materiales=self.project,
            subcontratos=[
                BudgetSourceLine(
                    id="subcontract-a",
                    categoria="subcontrato",
                    descripcion="Excavación",
                    unidad_medida="M3",
                    cantidad=3,
                    costo_unitario=100,
                )
            ],
        )

        result = self.service.consolidate(request)
        labor_items = [item for item in result.items if item.origen == "MANO_OBRA"]
        subcontract_items = [item for item in result.items if item.origen == "SUBCONTRATO"]
        self.assertEqual(len(labor_items), 2)
        self.assertEqual(sum(item.cantidad for item in labor_items), 3)
        self.assertEqual(sum(item.costo_total for item in labor_items), 300)
        self.assertEqual(len(subcontract_items), 1)
        self.assertEqual(result.resumen.subcontratos, 300)

    def test_duplicate_source_ids_do_not_double_count(self) -> None:
        repeated_line = BudgetSourceLine(
            id="labor-duplicate",
            categoria="actividad",
            descripcion="Excavación",
            unidad_medida="M3",
            cantidad=1,
            costo_unitario=100,
        )
        request = ConsolidationRequest(
            mano_obra=[repeated_line, repeated_line],
            proyecto_materiales=self.project,
        )
        result = self.service.consolidate(request)
        self.assertEqual(result.resumen.mano_obra, 100)

    def test_conflicting_source_ids_are_rejected(self) -> None:
        request = ConsolidationRequest(
            mano_obra=[
                BudgetSourceLine(
                    id="labor-conflict",
                    categoria="actividad",
                    descripcion="Excavación",
                    unidad_medida="M3",
                    cantidad=1,
                    costo_unitario=100,
                ),
                BudgetSourceLine(
                    id="labor-conflict",
                    categoria="actividad",
                    descripcion="Relleno",
                    unidad_medida="M3",
                    cantidad=1,
                    costo_unitario=100,
                ),
            ],
            proyecto_materiales=self.project,
        )
        with self.assertRaisesRegex(ValueError, "está repetido con datos diferentes"):
            self.service.consolidate(request)


if __name__ == "__main__":
    unittest.main()
