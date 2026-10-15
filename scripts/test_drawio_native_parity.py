#!/usr/bin/env python3
"""Unit tests for the native draw.io parity verifier."""

from __future__ import annotations

import unittest
import copy
import json
import xml.etree.ElementTree as ET

try:
    import verify_drawio_native_parity as parity_verifier

    _task_owned_path = parity_verifier._task_owned_path
    expected_active_pages = parity_verifier.expected_active_pages
    expected_primary_pages = getattr(parity_verifier, "expected_primary_pages", None)
    semantic_inventory = parity_verifier.semantic_inventory
except ImportError:
    _task_owned_path = None
    expected_active_pages = None
    expected_primary_pages = None
    semantic_inventory = None

try:
    from validate_drawio import OMITTED_PRIMARY_DRAWIO_IDS, expand_source, validate_document
except ImportError:
    OMITTED_PRIMARY_DRAWIO_IDS = None
    expand_source = None
    validate_document = None

try:
    from build_drawio import OUTPUT_FILE as hybrid_output_file, expand_puml_source as expand_hybrid_source
except ImportError:
    hybrid_output_file = None
    expand_hybrid_source = None

try:
    from build_drawio_from_svgs import DEFAULT_OUTPUT_FILE as svg_output_file
except ImportError:
    svg_output_file = None

try:
    from layout_drawio_native import LayoutMappingError, apply_state_label_layout, transfer_page_geometry
except ImportError:
    LayoutMappingError = None
    apply_state_label_layout = None
    transfer_page_geometry = None


class SemanticInventoryTests(unittest.TestCase):
    def test_filters_layout_lines_but_preserves_semantic_order(self) -> None:
        self.assertIsNotNone(semantic_inventory, "semantic normalizer should be available")
        source = """@startuml
' diagram metadata
!include ../style.puml
skinparam shadowing false
left to right direction
A -[hidden]-> B
A --> B : approved
if (ready?) then (yes)
Entity ||--o{ Record
@enduml
"""
        assert semantic_inventory is not None
        self.assertEqual(
            ["A --> B : approved", "if (ready?) then (yes)", "Entity ||--o{ Record"],
            semantic_inventory(source),
        )

    def test_native_review_assets_are_within_task_scope(self) -> None:
        self.assertIsNotNone(_task_owned_path, "baseline verifier should expose its scope classifier")
        assert _task_owned_path is not None
        self.assertTrue(
            _task_owned_path("docs/modeling/current-target/evidence/native-render-review/native-UC-01.png")
        )
        self.assertTrue(_task_owned_path("docs/modeling/current-target/evidence/native-export-test.svg"))
        self.assertTrue(_task_owned_path("scripts/layout_drawio_native.py"))
        self.assertTrue(_task_owned_path("plans/approved/2026-10-11-drawio-native-cell-layout-APPROVED.md"))

    def test_keeps_labels_and_relationship_directions(self) -> None:
        self.assertIsNotNone(semantic_inventory, "semantic normalizer should be available")
        source = """@startuml
Learner --> Lesson : completes
Lesson ||--o{ Exercise : contains
@enduml
"""
        assert semantic_inventory is not None
        self.assertEqual(
            [
                "Learner --> Lesson : completes",
                "Lesson ||--o{ Exercise : contains",
            ],
            semantic_inventory(source),
        )


def native_page_document(source: str, *, source_payload: str | None = None, native: bool = True) -> ET.Element:
    root = ET.Element("mxfile")
    page = ET.SubElement(root, "diagram", {"id": "page-UC-01", "name": "01 - Use Case - Sample (UC-01)"})
    model = ET.SubElement(page, "mxGraphModel")
    model_root = ET.SubElement(model, "root")
    ET.SubElement(model_root, "mxCell", {"id": "0"})
    ET.SubElement(model_root, "mxCell", {"id": "1", "parent": "0"})
    if native:
        cell = ET.SubElement(model_root, "mxCell", {"id": "native", "value": "Actor", "vertex": "1", "parent": "1"})
        ET.SubElement(cell, "mxGeometry", {"width": "80", "height": "30", "as": "geometry"})
    if source_payload is not None:
        user = ET.SubElement(model_root, "UserObject", {"id": "source", "plantUmlData": json.dumps({"data": source_payload, "config": None})})
        ET.SubElement(user, "mxCell", {"id": "edit", "vertex": "1", "parent": "1"})
    return root


class NativeDrawioValidatorTests(unittest.TestCase):
    def test_expands_report_view_shared_style_include(self) -> None:
        self.assertIsNotNone(expand_source, "native validator source expander should be available")
        assert expand_source is not None
        from pathlib import Path

        report_dir = Path(__file__).resolve().parent.parent / "docs" / "modeling" / "report-usecases"
        report_source = report_dir / "VIEW-RUC-01-auth-profile.puml"
        expanded = expand_source(report_source, report_dir)
        self.assertNotIn("!include", expanded)
        self.assertIn("skinparam", expanded)

    def test_accepts_native_page_with_exact_standalone_source(self) -> None:
        self.assertIsNotNone(validate_document, "native draw.io validator should be available")
        source = "@startuml\nAlice --> Bob\n@enduml\n"
        assert validate_document is not None
        self.assertEqual([], validate_document(native_page_document(source, source_payload=source), {"UC-01": source}))

    def test_rejects_svg_only_page(self) -> None:
        self.assertIsNotNone(validate_document, "native draw.io validator should be available")
        source = "@startuml\nAlice --> Bob\n@enduml\n"
        assert validate_document is not None
        errors = validate_document(native_page_document(source, source_payload=source, native=False), {"UC-01": source})
        self.assertTrue(any("native" in error.lower() for error in errors), errors)

    def test_rejects_page_with_stale_source_payload(self) -> None:
        self.assertIsNotNone(validate_document, "native draw.io validator should be available")
        source = "@startuml\nAlice --> Bob\n@enduml\n"
        stale = "@startuml\nAlice --> Mallory\n@enduml\n"
        assert validate_document is not None
        errors = validate_document(native_page_document(source, source_payload=stale), {"UC-01": source})
        self.assertTrue(any("source" in error.lower() for error in errors), errors)

    def test_rejects_page_without_edit_payload(self) -> None:
        self.assertIsNotNone(validate_document, "native draw.io validator should be available")
        source = "@startuml\nAlice --> Bob\n@enduml\n"
        assert validate_document is not None
        errors = validate_document(native_page_document(source, native=True), {"UC-01": source})
        self.assertTrue(any("payload" in error.lower() for error in errors), errors)

    def test_rejects_missing_page(self) -> None:
        self.assertIsNotNone(validate_document, "native draw.io validator should be available")
        assert validate_document is not None
        errors = validate_document(ET.Element("mxfile"), {"UC-01": "@startuml\n@enduml\n"})
        self.assertTrue(any("Page count" in error for error in errors), errors)

    def test_rejects_duplicate_page_identity(self) -> None:
        self.assertIsNotNone(validate_document, "native draw.io validator should be available")
        source = "@startuml\nAlice --> Bob\n@enduml\n"
        assert validate_document is not None
        root = native_page_document(source, source_payload=source)
        root.append(copy.deepcopy(root.find("diagram")))
        errors = validate_document(root, {"UC-01": source})
        self.assertTrue(any("Duplicate draw.io page IDs" in error for error in errors), errors)
        self.assertTrue(any("Duplicate draw.io page names" in error for error in errors), errors)

    def test_accepts_exact_act05_omission_from_the_active_deliverable(self) -> None:
        self.assertIsNotNone(validate_document, "native draw.io validator should be available")
        self.assertEqual({"ACT-05"}, OMITTED_PRIMARY_DRAWIO_IDS)
        source = "@startuml\nActor --> UseCase\n@enduml\n"
        sources = {diagram_id: source for diagram_id in ("ACT-04", "ACT-05", "ACT-06")}
        root = ET.Element("mxfile")
        for index, diagram_id in enumerate(("ACT-04", "ACT-06"), start=1):
            page = ET.SubElement(root, "diagram", {"id": f"page-{diagram_id}", "name": f"{index:02} - Sample ({diagram_id})"})
            model = ET.SubElement(page, "mxGraphModel")
            model_root = ET.SubElement(model, "root")
            ET.SubElement(model_root, "mxCell", {"id": "0"})
            ET.SubElement(model_root, "mxCell", {"id": "1", "parent": "0"})
            cell = ET.SubElement(model_root, "mxCell", {"id": f"native-{diagram_id}", "vertex": "1", "parent": "1"})
            ET.SubElement(cell, "mxGeometry", {"width": "80", "height": "30", "as": "geometry"})
            user = ET.SubElement(model_root, "UserObject", {"id": f"source-{diagram_id}", "plantUmlData": json.dumps({"data": source, "config": None})})
            ET.SubElement(user, "mxCell", {"id": f"edit-{diagram_id}", "vertex": "1", "parent": "1"})
        assert validate_document is not None
        self.assertEqual([], validate_document(root, sources))

    def test_rejects_act05_if_it_is_still_in_the_active_deliverable(self) -> None:
        self.assertIsNotNone(validate_document, "native draw.io validator should be available")
        source = "@startuml\nActor --> UseCase\n@enduml\n"
        root = native_page_document(source, source_payload=source)
        page = root.find("diagram")
        assert page is not None
        page.set("id", "page-ACT-05")
        page.set("name", "01 - Reassessment (ACT-05)")
        assert validate_document is not None
        errors = validate_document(root, {"ACT-05": source, "ACT-06": source})
        self.assertTrue(any("excluded from the active deliverable" in error for error in errors), errors)

    def test_still_rejects_missing_active_page_other_than_act05(self) -> None:
        self.assertIsNotNone(validate_document, "native draw.io validator should be available")
        source = "@startuml\nActor --> UseCase\n@enduml\n"
        root = native_page_document(source, source_payload=source)
        page = root.find("diagram")
        assert page is not None
        page.set("id", "page-ACT-04")
        page.set("name", "01 - Sample (ACT-04)")
        assert validate_document is not None
        errors = validate_document(root, {"ACT-04": source, "ACT-05": source, "ACT-06": source})
        self.assertTrue(any("Page count" in error for error in errors), errors)


class DeferredPageBaselineTests(unittest.TestCase):
    def test_expected_baseline_pages_omit_act05_and_renumber_the_remaining_set(self) -> None:
        self.assertIsNotNone(expected_active_pages, "baseline verifier should expose active page derivation")
        pages = [
            {"id": "page-ACT-04", "name": "12 - Level-up (ACT-04)"},
            {"id": "page-ACT-05", "name": "13 - Reassessment (ACT-05)"},
            {"id": "page-ACT-06", "name": "14 - SRS (ACT-06)"},
        ]
        assert expected_active_pages is not None
        self.assertEqual(
            [
                {"id": "page-ACT-04", "name": "01 - Level-up (ACT-04)"},
                {"id": "page-ACT-06", "name": "02 - SRS (ACT-06)"},
            ],
            expected_active_pages(pages),
        )

    def test_expected_primary_pages_insert_all_report_views_after_admin(self) -> None:
        self.assertIsNotNone(expected_primary_pages, "baseline verifier should expose report-view page derivation")
        pages = [{"id": f"page-SYS-{index:02}", "name": f"{index:02} - System ({'SYS-' + format(index, '02')})"} for index in range(1, 5)]
        pages.extend({"id": f"page-UC-{index:02}", "name": f"{index + 4:02} - Use Case ({'UC-' + format(index, '02')})"} for index in range(1, 5))
        pages.append({"id": "page-ACT-01", "name": "09 - Activity - Onboarding (ACT-01)"})
        assert expected_primary_pages is not None
        result = expected_primary_pages(pages)
        self.assertEqual(18, len(result))
        self.assertEqual("page-UC-04", result[7]["id"])
        self.assertEqual("page-VIEW-RUC-01", result[8]["id"])
        self.assertEqual("09 - Use Case - Đăng ký, đăng nhập và hồ sơ (VIEW-RUC-01)", result[8]["name"])
        self.assertEqual("page-VIEW-RUC-08B", result[16]["id"])
        self.assertEqual("page-ACT-01", result[17]["id"])
        self.assertEqual("18 - Activity - Onboarding (ACT-01)", result[17]["name"])


class BuilderOutputPathTests(unittest.TestCase):
    def test_svg_backed_builders_cannot_overwrite_native_deliverable_by_default(self) -> None:
        self.assertIsNotNone(hybrid_output_file, "SVG-editable builder output must be declared")
        self.assertIsNotNone(svg_output_file, "SVG-only builder output must be declared")
        assert hybrid_output_file is not None and svg_output_file is not None
        names = {hybrid_output_file.name, svg_output_file.name}
        self.assertEqual(
            {"lingora-all-diagrams-svg-editable.drawio", "lingora-all-diagrams-svg.drawio"},
            names,
        )
        self.assertNotIn("lingora-all-diagrams.drawio", names)


class SvgEditableSourceTests(unittest.TestCase):
    def test_expands_only_the_shared_style_include_into_a_standalone_source(self) -> None:
        self.assertIsNotNone(expand_hybrid_source, "SVG-editable builder should expose its source expander")
        assert expand_hybrid_source is not None
        import tempfile
        from pathlib import Path

        with tempfile.TemporaryDirectory() as temp_dir:
            target = Path(temp_dir) / "current-target"
            source_dir = target / "src"
            source_dir.mkdir(parents=True)
            source = source_dir / "UC-01-sample.puml"
            source.write_text("@startuml\n!include ../style.puml\nAlice --> Bob\n@enduml\n", encoding="utf-8")
            (target / "style.puml").write_text(
                "@startuml\nskinparam shadowing false\n@enduml\n", encoding="utf-8"
            )

            self.assertEqual(
                "@startuml\nskinparam shadowing false\nAlice --> Bob\n@enduml\n",
                expand_hybrid_source(source),
            )

    def test_rejects_unknown_includes_from_svg_editable_payload(self) -> None:
        self.assertIsNotNone(expand_hybrid_source, "SVG-editable builder should expose its source expander")
        assert expand_hybrid_source is not None
        import tempfile
        from pathlib import Path

        with tempfile.TemporaryDirectory() as temp_dir:
            source_dir = Path(temp_dir) / "current-target" / "src"
            source_dir.mkdir(parents=True)
            source = source_dir / "UC-01-sample.puml"
            source.write_text("@startuml\n!include ../outside.puml\n@enduml\n", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "UC-01-sample.puml.*outside.puml"):
                expand_hybrid_source(source)


def layout_fixture() -> tuple[ET.Element, ET.Element]:
    page = ET.fromstring('''
      <diagram id="page-TEST" name="01 - Test - Layout (TEST)">
        <mxGraphModel pageWidth="400" pageHeight="300"><root>
          <mxCell id="0"/><mxCell id="1" parent="0"/>
          <UserObject id="group" label="Group" plantUmlBaseValue="Group">
            <mxCell id="group" style="shape=folder;" vertex="1" parent="1">
              <mxGeometry x="10" y="20" width="100" height="80" as="geometry"/>
            </mxCell>
          </UserObject>
          <UserObject id="alpha" label="Alpha" plantUmlBaseValue="Alpha">
            <mxCell id="alpha" style="ellipse;" vertex="1" parent="group">
              <mxGeometry x="5" y="5" width="30" height="20" as="geometry"/>
            </mxCell>
          </UserObject>
          <UserObject id="beta" label="Beta" plantUmlBaseValue="Beta">
            <mxCell id="beta" style="ellipse;" vertex="1" parent="1">
              <mxGeometry x="250" y="120" width="30" height="20" as="geometry"/>
            </mxCell>
          </UserObject>
          <UserObject id="link" label="" plantUmlBaseValue="">
            <mxCell id="link" edge="1" source="alpha" target="beta" parent="1">
              <mxGeometry relative="1" as="geometry"/>
            </mxCell>
          </UserObject>
          <UserObject id="source" plantUmlData="{&quot;data&quot;:&quot;@startuml\\nAlpha -- Beta\\n@enduml\\n&quot;,&quot;config&quot;:null}">
            <mxCell id="edit" vertex="1" parent="1"/>
          </UserObject>
        </root></mxGraphModel>
      </diagram>''')
    svg = ET.fromstring('''
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
        <g class="cluster"><polygon points="100,50 300,50 300,250 100,250"/><text x="110" y="70">Group</text></g>
        <g class="entity" id="svg-alpha"><ellipse cx="180" cy="130" rx="30" ry="20"/><text x="150" y="135" textLength="60">Alpha</text></g>
        <g class="entity" id="svg-beta"><rect x="320" y="170" width="60" height="30"/><text x="330" y="190" textLength="40">Beta</text></g>
        <g class="link" data-entity-1="svg-alpha" data-entity-2="svg-beta"><path d="M190,130 L240,150 L300,180 L350,185"/></g>
      </svg>''')
    return page, svg


class NativeLayoutTransferTests(unittest.TestCase):
    def test_routes_actor_associations_using_the_svg_actor_identity(self) -> None:
        self.assertIsNotNone(transfer_page_geometry, "native geometry transfer should be available")
        assert transfer_page_geometry is not None
        page = ET.fromstring('''
          <diagram id="page-UC-01"><mxGraphModel pageWidth="400" pageHeight="300"><root>
            <mxCell id="0"/><mxCell id="1" parent="0"/>
            <UserObject id="actor_1" label="" plantUmlBaseValue="">
              <mxCell id="actor_1" style="shape=umlActor;" vertex="1" parent="1">
                <mxGeometry x="10" y="100" width="30" height="50" as="geometry"/>
              </mxCell>
            </UserObject>
            <UserObject id="actorlbl_2" label="Actor" plantUmlBaseValue="Actor">
              <mxCell id="actorlbl_2" style="text;" vertex="1" parent="1">
                <mxGeometry x="0" y="150" width="60" height="20" as="geometry"/>
              </mxCell>
            </UserObject>
            <UserObject id="case" label="Case" plantUmlBaseValue="Case">
              <mxCell id="case" style="ellipse;" vertex="1" parent="1">
                <mxGeometry x="250" y="100" width="80" height="40" as="geometry"/>
              </mxCell>
            </UserObject>
            <UserObject id="actor-link" label="" plantUmlBaseValue="">
              <mxCell id="actor-link" edge="1" source="actor_1" target="case" parent="1">
                <mxGeometry relative="1" as="geometry"/>
              </mxCell>
            </UserObject>
          </root></mxGraphModel></diagram>''')
        svg = ET.fromstring('''
          <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
            <g class="entity" id="svg-actor"><path d="M50,120 C100,70 150,70 200,120"/><text x="30" y="160">Actor</text></g>
            <g class="entity" id="svg-case"><ellipse cx="280" cy="120" rx="40" ry="20"/><text x="265" y="125">Case</text></g>
            <g class="link" data-entity-1="svg-actor" data-entity-2="svg-case"><path d="M50,120 C100,70 150,70 240,120"/></g>
          </svg>''')

        result = transfer_page_geometry(page, svg)
        points = page.find(".//UserObject[@id='actor-link']/mxCell/mxGeometry/Array[@as='points']")
        self.assertEqual(1, result.routed_edges)
        self.assertIsNotNone(points, "actor edge should inherit the SVG reference route")
        assert points is not None
        self.assertGreater(len(points.findall("mxPoint")), 0, "curved reference path should retain native waypoints")

    def test_places_state_transition_labels_beside_native_states(self) -> None:
        self.assertIsNotNone(apply_state_label_layout, "native state label layout should be available")
        assert apply_state_label_layout is not None
        page = ET.fromstring('''
          <diagram id="page-STA-02"><mxGraphModel pageWidth="453" pageHeight="191"><root>
            <mxCell id="0"/><mxCell id="1" parent="0"/>
            <UserObject id="t_4" label="Change owner" plantUmlBaseValue="Change owner">
              <mxCell id="t_4" edge="1" source="s_0" target="s_0" parent="1">
                <mxGeometry relative="1" as="geometry"/>
              </mxCell>
            </UserObject>
            <UserObject id="title_0" label="State title" plantUmlBaseValue="State title">
              <mxCell id="title_0" vertex="1" parent="1">
                <mxGeometry x="-8.5" y="-4" width="378" height="24" as="geometry"/>
              </mxCell>
            </UserObject>
          </root></mxGraphModel></diagram>''')

        apply_state_label_layout(page, "STA-02")
        edge_geometry = page.find(".//UserObject[@id='t_4']/mxCell/mxGeometry")
        title_geometry = page.find(".//UserObject[@id='title_0']/mxCell/mxGeometry")
        offset = edge_geometry.find("mxPoint[@as='offset']")
        self.assertEqual(("115", "0"), (offset.get("x"), offset.get("y")))
        self.assertEqual(("34", "500"), (title_geometry.get("x"), title_geometry.get("width")))
        before = ET.tostring(page)
        apply_state_label_layout(page, "STA-02")
        self.assertEqual(before, ET.tostring(page), "state label layout should be idempotent")

    def test_spreads_state_revision_branch_labels_without_changing_edges(self) -> None:
        self.assertIsNotNone(apply_state_label_layout, "native state label layout should be available")
        assert apply_state_label_layout is not None
        page = ET.Element("diagram", {"id": "page-STA-03"})
        root = ET.SubElement(ET.SubElement(page, "mxGraphModel"), "root")
        title = ET.SubElement(root, "UserObject", {"id": "title_0", "label": "State title"})
        title_cell = ET.SubElement(title, "mxCell", {"id": "title_0", "vertex": "1"})
        ET.SubElement(title_cell, "mxGeometry", {"x": "33.75", "y": "-4", "width": "282", "height": "24", "as": "geometry"})
        for cell_id, source, target, label in [
            ("t_11", "s_1", "s_2", "Request edits"),
            ("t_12", "s_2", "s_1", "Resubmitted"),
            ("t_13", "s_1", "s_3", "Approved"),
            ("t_15", "s_4", "s_4", "Immutable revision"),
        ]:
            user = ET.SubElement(root, "UserObject", {"id": cell_id, "label": label})
            cell = ET.SubElement(user, "mxCell", {"id": cell_id, "edge": "1", "source": source, "target": target})
            ET.SubElement(cell, "mxGeometry", {"relative": "1", "as": "geometry"})

        apply_state_label_layout(page, "STA-03")
        expected = {
            "t_11": ("0", "107"),
            "t_12": ("200", "-28"),
            "t_13": ("120", "0"),
            "t_15": ("150", "0"),
        }
        for cell_id, dx in expected.items():
            cell = page.find(f".//UserObject[@id='{cell_id}']/mxCell")
            offset = cell.find("mxGeometry/mxPoint[@as='offset']")
            self.assertEqual(dx, (offset.get("x"), offset.get("y")), cell_id)
            self.assertEqual("1", cell.get("edge"), cell_id)
        route = page.find(".//UserObject[@id='t_11']/mxCell/mxGeometry/Array[@as='points']")
        self.assertEqual(
            [("8", "296"), ("8", "346")],
            [(point.get("x"), point.get("y")) for point in route.findall("mxPoint")],
        )
        self.assertEqual(("s_1", "s_2"), tuple(page.find(".//UserObject[@id='t_11']/mxCell").get(k) for k in ("source", "target")))
        title_geometry = page.find(".//UserObject[@id='title_0']/mxCell/mxGeometry")
        self.assertEqual(("50", "400"), (title_geometry.get("x"), title_geometry.get("width")))

    def test_transfers_reference_geometry_to_existing_native_cells(self) -> None:
        self.assertIsNotNone(transfer_page_geometry, "native geometry transfer should be available")
        assert transfer_page_geometry is not None
        page, svg = layout_fixture()
        result = transfer_page_geometry(page, svg)
        cells = {c.get("id"): c for c in page.iter("mxCell")}
        group_geo = cells["group"].find("mxGeometry")
        alpha_geo = cells["alpha"].find("mxGeometry")
        beta_geo = cells["beta"].find("mxGeometry")
        self.assertEqual(("140", "90", "200", "200"), tuple(group_geo.get(k) for k in ("x", "y", "width", "height")))
        self.assertEqual(("50", "60", "60", "40"), tuple(alpha_geo.get(k) for k in ("x", "y", "width", "height")))
        self.assertEqual(("360", "210", "60", "30"), tuple(beta_geo.get(k) for k in ("x", "y", "width", "height")))
        link = cells["link"]
        self.assertEqual(("alpha", "beta"), (link.get("source"), link.get("target")))
        self.assertEqual("@startuml\nAlpha -- Beta\n@enduml\n", json.loads(page.find(".//UserObject[@id='source']").get("plantUmlData"))["data"])
        self.assertEqual(3, result.moved_cells)
        self.assertEqual(1, result.routed_edges)
        self.assertEqual([], result.ambiguous)

    def test_positions_native_swimlanes_on_reference_boundaries(self) -> None:
        self.assertIsNotNone(transfer_page_geometry, "native geometry transfer should be available")
        assert transfer_page_geometry is not None
        page = ET.fromstring('''
          <diagram id="page-LANE"><mxGraphModel pageWidth="400" pageHeight="300"><root>
            <mxCell id="0"/><mxCell id="1" parent="0"/>
            <UserObject id="lane-a" label="Learner" plantUmlBaseValue="Learner">
              <mxCell style="swimlane;startSize=30;" vertex="1" parent="1">
                <mxGeometry x="30" y="-500" width="120" height="900" as="geometry"/>
              </mxCell>
            </UserObject>
            <UserObject id="lane-b" label="System" plantUmlBaseValue="System">
              <mxCell style="swimlane;startSize=30;" vertex="1" parent="1">
                <mxGeometry x="150" y="-500" width="200" height="900" as="geometry"/>
              </mxCell>
            </UserObject>
          </root></mxGraphModel></diagram>''')
        svg = ET.fromstring('''
          <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
            <line x1="20" y1="40" x2="20" y2="280"/>
            <line x1="160" y1="40" x2="160" y2="280"/>
            <line x1="380" y1="40" x2="380" y2="280"/>
            <text x="70" y="60">Learner</text><text x="220" y="60">System</text>
          </svg>''')
        transfer_page_geometry(page, svg)
        cells = {u.get("id"): u.find("mxCell") for u in page.findall(".//UserObject")}
        learner = cells["lane-a"].find("mxGeometry")
        system = cells["lane-b"].find("mxGeometry")
        self.assertEqual(("60", "80", "140", "240"), tuple(learner.get(k) for k in ("x", "y", "width", "height")))
        self.assertEqual(("200", "80", "220", "240"), tuple(system.get(k) for k in ("x", "y", "width", "height")))

    def test_translates_edge_waypoints_with_moved_endpoint_cells(self) -> None:
        self.assertIsNotNone(transfer_page_geometry, "native geometry transfer should be available")
        assert transfer_page_geometry is not None
        page, svg = layout_fixture()
        edge_geometry = page.find(".//UserObject[@id='link']/mxCell/mxGeometry")
        ET.SubElement(edge_geometry, "mxPoint", {"x": "30", "y": "35", "as": "sourcePoint"})
        ET.SubElement(edge_geometry, "mxPoint", {"x": "265", "y": "130", "as": "targetPoint"})
        points = ET.SubElement(edge_geometry, "Array", {"as": "points"})
        ET.SubElement(points, "mxPoint", {"x": "150", "y": "80"})
        transfer_page_geometry(page, svg)
        self.assertEqual(("220", "170"), tuple(edge_geometry.find("mxPoint[@as='sourcePoint']").get(k) for k in ("x", "y")))
        self.assertEqual(("390", "225"), tuple(edge_geometry.find("mxPoint[@as='targetPoint']").get(k) for k in ("x", "y")))
        route_point = points.find("mxPoint")
        self.assertAlmostEqual(307.15, float(route_point.get("x")), places=1)
        self.assertAlmostEqual(194.8, float(route_point.get("y")), places=1)

    def test_transfers_reference_link_route_for_mapped_entity_endpoints(self) -> None:
        self.assertIsNotNone(transfer_page_geometry, "native geometry transfer should be available")
        assert transfer_page_geometry is not None
        page, svg = layout_fixture()
        transfer_page_geometry(page, svg)
        edge_geometry = page.find(".//UserObject[@id='link']/mxCell/mxGeometry")
        points = edge_geometry.find("Array[@as='points']")
        self.assertEqual(
            [("280", "190"), ("340", "220")],
            [(point.get("x"), point.get("y")) for point in points.findall("mxPoint")],
        )

    def test_preserves_native_routes_for_activity_sequence_and_state_references(self) -> None:
        self.assertIsNotNone(transfer_page_geometry, "native geometry transfer should be available")
        assert transfer_page_geometry is not None
        for diagram_type in ("ACTIVITY", "SEQUENCE", "STATE"):
            with self.subTest(diagram_type=diagram_type):
                page, svg = layout_fixture()
                svg.set("data-diagram-type", diagram_type)
                before = ET.tostring(page)
                result = transfer_page_geometry(page, svg)
                self.assertTrue(result.preserved_native_layout)
                self.assertEqual(before, ET.tostring(page))

    def test_rejects_ambiguous_label_match_without_moving_cells(self) -> None:
        self.assertIsNotNone(LayoutMappingError, "native geometry transfer should report mapping failures")
        self.assertIsNotNone(transfer_page_geometry, "native geometry transfer should be available")
        assert LayoutMappingError is not None and transfer_page_geometry is not None
        page, svg = layout_fixture()
        entity = ET.SubElement(svg, "{http://www.w3.org/2000/svg}g", {"class": "entity"})
        ET.SubElement(entity, "{http://www.w3.org/2000/svg}ellipse", {"cx": "180", "cy": "130", "rx": "30", "ry": "20"})
        text = ET.SubElement(entity, "{http://www.w3.org/2000/svg}text", {"x": "150", "y": "135", "textLength": "60"})
        text.text = "Alpha"
        before = tuple(page.find(".//UserObject[@id='alpha']/mxCell/mxGeometry").get(k) for k in ("x", "y", "width", "height"))
        with self.assertRaises(LayoutMappingError):
            transfer_page_geometry(page, svg)
        after = tuple(page.find(".//UserObject[@id='alpha']/mxCell/mxGeometry").get(k) for k in ("x", "y", "width", "height"))
        self.assertEqual(before, after)

if __name__ == "__main__":
    unittest.main(verbosity=2)
