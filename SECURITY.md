# Security — django-query-optimizer-vscode

> Owner-facing security notes for a docs-only audit. No code was changed. No
> secrets are reproduced here; where anything sensitive was seen, only its
> location and nature are named.

## Attack surface (FACT / INFERENCE)

- The extension reads local workspace `.sarif` files (JSON) and Node `fs`/`path`;
  it makes no network calls at runtime (INFERENCE from source read — no network
  imports/calls in `src/extension.ts`). Its trust boundary is therefore the
  contents of SARIF files present in the user's workspace.
- SARIF input is parsed as JSON and used to build file URIs and diagnostic
  ranges. URI resolution deliberately avoids `process.cwd()` and anchors
  relative paths to the SARIF file / workspace root (`REQ-TECH-003`). No
  path-traversal sink beyond opening/annotating files was identified in the read
  (INFERENCE — full data-flow audit is out of scope for docs-only).

## Secret hygiene controls (FACT)

- `detect-secrets` baseline: `.secrets.baseline` (present; not inspected for
  values). [REDACTED — baseline file, no live secrets copied here]
- Pre-commit secret scanning + secret-scan CI workflow:
  `.pre-commit-config.yaml`, `.github/workflows/secret-scan.yml`.
- `.env.example`-in-sync and "no hardcoded secrets" rule stated in
  `CONTRIBUTING.md` (note: no `.env`/`.env.example` file exists — this extension
  has no runtime secrets, so the rule is vacuously satisfied here — INFERENCE).

## MCP configuration (FACT)

- `.mcp.json` declares dev-time MCP servers (Notion, context7). These are
  developer tooling, not a runtime dependency of the shipped extension
  (`ARCHITECTURE.md`). Confirm no tokens are hardcoded there before publishing
  (not inspected for values in this pass).

## Findings

- No HIGH or CRITICAL security findings were identified in this documentation
  pass. This was a read-level review, not a full SAST/data-flow audit; treat the
  above as a scoped assessment, not a clearance.

## Recommendation (PROPOSAL, owner decides)

- Before Marketplace publication (REQ-PROD-008), run `/security-review` on the
  packaged extension and confirm `.mcp.json` / `.secrets.baseline` contain no
  live credentials.
