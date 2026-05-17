# django-query-optimizer — VS Code Extension

![VS Code](https://img.shields.io/badge/VS%20Code-1.90%2B-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5%2B-blue)
![License](https://img.shields.io/badge/license-MIT-lightgrey)
![Status](https://img.shields.io/badge/status-pre--alpha-orange)

VS Code extension that surfaces ORM diagnostics produced by
[django-query-optimizer](https://github.com/chrysa/django-query-optimizer)
directly in the editor — as inline squiggles and Problems panel entries.

---

## How it works

1. Run your test suite with `--query-analysis --sarif-output`:

   ```bash
   pytest --query-analysis --sarif-output query-results.sarif
   ```

2. The extension detects the `.sarif` file, parses it, and publishes
   a `DiagnosticCollection` for every affected source file.
3. The Problems panel and inline squiggles update automatically whenever
   the file changes (e.g. on the next test run).

```
pytest run
   └─ writes query-results.sarif (SARIF 2.1.0)
         └─ FileSystemWatcher detects change
               └─ parseSarif() → DiagnosticCollection
                     └─ VS Code Problems panel + inline squiggles
```

---

## Requirements

- VS Code **1.90** or later
- [django-query-optimizer](https://github.com/chrysa/django-query-optimizer) **0.1.0+**
  installed in your project's virtualenv

---

## Installation

> The extension is not yet published to the VS Code Marketplace.
> Install from source until the first release.

```bash
git clone https://github.com/chrysa/django-query-optimizer-vscode
cd django-query-optimizer-vscode
make install    # npm ci
make package    # produces django-query-optimizer-<version>.vsix
code --install-extension django-query-optimizer-0.1.0.vsix
```

---

## Configuration

All settings are under the `djangoQueryOptimizer` namespace:

| Setting | Type | Default | Description |
|---|---|---|---|
| `djangoQueryOptimizer.enabled` | boolean | `true` | Enable / disable the extension entirely |
| `djangoQueryOptimizer.sarifPattern` | string | `**/*.sarif` | Glob pattern for SARIF files to watch |

Example `.vscode/settings.json`:

```json
{
  "djangoQueryOptimizer.sarifPattern": "reports/**/*.sarif"
}
```

---

## Commands

| Command | ID | Description |
|---|---|---|
| **Reload SARIF files** | `djangoQueryOptimizer.reload` | Re-scan workspace for SARIF files and refresh diagnostics |
| **Clear diagnostics** | `djangoQueryOptimizer.clear` | Remove all diagnostics from the Problems panel |

Access via the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).

---

## Diagnostic severity mapping

| SARIF level | VS Code severity |
|---|---|
| `error` | Error (red) |
| `warning` | Warning (yellow) |
| `note` | Information (blue) |
| `none` / unknown | Hint (grey) |

---

## Development

**Prerequisites:** Node.js 22, VS Code

```bash
make install     # npm ci
make typecheck   # tsc --noEmit
make lint        # eslint src
make compile     # tsc (outputs to out/)
make test        # @vscode/test-electron (headless via xvfb)
make package     # vsce package → .vsix
```

**Running in development:**

1. Open the repo in VS Code.
2. Press `F5` — launches an Extension Development Host window.
3. Open a Django project that has a `.sarif` file in the workspace.

**Project layout:**

```
src/
└── extension.ts       # Entry point — activate() / deactivate()
                       # parseSarif()       pure SARIF → ParsedFinding[]
                       # DiagnosticsHub     owns DiagnosticCollection
                       # QueryOptimizerStatusBar  status bar item
                       # SarifWatcher       FileSystemWatcher wrapper
test/
├── runTest.ts         # @vscode/test-electron runner
└── unit/
    └── parseSarif.test.ts  # 14 unit tests (no VS Code runtime)
```

**Adding a test:**

Tests in `test/unit/` run with mocha and do **not** require a live VS Code
instance — `parseSarif()` is a pure function. Add test cases in `parseSarif.test.ts`
using the existing SARIF fixture pattern.

---

## Architecture notes

`parseSarif(json, sarifFilePath, workspaceRoot)` is the core function. It:

- Iterates over all `runs` in the SARIF document
- Resolves `uriBaseId` values:
  - `%SRCROOT%` → workspace root (absolute)
  - Named base IDs from `originalUriBaseIds` → their `uri` value
  - Relative URIs without a base ID → resolved from the SARIF file directory
  - Absolute `file://` URIs → used as-is
- Converts SARIF `level` to `vscode.DiagnosticSeverity`
- Maps 1-based SARIF line/column numbers to 0-based VS Code `Range`
- Falls back to a range pointing at the SARIF file itself when no location is present

---

## Related

- [django-query-optimizer](https://github.com/chrysa/django-query-optimizer) — the Python library and pytest plugin
- [SARIF 2.1.0 spec](https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html)

---

## License

MIT — see [LICENSE](LICENSE).
