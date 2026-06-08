# Django Query Optimizer — VS Code Extension

![VS Code](https://img.shields.io/badge/VS%20Code-1.90%2B-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5%2B-blue)
![License](https://img.shields.io/badge/license-MIT-lightgrey)
![Status](https://img.shields.io/badge/status-pre--alpha-orange)

See Django ORM performance problems — N+1 queries, missing `select_related`/`prefetch_related`, and other inefficiencies — as inline squiggles and Problems-panel entries, right where the code lives. No leaving your editor to read a report.

It surfaces findings from the
[django-query-optimizer](https://github.com/chrysa/django-query-optimizer)
pytest plugin, which emits a standard SARIF file when your tests run.

> **Status: pre-alpha (v0.1.0).** Not yet on the VS Code Marketplace — install from source (see below).

## Who it's for

Django developers who run their test suite with `django-query-optimizer` and want its ORM findings to appear directly in VS Code instead of in a separate report.

## Features

- **Inline diagnostics** — ORM findings show up as squiggles on the exact line, plus entries in the Problems panel.
- **Auto-refresh** — diagnostics update automatically the next time your tests regenerate the SARIF file. No manual reload needed.
- **Severity mapping** — SARIF levels map to native VS Code severities, so the worst problems stand out (see table below).
- **Zero config to start** — point it at a Django project with a `.sarif` file and it just works; tune the file pattern only if you need to.

## Requirements

- VS Code **1.90** or later
- [django-query-optimizer](https://github.com/chrysa/django-query-optimizer) **0.1.0+** installed in your project's virtualenv

## Installation

The extension is not yet published to the Marketplace. Install from source:

```bash
git clone https://github.com/chrysa/django-query-optimizer-vscode
cd django-query-optimizer-vscode
make install    # npm ci
make package    # produces django-query-optimizer-<version>.vsix
code --install-extension django-query-optimizer-0.1.0.vsix
```

## Usage

1. Run your test suite to produce a SARIF report:

   ```bash
   pytest --query-analysis --sarif-output query-results.sarif
   ```

2. Open the Django project in VS Code. The extension activates automatically when the workspace contains a `.sarif` file, parses it, and publishes diagnostics for every affected source file.

3. Findings appear as inline squiggles and in the Problems panel. They refresh on their own each time a test run rewrites the SARIF file.

### Commands

Run these from the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

| Command | ID | What it does |
|---|---|---|
| **Django Query Optimizer: Reload SARIF files** | `djangoQueryOptimizer.reload` | Re-scan the workspace and refresh diagnostics |
| **Django Query Optimizer: Clear all diagnostics** | `djangoQueryOptimizer.clear` | Remove all diagnostics from the Problems panel |

### Severity mapping

| SARIF level | VS Code severity |
|---|---|
| `error` | Error (red) |
| `warning` | Warning (yellow) |
| `note` | Information (blue) |
| `none` / unknown | Hint (grey) |

## Configuration

All settings live under the `djangoQueryOptimizer` namespace:

| Setting | Type | Default | Description |
|---|---|---|---|
| `djangoQueryOptimizer.enabled` | boolean | `true` | Enable / disable the extension entirely |
| `djangoQueryOptimizer.sarifPattern` | string | `**/*.sarif` | Glob pattern for SARIF files to watch (relative to workspace root) |

Example `.vscode/settings.json` — watch only a `reports/` folder:

```json
{
  "djangoQueryOptimizer.sarifPattern": "reports/**/*.sarif"
}
```

## How it works

```
pytest run
   └─ writes query-results.sarif (SARIF 2.1.0)
         └─ FileSystemWatcher detects change
               └─ parseSarif() → DiagnosticCollection
                     └─ VS Code Problems panel + inline squiggles
```

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full setup. Quick reference:

```bash
make install     # npm ci
make typecheck   # tsc --noEmit
make lint        # eslint src
make compile     # tsc (outputs to out/)
make test        # @vscode/test-electron (headless via xvfb)
make package     # vsce package → .vsix
```

Press `F5` in VS Code to launch an Extension Development Host, then open a Django project containing a `.sarif` file.

## Related

- [django-query-optimizer](https://github.com/chrysa/django-query-optimizer) — the Python library and pytest plugin that produces the reports
- [SARIF 2.1.0 spec](https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html)

## License

MIT — see [LICENSE](LICENSE).
