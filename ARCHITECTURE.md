# Architecture — django-query-optimizer-vscode

## Purpose

VS Code extension that surfaces ORM diagnostics produced by the external
[django-query-optimizer](https://github.com/chrysa/django-query-optimizer) tool
directly in the editor. It reads SARIF 2.1.0 reports (emitted by
`pytest --query-analysis --sarif-output`), parses their findings, and publishes
them as inline squiggles and Problems-panel entries. The extension performs no
analysis itself — it is a viewer for SARIF results.

## Stack

- **Language:** TypeScript (compiled with `tsc` to `out/`).
- **Runtime:** VS Code extension host, engine `vscode ^1.90.0` (Node-based).
- **Test:** `@vscode/test-electron` / `@vscode/test-cli` + Mocha; `c8` for coverage.
- **Lint/types:** ESLint (`@typescript-eslint`), `tsc --noEmit`.
- **Packaging:** `@vscode/vsce` (produces a `.vsix`).
- **Tooling repo also carries:** Python quality scripts (`scripts/*.py`,
  `pyproject.toml` with Ruff), pre-commit, and a `standards/` ruleset — these
  are project-governance/CI helpers, not part of the shipped extension.

## Layout

- `src/extension.ts` — the entire extension implementation (~408 lines). Internal
  components (per the file header): `SarifParser` (pure SARIF → Diagnostic
  conversion, no VS Code deps), `SarifWatcher` (FileSystemWatcher triggering
  parse+publish), `DiagnosticsHub` (owns the `DiagnosticCollection`).
- `out/` — compiled JS output (`out/src/extension.js`, `out/test/`).
- `test/unit/` — `parseSarif.test.ts` (SARIF parsing, no VS Code runtime) and
  `extension.test.ts`.
- `test/fixtures/` — sample inputs (`query-results.sarif`, `models.py`).
- `media/icon.png` — extension icon.
- `scripts/` — `quality_gate.py`, `gen_context_files.py` (governance/CI).
- `standards/rules/` — checked-in coding-standard rule files.
- `docs/` — reference material (`docs/reference/`).
- `.github/workflows/` — CI (`ci.yml`, `secret-scan.yml`, labeler, dependabot).

## Entrypoints

- **Extension main:** `out/src/extension.js` (compiled from `src/extension.ts`),
  declared as `"main"` in `package.json`.
- **Activation:** `workspaceContains:**/*.sarif`.
- **Commands:** `djangoQueryOptimizer.reload` (re-scan + refresh diagnostics),
  `djangoQueryOptimizer.clear` (clear all diagnostics).
- **Settings:** `djangoQueryOptimizer.enabled` (boolean, default `true`),
  `djangoQueryOptimizer.sarifPattern` (string, default `**/*.sarif`).

## Data / External dependencies

- **Input:** SARIF 2.1.0 files in the workspace, matched by `sarifPattern`.
  URI resolution: relative URIs without a base ID resolve from the SARIF file
  directory; absolute `file://` URIs are used as-is.
- **Producer (external, not vendored):** the `django-query-optimizer` Python
  package (0.1.0+) run in the user's project via pytest.
- **Output:** a VS Code `DiagnosticCollection` (squiggles + Problems panel).
- **Runtime services:** VS Code API only (`vscode`, Node `path`/`fs`). No network
  calls. `.mcp.json` configures dev-time MCP servers (Notion, context7) — not a
  runtime dependency of the extension.

## Build & test (real commands)

From `package.json` scripts / `Makefile` targets:

```bash
make install        # npm ci
make compile        # tsc -p ./   (alias: make build)
make watch          # tsc -watch -p ./   (alias: make dev)
make lint           # eslint src
make typecheck      # tsc --noEmit
make test           # compile, then @vscode/test-electron (needs a display/xvfb)
npm run coverage    # vscode-test --coverage (lcov + text)
make package        # vsce package -> django-query-optimizer-<version>.vsix
make ci             # lint + typecheck + test
make quality-gate-verify   # display-free gate: lint + typecheck + compile
make pre-commit     # pre-commit run --all-files
```

> Note: the `test` job requires a display; CI's display-free "no-regression" gate
> uses `quality-gate-verify` (lint + typecheck + compile) instead.
