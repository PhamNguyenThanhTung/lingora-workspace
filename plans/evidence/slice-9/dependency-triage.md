# Dependency audit triage

`npm audit --package-lock-only --ignore-scripts --json` returned exit1: three high entries for the same transitive issue (`prisma` → `@prisma/config` → `deepmerge-ts`), zero critical/moderate/low. All three packages already occur in baseline `7daeae9`; Slice 9 adds no version upgrade.

The [maintainer advisory](https://github.com/RebeccaStevens/deepmerge-ts/security/advisories/GHSA-ggr8-5vv4-36mx) concerns recursive JavaScript object graphs passed to merge functions; plain JSON does not create that condition. Installed `@prisma/config` imports the merge implementation for configuration loading. This repository has no `prisma.config.*`; generation reads the reviewed static Prisma schema. Learner requests do not invoke Prisma CLI/config loading or pass object graphs to that package.

Defer the proposed Prisma7 major upgrade from this slice. No forced remediation/override or lowered audit threshold is applied. The owned build configuration is trusted, and this advisory is not reachable from the new auth/context inputs. Review again by 2026-11-07, or sooner if dynamic Prisma configuration or untrusted JavaScript config is introduced. Final server tracing is checked separately before deployment.
