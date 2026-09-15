# Lingora

Lingora is a modern language learning web application built with **Software Engineering as the CORE platform** and **AI as a SUPPORTING CAPABILITY**:

- **Software Engineering Core:** Web learning platform (`lingora-web`), admin & content management (`lingora-admin`), 6 canonical roles (`Administrator`, `Lesson Creator`, `Moderator`, `Operations Staff`, `Learner`, `Organizational Manager`), 19 MVP functions, 15 Use Cases, and a 6-state content review workflow (`Draft` → `In Review` → `Changes Requested` → `Approved` → `Published` → `Archived`).
- **AI Supporting Capability:** Lightweight, stateless AI service (`lingora-ai/api`) providing Grammatical Error Correction (`/v1/gec/correct`) for scenario writing practice via pretrained models or external API providers.

The platform follows a unified AI development workflow using **Superpowers** (`obra/superpowers`). Approved repository boundaries are `lingora-web`, `lingora-admin`, and `lingora-ai/api/`.

## Start here

1. Read `AGENTS.md` for mandatory workflow and change controls.
2. Read `docs/README.md` for the documentation map and merge policy.
3. Read `plans/current-task.md` before planning or implementing any task.
4. Read `ENVIRONMENT.md` for the current local toolchain and secret-handling rules.

The required lifecycle is:

`PLAN → REVIEW → APPROVE → IMPLEMENT → TEST → LOG → COMMIT`

No coding agent may implement feature work until the current task has explicit human approval.
