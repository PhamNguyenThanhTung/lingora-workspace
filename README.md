# Lingora

Lingora is a modern language learning web application built with **Software Engineering as the CORE platform** and **AI as a SUPPORTING CAPABILITY**:

- **Product role baseline:** Three business roles (`Admin`, `Teacher`, `Learner`) and assigned Teacher authoring with Admin review/approval/publication are approved by ADR-034. Legacy six-role/15-UC materials remain historical; business approval does not establish implementation.
- **AI Supporting Capability (target intent):** The documented target includes Grammatical Error Correction for scenario writing practice. No AI runtime is currently present in this repository, and compatibility remains open under P0-D07.

The platform follows a unified AI development workflow using **Superpowers** (`obra/superpowers`). Approved repository boundaries are `lingora-web`, `lingora-admin`, and `lingora-ai/api/`.

## Start here

1. Read `AGENTS.md` for mandatory workflow and change controls.
2. Read `docs/README.md` for the documentation map and merge policy.
3. Read `plans/current-task.md` before planning or implementing any task.
4. Read `ENVIRONMENT.md` for the current local toolchain and secret-handling rules.

The required lifecycle is:

`PLAN → REVIEW → APPROVE → IMPLEMENT → TEST → LOG → COMMIT`

No coding agent may implement feature work until the current task has explicit human approval.
