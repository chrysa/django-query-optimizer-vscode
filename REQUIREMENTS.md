# Requirements — django-query-optimizer-vscode

> Evidence-based. Each requirement is tagged and, where IMPLEMENTED, points at
> the code/config that satisfies it. Claims are tagged FACT / INFERENCE /
> UNKNOWN. Nothing here is invented.

## Product requirements (REQ-PROD)

| ID | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| REQ-PROD-001 | Surface `django-query-optimizer` ORM findings from SARIF 2.1.0 reports as VS Code diagnostics (inline squiggles + Problems panel). | IMPLEMENTED (FACT) | `src/extension.ts` header + `DiagnosticsHub`; `README.md`; `ARCHITECTURE.md` |
| REQ-PROD-002 | Auto-detect and watch SARIF files matching a glob, refreshing diagnostics when they change. | IMPLEMENTED (FACT) | `SarifWatcher` (FileSystemWatcher) in `src/extension.ts`; activation event `workspaceContains:**/*.sarif` in `package.json` |
| REQ-PROD-003 | Provide a command to reload/re-scan SARIF files. | IMPLEMENTED (FACT) | command `djangoQueryOptimizer.reload` in `package.json` |
| REQ-PROD-004 | Provide a command to clear all diagnostics. | IMPLEMENTED (FACT) | command `djangoQueryOptimizer.clear` in `package.json` |
| REQ-PROD-005 | Allow enabling/disabling the extension via a setting. | IMPLEMENTED (FACT) | setting `djangoQueryOptimizer.enabled` (boolean, default `true`) in `package.json` |
| REQ-PROD-006 | Allow configuring which files are watched via a glob setting. | IMPLEMENTED (FACT) | setting `djangoQueryOptimizer.sarifPattern` (default `**/*.sarif`) in `package.json` |
| REQ-PROD-007 | Show a status-bar summary of the current finding count. | IMPLEMENTED (FACT) | status-bar item (`$(warning) DQO: <count>`) in `src/extension.ts` |
| REQ-PROD-008 | Publish to the VS Code Marketplace. | NOT DONE (FACT) | `README.md`: "The extension is not yet published to the VS Code Marketplace." |

## Technical requirements (REQ-TECH)

| ID | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| REQ-TECH-001 | The extension performs no analysis of its own; it is a viewer for externally produced SARIF. | IMPLEMENTED (FACT) | `ARCHITECTURE.md`; no analysis code in `src/extension.ts` |
| REQ-TECH-002 | SARIF parsing (`parseSarif`) is a pure function with no VS Code dependency, so it is unit-testable without a VS Code host. | IMPLEMENTED (FACT) | `parseSarif()` in `src/extension.ts`; `test/unit/parseSarif.test.ts`; `README.md` |
| REQ-TECH-003 | Resolve SARIF artifact URIs: absolute `file://` used as-is; `%SRCROOT%` → workspace root; relative → SARIF file directory; never `process.cwd()`. | IMPLEMENTED (FACT) | URI-resolution block in `src/extension.ts` |
| REQ-TECH-004 | Map SARIF result levels (error/warning/note/none) to VS Code `DiagnosticSeverity`, defaulting to Warning when absent/unknown. | IMPLEMENTED (FACT) | severity map + converter in `src/extension.ts` |
| REQ-TECH-005 | Deleting one watched SARIF file must not wipe diagnostics sourced from other watched files. | IMPLEMENTED (FACT) | delete handler re-scans remaining files in `src/extension.ts` |
| REQ-TECH-006 | Make no network calls at runtime; use only the VS Code API and Node `path`/`fs`. | IMPLEMENTED (INFERENCE — from source read; no network imports/calls found) | `src/extension.ts`; `ARCHITECTURE.md` |
| REQ-TECH-007 | Build with `tsc` to `out/`; entrypoint `out/src/extension.js`. | IMPLEMENTED (FACT) | `package.json` `main` + `compile` script; `tsconfig.json` |
| REQ-TECH-008 | Target VS Code engine `^1.90.0`. | IMPLEMENTED (FACT) | `package.json` `engines.vscode` |

## Non-functional / governance requirements

| ID | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| REQ-NFR-001 | All committed files (code, comments, docs, config) in English. | ENFORCED (FACT) | `CONTRIBUTING.md`; `.claude/hookify.warn-french-in-files.local.md` |
| REQ-NFR-002 | No hardcoded secrets; secret scanning gates commits and CI. | ENFORCED (FACT) | `.secrets.baseline`; `.pre-commit-config.yaml`; `.github/workflows/secret-scan.yml` |
| REQ-NFR-003 | Conventional Commits, typed branches, one approval before merge. | ENFORCED (FACT) | `CONTRIBUTING.md`; `enforce-feature-branch.yml`; `.pre-commit-config.yaml` |
| REQ-NFR-004 | Every PR references a Shortcut story. | ENFORCED (FACT) | `.github/workflows/enforce-shortcut-link.yml` |
