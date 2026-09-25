# Documentation Review — django-query-optimizer-vscode

> Output of a docs-only audit pass (2026-09-25). No source/tests/config were
> changed. This records what exists, contradictions to reconcile, and debt.

## State of documentation (FACT)

The repo is already well-documented for its size (one ~408-line source file).
Pre-existing, accurate docs: `README.md`, `ARCHITECTURE.md`, `CLAUDE.md`,
`AGENTS.md`, `CONTRIBUTING.md`, `CHANGELOG.md` (cliff-generated),
`handover.md` (generated), `ai-instructions.md`, `llms-full.txt`,
`docs/reference/github-inspiration.md`.

Added in this pass (gap-filling only): `REQUIREMENTS.md`, `TESTING.md`,
`SECURITY.md`, `DECISIONS.md`, `CONSTRAINTS.md`, this `REVIEW.md`.

## Contradictions to reconcile (owner decision)

1. **`CONTRIBUTING.md` references Python tooling that does not apply.** It tells
   contributors to use `make test`, `make test-cov`, `make lint`, `make format`,
   `make typecheck` and "never call `pytest` / `ruff` / `mypy` directly." This is
   a **TypeScript** extension: `make test-cov` does not exist (the target is
   `npm run coverage`), and pytest/ruff/mypy are irrelevant to the shipped code.
   The Makefile targets are TS (`eslint`, `tsc`). Likely copied from a Python
   template. — recommend aligning CONTRIBUTING with the actual TS `Makefile`.
2. **`.github/ISSUE_TEMPLATE/` is referenced but absent.** `CONTRIBUTING.md`
   points to issue templates under `.github/ISSUE_TEMPLATE/`; no such directory
   exists. — recommend adding templates or removing the reference.
3. **`ci.yml` self-describes as a template that "lives in `workflows/` (NOT
   `.github/workflows/`)"** yet it is checked in at `.github/workflows/ci.yml`
   with placeholders already substituted. The header comment is stale for the
   applied copy. — cosmetic; recommend trimming the applier preamble in the
   applied file.

## Points to verify (not blocking)

- **Coverage threshold is UNKNOWN in-repo** (see `TESTING.md`). CONTRIBUTING
  implies one exists; it may be enforced only in SonarCloud.
- **`typescript` devDependency pinned `^7.0.2`** while `@types/vscode` is
  `^1.125.0` and the engine is `^1.90.0` — these are independent version lines
  (TS compiler vs VS Code typings vs engine), not necessarily a conflict, but
  worth a sanity check at build time.

## Documentation debt

- No `.env.example` (none needed — extension has no runtime secrets); the
  CONTRIBUTING "keep `.env.example` in sync" line is inherited boilerplate.
- Profile / DDD level / Notion links show "(not available)" in generated
  `handover.md` — source metadata (context-map / project-init inputs) is
  incomplete for this repo.
- OBSERVABILITY / ROADMAP / GLOSSARY / PRD / TRD docs were **skipped**
  intentionally — see the mission output; nothing to observe (no runtime
  telemetry), no committed roadmap, and terms are already defined inline in
  README/ARCHITECTURE.
