# Scoped editable native draft — 2026-10-20

Mechanical draft only; independent review and primary merge belong to Coordinator. Canonical sources and primary bundle were not edited by this drafting helper.

Environment: Windows, Node v24.14.0, Python 3.11, bundled Draw.io 32.4.1. All exports invoke subprocess with CREATE_NO_WINDOW.

## Commands and observed outcomes

1. `node .../native/convert.js`: six current exact sources converted with exported `loadDrawioPlantUmlEngine` / `convertPumlToXml` helpers; main/full builder never invoked. First local relative-root attempt failed before conversion; corrected root resolves workspace, final six conversions succeeded.
2. `py -3.11 .../native/draft.py`: scoped replacement of six pages only; DATA geometry transferred through existing SVG helper. Initial state mapping failed because historic helper expected old transition IDs. State bypassed historical offsets and received explicit custom layout below.
3. `fix_layout.py`, `fix_data.py`, `fix_state.py`, `fix_rows.py`: staged native mechanical self-fixes. Two state panels, all 17 original source/target transitions retained; exact transition labels moved to individual editable native text cells. DATA widened to prevent field clipping; each field positioned in original native source order. This explicitly corrects duplicate `creatorRef; creationEpisodeRef` SVG text mapping, which initially placed Revision creator outside its parent.
4. `restore_pages.py`: splice only six final native fragments into original raw primary bytes. This preserves CRLF in untouched pages, which Python text reads otherwise normalize. Final validation checks exact fragment equality, not XML equivalence.
5. `export.py`: twelve exact-page Draw.io exports, page indices 24/28/32/35/36/40 (CLI one-based); observed exit 0 for each. See export-results.json for full command/stdout/stderr.
6. `verify.py`: standalone source payload/native structure validator, actual 44-page count, 38 exact preserved fragments, all labels/connector terminals preserved, DATA child fields within parent bounds. Observed PASS; final hashes in final-report.json.

## Self visual inspection

Full native PNG views inspected for ACT-08, STA-03, DATA-03, SEQ-03, SEQ-04, SEQ-08. Crops inspect ACT validation loop, sequence source/assembly/review and SRS branches, state feedback loop, revision vocabulary/provenance fields. Initial state overlap, DATA clipping, duplicate creator field mapping and state arrow continuity were corrected before final delivery. All shapes/connectors remain native editable; no raster or SVG image shapes embedded.

Layout caveats: DATA is intentionally wide to keep long logical field names readable at zoom; fit-to-page thumbnails need zoom/crops. Sequence pages are tall; use original/native zoom. STA transition text is editable native text alongside its corresponding arrow, rather than attached edge labels; source/target terminals and original text are verified separately. These are presentation choices, not semantic additions. This self-check does not substitute for independent semantic/visual acceptance.

Final native activity self-fix: expanded all six decision bands from 24px to 60px, widened guard shapes 100px, shifted downstream actions/routes and moved the validation-loop return corridor outside the decision. Labels and source/target terminals preserved. Full-page and first/lower guard crops inspected after final export; branch labels clear and return arrow enters right side from the external corridor. Final activity/state exports supersede corresponding rows in export-results.json; see activity-final-export.json and state-final-export.json. Final candidate SHA-256: f3fe7bf7fa729479331ff4beaca9ac4c15b28eff52c8d55ee14015d9d5b331a5.
