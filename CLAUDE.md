# CLAUDE.md — django-query-optimizer-vscode

> **Claude Code**: also read `.github/copilot-instructions.md` and `.github/instructions/*.instructions.md` for code specifications.

## Project

**Name:** django-query-optimizer-vscode
**Stack:** TypeScript + VS Code Extension
**Purpose:** VS Code extension for django-query-optimizer

## Conventions

- Language: English
- Commits: Conventional Commits
- Branch naming: `feat/`, `fix/`, `chore/`, `docs/`, `ci/`
- Default branch: `main`

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

<!-- chrysa:standards-import:start -->
@.chrysa/STANDARDS.md
<!-- chrysa:standards-import:end -->

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
