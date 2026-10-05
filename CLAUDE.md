@AGENTS.md

# CLAUDE.md — django-query-optimizer-vscode

> **Claude Code**: also read `.github/copilot-instructions.md` and `.github/instructions/*.instructions.md` for code specifications.

## Project

**Name:** django-query-optimizer-vscode
**Stack:** TypeScript + VS Code Extension
**Purpose:** VS Code extension for django-query-optimizer

## Documentation map

- `README.md` — install, usage, settings, commands. `ARCHITECTURE.md` — components & data flow.
- `REQUIREMENTS.md` — REQ-PROD / REQ-TECH matrix (evidence-tagged).
- `DECISIONS.md` — local ADRs. `CONSTRAINTS.md` — binding limits.
- `TESTING.md` — test layout, commands, CI wiring. `SECURITY.md` — attack surface & secret hygiene.
- `REVIEW.md` — doc audit: contradictions & debt (read before editing CONTRIBUTING/ci.yml).
- `CONTRIBUTING.md`, `AGENTS.md`, `CHANGELOG.md` (cliff-generated), `handover.md` (generated — do not edit).

## Conventions

- Branch naming: `feat/`, `fix/`, `chore/`, `docs/`, `ci/`. Default branch: `main`.

## Setup

```bash
make install
make lint
make test
codegraph init --index .
```

## Skills

Shared skills from `shared-standards/.claude/skills/`:

- `ui-ux/SKILL.md` — UX/UI/ergonomics across ALL surfaces (web, CLI, VS Code, Discord, desktop, game, agent) + WCAG 2.1 AA + dark mode + i18n FR+EN (load when building any human-facing surface)


## graphify

Follow the /graphify skill.
