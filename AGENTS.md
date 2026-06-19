# AGENTS.md — django-query-optimizer-vscode

Guidance for AI coding agents working in this repository. See `CLAUDE.md` for the
full project brief; this file is the agent-facing quick reference.

## What this is

A YAML-driven Django app scaffolder. The `forgeapps` management command reads a
spec document and generates Django apps with a custom structure — a generic,
declarative replacement for per-project Python scaffolding scripts.

## Architecture rules (do not break)

- The core (`naming.py`, `render.py`, `spec.py`, `generator.py`) MUST stay
  import-free of Django. Only `apps.py` and `management/commands/forgeapps.py`
  touch Django.
- `plan()` is pure (no side effects); `apply(dry_run=True)` reports actions but
  writes nothing — keep `--dry-run` exact.
- Existing files are SKIP by default; `--force` overwrites. Never clobber by default.

## Always do

- Run tests, lint, type-check, and build through **Docker or pre-commit only** —
  never on the host. Use `make docker-test`, `make lint`, `make typecheck`,
  `make test-cov`.
- Keep code, comments, docs, commits, and PRs in **English**.
- Conventional commits (feat/fix/chore/docs/refactor/test/build/ci) — the changelog
  and version bump are derived from them (`cliff.toml`, `GitVersion.yml`).
- mypy strict (django-stubs), ruff line length 120, coverage `fail_under = 85`.

## Never do

- Never add a Django import to the core modules.
- Never run `pytest` / `ruff` / `mypy` directly on the host.
- Never overwrite generated files without `--force` semantics in the generator.

## Resources

| Task | Where |
|------|-------|
| Project brief & layout | `CLAUDE.md` |
| Reference spec document | `apps.example.yaml` |
| Commands | `Makefile` (`make help`) |
| Standards backlog | issue #31 |