# Testing — django-query-optimizer-vscode

> Facts drawn from `package.json`, `Makefile`, `.vscode-test.mjs`, `test/`, and
> `.github/workflows/ci.yml`. Commands are quoted as they appear; they were not
> executed as part of this documentation pass.

## Test layout (FACT)

| Path | Purpose |
| --- | --- |
| `test/unit/parseSarif.test.ts` | Unit tests for the pure `parseSarif()` function — no VS Code host required. |
| `test/unit/extension.test.ts` | Extension-level tests. |
| `test/fixtures/query-results.sarif` | Sample SARIF 2.1.0 input. |
| `test/fixtures/models.py` | Sample Django models referenced by the fixture SARIF. |

## Commands (FACT — from `package.json` scripts / `Makefile`)

| Command | Effect |
| --- | --- |
| `make install` | `npm ci` |
| `make compile` | `tsc -p ./` |
| `make test` | `make compile` then `npm test` → `vscode-test` (runs in the VS Code test host). |
| `npm run coverage` | `vscode-test --coverage --coverage-reporter=lcovonly --coverage-reporter=text`. |
| `make lint` | `eslint src` |
| `make typecheck` | `tsc --noEmit` |
| `make ci` | `lint + typecheck + test` |
| `make quality-gate-verify` | Display-free gate: `lint + typecheck + compile`. |

## Runtime constraints (FACT)

- The `test` / `coverage` runners use `@vscode/test-electron` and therefore need
  a display. CI provides one in the main test job; the no-regression gate job is
  display-free and runs `quality-gate-verify` instead (see `Makefile` comment).
- `parseSarif()` is pure and can be exercised without a VS Code instance
  (`README.md`, `REQ-TECH-002`).

## CI wiring (FACT — `.github/workflows/ci.yml`)

- CI runs **tests + Sonar** only; lint/tsc/pre-commit are NOT re-run in this
  workflow on every push (they live in pre-commit locally and are replayed at
  release time) — this is a deliberate billing-parity choice stated in the file.
- The test job must produce `coverage/lcov.info` for the Sonar job.
- SonarCloud project key: `chrysa_django-query-optimizer-vscode`
  (`sonar-project.properties`, `ci.yml`).

## Coverage threshold (UNKNOWN)

- `CONTRIBUTING.md` says "keep coverage at or above the project threshold" but
  no explicit numeric threshold was found in-repo (checked `package.json`,
  `sonar-project.properties`, `.vscode-test.mjs`). UNKNOWN — the gate may be
  enforced server-side in SonarCloud.
