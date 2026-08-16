# Deep-dive: `chrysa/django-query-optimizer-vscode`

**Purpose (1 phrase).** VS Code extension (TypeScript) that watches for SARIF 2.1.0
files produced by `pytest --query-analysis --sarif-output` (from the sibling
`django-query-optimizer` tool) and surfaces the ORM/N+1 findings as native VS Code
diagnostics — inline squiggles + Problems panel + a status-bar count.

**State.** Single-file extension (`src/extension.ts`, 408 LOC): a pure `parseSarif()`
converter (no `vscode` deps, unit-tested), a `DiagnosticsHub` owning the
`DiagnosticCollection`, a `SarifWatcher` around `FileSystemWatcher`, and a
`StatusBarItem`. Pre-alpha, v0.1.0, not on the Marketplace. License: MIT.

## Framing — is this a lib needing external refs?

This is a **thin consumer of two very well-trodden VS Code APIs**: SARIF ingestion and
`DiagnosticCollection` publishing. The right references are therefore the *canonical
Microsoft implementations of exactly this*, not generic inspiration. Three MIT repos
cover essentially everything this extension does, plus one for the SARIF format itself.
No need to force 10 — 4 permissive Microsoft repos is the honest set.

All four are **MIT → copiable** (with attribution). No copyleft/restrictive sources.

---

## microsoft/sarif-vscode-extension

- **owner/repo:** microsoft/sarif-vscode-extension
- **stars:** ~139
- **activity:** actively maintained (~237 commits, v3 line — resizable details, keyboard a11y)
- **language:** TypeScript
- **licence:** **MIT — copiable** (attribution in NOTICE)
- **pattern file/module:** `src/extension/` — the SARIF-result → `vscode.Diagnostic`
  mapping and the Problems-panel/squiggle publishing path. This is the *reference
  implementation of the exact job* this repo does (viewer for SARIF logs: squiggles,
  Problems list, dedicated results panel).
- **mechanism:** parses a SARIF log, groups `results[]` by artifact URI, builds a
  `DiagnosticCollection`, resolves `artifactLocation.uri` against `originalUriBaseIds`
  / `%SRCROOT%` (the same base-ID resolution `resolveUri()` reimplements here), and
  maps SARIF `level` → `DiagnosticSeverity`. Also adds `relatedInformation` from SARIF
  `relatedLocations` and code-flow steps — the biggest missing feature in the chrysa
  extension.
- **portable snippet (severity + region mapping, the core of `parseSarif`):**
  ```ts
  const LEVEL: Record<string, vscode.DiagnosticSeverity> = {
    error: vscode.DiagnosticSeverity.Error,
    warning: vscode.DiagnosticSeverity.Warning,
    note: vscode.DiagnosticSeverity.Information,
    none: vscode.DiagnosticSeverity.Hint,
  };
  function toRange(r?: { startLine?: number; startColumn?: number; endLine?: number; endColumn?: number }) {
    const sl = Math.max(0, (r?.startLine ?? 1) - 1);
    const sc = Math.max(0, (r?.startColumn ?? 1) - 1);
    return new vscode.Range(sl, sc, Math.max(sl, (r?.endLine ?? r?.startLine ?? 1) - 1),
                            r?.endColumn != null ? r.endColumn - 1 : sc);
  }
  ```
- **integration steps:** (1) adopt SARIF `relatedLocations` → `diag.relatedInformation`
  so N+1 findings can point at both the query call-site and the loop that triggers it;
  (2) borrow their `uriBaseId` resolution test matrix; (3) consider their pattern of a
  dedicated results TreeView for when there are many findings (status-bar count is thin).
- **gotchas:** their code handles multi-run logs and `artifactLocation.index` into
  `run.artifacts[]` — the chrysa parser only reads `locations[0]` and ignores `index`
  (findings pointing to indexed artifacts would be dropped). Watch bundle size: the full
  extension pulls the `sarif` npm types + a React panel; only lift the mapping layer.

---

## microsoft/vscode-extension-samples

- **owner/repo:** microsoft/vscode-extension-samples
- **stars:** ~10.1k
- **activity:** very active (~1,799 commits), official sample repo
- **language:** TypeScript
- **licence:** **MIT — copiable**
- **pattern file/module:** `diagnostic-related-information-sample/` and the
  `FileSystemWatcher` usage across samples — the canonical minimal
  `createDiagnosticCollection` + watcher wiring that `DiagnosticsHub`/`SarifWatcher`
  mirror.
- **mechanism:** shows the idiomatic lifecycle: create a `DiagnosticCollection` once,
  subscribe to document/file events, recompute diagnostics, `collection.set(uri, diags)`,
  and register everything on `context.subscriptions` for disposal. Also demonstrates
  `relatedInformation` linking one diagnostic to other locations.
- **portable snippet (idiomatic watcher → republish, cf. `SarifWatcher.start`):**
  ```ts
  const w = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(vscode.workspace.workspaceFolders![0], "**/*.sarif"));
  const refresh = (u: vscode.Uri) => reparseAndPublish(u);
  ctx.subscriptions.push(
    w, w.onDidCreate(refresh), w.onDidChange(refresh),
    w.onDidDelete(() => rescanAll()),
  );
  ```
- **integration steps:** (1) validate the current disposal wiring against the sample
  (looks correct here); (2) adopt the sample's `onDidChangeTextDocument` incremental
  pattern if you later want live re-eval without a full test rerun; (3) use their test
  harness layout (`@vscode/test-cli`) as the reference — this repo already does.
- **gotchas:** `findFiles` + full re-scan on every change (as `_loadAll` does) is O(all
  files) per event — fine for a handful of SARIF reports, but the sample shows per-uri
  updates; debounce if reports get large or numerous. `RelativePattern` with `""` as the
  base (the fallback in `start()`) is a latent bug — prefer guarding on
  `workspaceFolders?.[0]` and no-op'ing when absent.

---

## microsoft/vscode-eslint

- **owner/repo:** microsoft/vscode-eslint
- **stars:** ~1.9k
- **activity:** actively maintained (~889 commits, v3.0.x)
- **language:** TypeScript
- **licence:** **MIT — copiable**
- **pattern file/module:** `client/src/` + `server/src/` — the production pattern for a
  diagnostics-publishing linter extension: config namespace (`eslint.*`), enable/disable
  toggle, glob-scoped activation, status-bar item reflecting state, and reacting to
  `onDidChangeConfiguration`. Directly parallels `djangoQueryOptimizer.*` settings, the
  `enabled` gate, and the config-change → `watcher.start()` restart in `activate()`.
- **mechanism:** uses the Language Server Protocol (overkill here) but its *client-side
  ergonomics* are the reference: a status bar that shows OK / warning / spinner states,
  clean re-init when settings change, and per-file diagnostic ownership.
- **portable snippet (config-change restart, cf. this repo's `onDidChangeConfiguration`):**
  ```ts
  vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("djangoQueryOptimizer")) restartWatcher();
  });
  ```
- **integration steps:** (1) mirror their status-bar state machine (idle/spin/error) —
  the current `QueryOptimizerStatusBar` has ok/warn/loading but no explicit *error*
  state when a SARIF file fails to parse; (2) add an "ESLint: Restart"-style
  `reload` command (already present); (3) consider their `onEnable`/`onDisable`
  activation-cost pattern to avoid running the watcher when `enabled=false` (this repo
  returns early in `activate`, which is good but never re-activates if the user flips
  `enabled` back to true without reloading — a real gap ESLint handles).
- **gotchas:** don't pull in the LSP machinery — it's justified for a real linter, not a
  passive SARIF reader. Only lift the client UX patterns.

---

## microsoft/sarif-sdk

- **owner/repo:** microsoft/sarif-sdk
- **stars:** ~224
- **activity:** active (~3,461 commits)
- **language:** C# (.NET) — reference for the **format/spec**, not for code to copy
- **licence:** **MIT — copiable** (but it's C#; use as spec authority, not source)
- **pattern file/module:** the `SarifLog` object model + SARIF 2.1.0 spec docs — the
  authoritative shape of `runs[].results[].locations[].physicalLocation.region` and
  `originalUriBaseIds` that the TS interfaces in `extension.ts` hand-model as a subset.
- **mechanism:** full serialization model of every SARIF construct; useful to confirm
  the fields the chrysa parser *skips* (artifact `index`, `logicalLocations`,
  `codeFlows`, `fixes`, `suppressions`, `partialFingerprints`).
- **portable snippet (n/a — C#): conceptual field checklist to harden the TS types:**
  ```
  result.rule / result.ruleIndex        // ruleId may be an index into tool.driver.rules
  result.locations[].physicalLocation.artifactLocation.index  // → run.artifacts[]
  result.suppressions[]                 // a suppressed result should NOT squiggle
  result.partialFingerprints           // stable identity across runs (dedupe)
  ```
- **integration steps:** (1) for JS, don't port this — depend on the `sarif` npm package
  for `@types` (`import { Log } from "sarif"`) instead of the hand-rolled subset
  interfaces, to stay spec-complete for free; (2) honor `result.suppressions` so
  baselined findings don't render; (3) use `partialFingerprints` to keep diagnostics
  stable when line numbers shift.
- **gotchas:** it's the .NET SDK — **reimplement conceptually, copy nothing verbatim**
  (language mismatch, not a licence issue). The live spec + the `sarif` npm types are the
  practical artifacts to consume.

---

## Cross-cutting takeaways

1. **Depend on the `sarif` npm types** instead of the hand-rolled subset in
   `extension.ts` — spec-complete, MIT, zero runtime cost.
2. **Two real bugs to fix,** both confirmed by the Microsoft refs: (a) `artifactLocation.index`
   into `run.artifacts[]` is ignored → such findings silently dropped; (b) `enabled=false`
   early-return in `activate()` never re-activates on config flip (vscode-eslint handles this).
3. **Highest-value feature to lift:** SARIF `relatedLocations` → `Diagnostic.relatedInformation`
   (from sarif-vscode-extension) so an N+1 finding links query-site ↔ loop.

**Licence summary:** all 4 sources MIT → **all permissive, copiable** (sarif-sdk is C#, so
reimplement rather than copy for language reasons, not licence). No copyleft/restrictive refs.
