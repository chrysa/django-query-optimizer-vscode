# Constraints — django-query-optimizer-vscode

> Binding limits on how this repo may change. Each is tagged by kind:
> [PLATFORM] [PROCESS] [STANDARD] [EXTERNAL]. Evidence in-repo where given.

- [PLATFORM] Targets VS Code engine `^1.90.0`; the shipped artifact is a `.vsix`
  built by `@vscode/vsce`. Runtime is the VS Code extension host (Node-based).
  — `package.json` (`engines`, `package` script). (FACT)
- [PLATFORM] Entrypoint is fixed to `out/src/extension.js`, compiled from
  `src/extension.ts` by `tsc`. — `package.json` `main`, `tsconfig.json`. (FACT)
- [EXTERNAL] Depends on the external `django-query-optimizer` Python package
  (`0.1.0+`) as the SARIF producer; the extension is useless without SARIF input
  but does not bundle or invoke that tool. — `README.md`, `ARCHITECTURE.md`. (FACT)
- [EXTERNAL] Consumes SARIF **2.1.0**; parsing implements a subset of the spec.
  — `src/extension.ts` header. (FACT)
- [PROCESS] Direct commits to `main` are blocked; typed branch prefixes required
  (`feat/ fix/ chore/ docs/ ci/ refactor/ test/ perf/`); Conventional Commits
  enforced. — `CONTRIBUTING.md`, `.pre-commit-config.yaml`,
  `enforce-feature-branch.yml`. (FACT)
- [PROCESS] Every PR must reference a Shortcut story; PR size and dependency
  checks apply. — `enforce-shortcut-link.yml`, `pull-request-size.yml`,
  `pr-dependencies.yml`. (FACT)
- [PROCESS] Local dev must go through `make` targets, not host-level tool calls.
  — `CONTRIBUTING.md`, `Makefile`. (FACT)
- [STANDARD] All committed files must be in English. — `CONTRIBUTING.md`,
  `.claude/hookify.warn-french-in-files.local.md`. (FACT)
- [STANDARD] The repo follows the chrysa transverse standards (canon:
  `shared-standards/standards/STANDARDS.chrysa.md`); local `standards/` mirrors
  rule pointers and CLAUDE.md embeds the slim core. — `CLAUDE.md`,
  `CONTRIBUTING.md`. (FACT)
- [STANDARD] Secret scanning is a gate in pre-commit and CI; no hardcoded
  secrets. — `.pre-commit-config.yaml`, `secret-scan.yml`, `.secrets.baseline`. (FACT)
- [PROCESS] `handover.md` and other generated context files are produced by
  `scripts/gen_context_files.py` (ADR D-0012) and must not be hand-edited. —
  file header. (FACT)
