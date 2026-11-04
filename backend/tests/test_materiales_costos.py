import unittest

from app.services.materiales_costos import (
    calculate_project,
    compute_dimensional_area,
    compute_dimensional_volume,
    load_demo_project,
    quote_rental,
)
from app.schemas.materiales_costos import Project, RentalQuote


class CalculatorTests(unittest.TestCase):
    def test_demo_project_contains_no_labor_components(self) -> None:
        project = load_demo_project()

        self.assertEqual(len(project.actividades), 9)
        self.assertEqual(sum(len(activity.apu.materiales) for activity in project.actividades), 37)
        self.assertEqual(sum(len(activity.apu.equipos) for activity in project.actividades), 7)
        self.assertEqual(sum(len(activity.apu.herramientas) for activity in project.actividades), 3)
        self.assertTrue(all(not hasattr(activity.apu, "mano_obra") for activity in project.actividades))

    def test_project_totals_use_only_supplied_costs(self) -> None:
        project = Project.model_validate(
            {
                "meta": {
                    "nombre": "Prueba",
                    "moneda": "USD",
                    "tasaCambioNIO": 36.8,
                    "aiu": {
                        "administracionPct": 10,
                        "imprevistosPct": 5,
                        "utilidadPct": 5,
                        "ivaUtilidadPct": 15,
                    },
                },
                "actividades": [
                    {
                        "id": "A1",
                        "item": 1,
                        "codigo": "MAT-01",
                        "descripcion": "Actividad de prueba",
                        "unidad": "M2",
                        "cantidad": 2,
                        "apu": {
                            "materiales": [
                                {
                                    "nombre": "Cemento",
                                    "unidad": "BLT",
                                    "cantidad": 1,
                                    "precioUnitario": 10,
                                }
                            ],
                            "equipos": [
                                {
                                    "nombre": "Mezcladora",
                                    "unidad": "HORA",
                                    "cantidad": 2,
                                    "precioUnitario": 5,
                                }
                            ],
                            "herramientas": [],
                        },
                        "otrosCostos": [
                            {
                                "concepto": "Flete",
                                "categoria": "transporte",
                                "unidad": "VIAJE",
                                "cantidad": 1,
                                "precioUnitario": 6,
                            }
                        ],
                    }
                ],
            }
        )

        result = calculate_project(project)

        self.assertEqual(result["costo_materiales"], 20.0)
        self.assertEqual(result["costo_equipos"], 20.0)
        self.assertEqual(result["costo_transporte"], 12.0)
        self.assertEqual(result["costo_directo"], 52.0)
        self.assertEqual(result["administracion"], 5.2)
        self.assertEqual(result["imprevistos"], 2.6)
        self.assertEqual(result["utilidad"], 2.6)
        self.assertEqual(result["iva_utilidad"], 0.39)
        self.assertEqual(result["gran_total"], 62.79)
        self.assertEqual(result["materiales_consolidados"][0]["cantidad_total"], 2.0)

    def test_dimension_calculations(self) -> None:
        self.assertEqual(compute_dimensional_area(12, 0.6), 7.2)
        self.assertEqual(compute_dimensional_volume(12, 0.6, 0.15), 1.08)
        self.assertEqual(compute_dimensional_area(None, 0.6), 0.0)

    def test_rental_quote_uses_explicit_rate_period(self) -> None:
        project = Project.model_validate(
            {
                "meta": {"nombre": "Prueba"},
                "actividades": [],
                "tarifasEquipos": [
                    {
                        "id": "EQ-1",
                        "equipo": "Generador",
                        "categoria": "Generación",
                        "costoDiarioMinUSD": 8,
                        "costoDiarioMaxUSD": 12,
                        "costoDiarioPromedioUSD": 10,
                        "costoSemanalMinUSD": 40,
                        "costoSemanalMaxUSD": 60,
                        "costoSemanalPromedioUSD": 50,
                        "costoMensualMinUSD": 100,
                        "costoMensualMaxUSD": 140,
                        "costoMensualPromedioUSD": 120,
                        "unidadMedidaTarifa": "Día",
                        "observaciones": "",
                    }
                ],
            }
        )
        quote = RentalQuote.model_validate(
            {
                "equipoId": "EQ-1",
                "modalidad": "dia",
                "periodos": 3,
                "unidades": 2,
                "tasaCambioNio": 36.8,
            }
        )

        self.assertEqual(quote_rental(project, quote)["total_usd"], 60.0)
        self.assertEqual(quote_rental(project, quote)["total_nio"], 2208.0)

    def test_unknown_project_fields_are_rejected(self) -> None:
        with self.assertRaises(ValueError):
            Project.model_validate(
                {"meta": {"nombre": "Prueba"}, "actividades": [], "costoOculto": 5}
            )


if __name__ == "__main__":
    unittest.main()
