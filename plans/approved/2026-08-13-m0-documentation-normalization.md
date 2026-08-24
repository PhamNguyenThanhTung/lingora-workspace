# Approved Task — M0 Documentation and Project-Structure Normalization

Approval date: 2026-08-13

Approved by: Pham Nguyen Thanh Tung (user)

Scope: normalize Lingora naming and repository boundaries; make `docs/` canonical; migrate legacy planning content into the five canonical documents without semantic changes; classify discrepancies; archive legacy workflow only after coverage verification; run consistency checks and update logs; do not commit.

Approved repository names:

```text
lingora-android/
lingora-admin/
lingora-ai/
├── api/
├── ml_srs/
└── nlp_chatbot/
```

Canonical source: `docs/`

Legacy reference: `ke-hoach-chi-tiet/`

Prohibited: feature code, migrations, API/UI implementations, model training, dependencies, scope/architecture/contract/schema semantic changes, commit.

The detailed execution plan is preserved in `plans/current-task.md` at task start.
