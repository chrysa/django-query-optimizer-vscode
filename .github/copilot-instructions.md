# django-query-optimizer-vscode — GitHub Copilot Instructions

## Purpose
VS Code extension companion to `chrysa/django-query-optimizer`. Provides in-editor
query analysis, N+1 detection hints, and optimization suggestions for Django projects.
Pre-alpha — API still evolving.

## Stack
- **Language**: TypeScript 5.5+
- **Runtime**: VS Code Extension API (vscode ^1.90.0)
- **Build**: esbuild / tsc
- **Testing**: Mocha + @vscode/test-electron
- **Linting**: ESLint + Prettier
- **Package**: package.json (npm)

## Project Structure
```
src/
  extension.ts           # Entry point — activate() / deactivate()
  analyzers/             # Query analysis providers
  diagnostics/           # VS Code DiagnosticsCollection integration
  commands/              # Registered commands
  views/                 # Webview panels, tree providers
test/
  suite/                 # Integration tests via @vscode/test-electron
package.json             # Extension manifest + npm dependencies
tsconfig.json            # TypeScript config (strict mode)
```

## Development Rules
- All changes must pass `tsc --noEmit` (strict mode — no `any`).
- Extension activation events must be minimal (lazy activation preferred).
- Never use `console.log` in production — use VS Code `OutputChannel`.
- Tests must run via `make test` (launches VS Code test runner in Docker).
- Extension commands must be registered in `package.json` contributes section.

## Makefile targets
See `make help` for all available targets.
