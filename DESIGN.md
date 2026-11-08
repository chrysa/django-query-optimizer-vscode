# django-query-optimizer-vscode — Design contract

> Contract for the extension's surfaces inside VS Code: editor diagnostics, the Problems panel,
> a status bar item, two palette commands, an output channel and two settings. Rule:
> [standards/rules/design.md](standards/rules/design.md); method and acceptance criteria:
> the shared-standards *DESIGN-CONTRACT* guide. Read it before changing what the extension shows,
> says or contributes; update it in the same change.
>
> Status: **[implemented]** links the code · **[decided]** names the decision · **[proposed]**
> is not agreed. This file documents the current surface; it does not redesign it.

## 1. Surface and status

- **Surface:** editor extension. It uses only native host UI: a `DiagnosticCollection`
  (squiggles + Problems panel), one status bar item, commands, an output channel and
  configuration. No webview, tree view, panel or custom editor. **[implemented]**
  ([extension.ts](src/extension.ts), [package.json](package.json))
- **Lifecycle:** prototype — version `0.1.0`, README status *pre-alpha*, not published to the
  Marketplace (install from a local `.vsix`, see [README.md](README.md)).
- **Detailed specs:** none.

## 2. Users, devices and priority tasks

| User | Context and device | Priority tasks |
| ---- | ------------------ | -------------- |
| Django developer | VS Code ≥ 1.90 on the desktop, after `pytest --query-analysis --sarif-output` | 1. see ORM findings at the line that caused them · 2. know how many findings are open · 3. reload or clear them after a test run |

Primary action: read the squiggle or the Problems entry and jump to the source line (host
behaviour). Secondary: click the status bar item to reload. **[implemented]**

## 3. Journeys and navigation

- **J1 — See findings after a test run:** pytest writes a `.sarif` file → the extension
  activates on `workspaceContains:**/*.sarif` → findings appear as diagnostics with source
  `django-query-optimizer` and the rule id as code; the status bar shows the count.
  **[implemented]** Failure: an unreadable file is logged to the output channel; invalid JSON is
  dropped silently (see §11).
- **J2 — Re-run and refresh:** the file watcher reloads every matching file on create, change or
  delete; the status bar shows a spinner meanwhile. **[implemented]**
- **J3 — Reload or clear by hand:** *Django Query Optimizer: Reload SARIF files* (also the status
  bar click) and *Django Query Optimizer: Clear all diagnostics* in the Command Palette.
  **[implemented]**
- **Information architecture:** no own view; findings live where VS Code puts every linter
  result (editor, Problems panel, hover). A finding without a location is attached to the SARIF
  file itself, line 1. **[implemented]**
- **Density:** one diagnostic per SARIF result, message text as given by the report.

## 4. Identity

The host's identity: no colours, fonts or theme contributions. The only own asset is the
Marketplace icon ([media/icon.png](media/icon.png)). **[implemented]** Keep it that way: a
brand must not fight the editor (editor-extension row of the shared-standards
*DESIGN-CONTRACT* guide).

## 5. Tokens and components (owned elsewhere)

| Concern | Source of truth | Rules of use |
| ------- | --------------- | ------------ |
| Colours, fonts, severity rendering | the user's VS Code theme | never hard-code a colour; map severity to `DiagnosticSeverity` |
| Severity mapping | `LEVEL_TO_SEVERITY` in [extension.ts](src/extension.ts) | `error` → Error, `warning` → Warning, `note` → Information, `none` → Hint; unknown → Warning |
| Status bar icons | built-in codicons `$(loading~spin)`, `$(check)`, `$(warning)` | product icons only; text always next to them |
| Command and setting names | `contributes` in [package.json](package.json) | titles prefixed `Django Query Optimizer:` |

- **Shared contract:** not applicable (no web content); `@chrysa/ui` not used.
- **Design debt and drift:** the status bar text uses the abbreviation `DQO`.

## 6. Interaction and states

- **Action feedback:** reload shows a spinner, then the count; each reload, deletion and error is
  logged to the *Django Query Optimizer* output channel. **[implemented]**
- **Data states:**

  | State | Where it appears | Behaviour |
  | ----- | ---------------- | --------- |
  | Loading | status bar | `$(loading~spin) DQO` while files are parsed **[implemented]** |
  | Empty | status bar | `$(check) DQO` when no finding is published **[implemented]** |
  | Error | output channel | read errors logged; invalid JSON or missing `runs` returns no finding without a message **[known gap]** |
  | Offline / unreachable | — | not applicable (local files) |
  | Stale data | — | the age of the SARIF file is not shown **[known gap]** |
  | Reconnect | — | not applicable |

- **Real-time:** diagnostics are replaced as a set on every watcher event; the host keeps the
  editor cursor, selection and scroll. **[implemented]**
- **Motion:** only the host's spinner codicon. No entrance motion is imposed in a native host.

## 7. Responsive and support conventions

Follow VS Code conventions: diagnostics instead of custom decorations, Command Palette titles
with a category prefix, settings under `djangoQueryOptimizer.*`, one output channel. Only the
first workspace folder is watched (multi-root not supported). No browser layout or webview should
be added for what the Problems panel already shows.

## 8. Accessibility

- **Target:** the host's accessibility model (VS Code screen-reader mode, accessible diagnostics
  navigation with `F8`); no web contrast numbers apply.
- **Keyboard:** every action is a command, reachable from the Command Palette; no key binding is
  contributed.
- **Perception:** severity comes from the theme's diagnostic colours and icons; the status bar
  shows a number next to the icon.
- **Assistive technology:** the status bar item sets no `accessibilityInformation`, so a screen
  reader reads `DQO: 3` **[known gap]**. No screen-reader pass was run.

## 9. Assets

| Asset | Source or generator | Author | Licence and attribution | Permitted use | Formats and variants | Location |
| ----- | ------------------- | ------ | ----------------------- | ------------- | -------------------- | -------- |
| Extension icon | unknown (added in commit `c504c5f`, 2026-08-09) | unknown | unknown | Marketplace listing | PNG 128 × 128 | [media/icon.png](media/icon.png) |
| Codicons | provided by VS Code at run time | Microsoft | host-owned, not shipped here | status bar only | product icons | — |

Extension code licence: MIT ([LICENSE](LICENSE)).

## 10. Acceptance criteria and evidence

- **Criteria:** each SARIF result appears once at the right line and severity; the status bar
  count equals the number of published diagnostics; a broken SARIF file is reported, never shown
  as clean; reload and clear work from the palette; nothing is coloured outside the theme.
- **Tests:** [test/unit/parseSarif.test.ts](test/unit/parseSarif.test.ts) (mapping, ranges, URI
  resolution) and [test/unit/extension.test.ts](test/unit/extension.test.ts) (activation, reload,
  clear, setting change) run in a VS Code host via [.vscode-test.mjs](.vscode-test.mjs).
- **Evidence log:**

  | Date | Change | Checks run (tool, sizes, modes) | Result | Not run, and why |
  | ---- | ------ | ------------------------------- | ------ | ---------------- |
  | 2026-11-08 | contract written from the code | source review | gaps listed in §11 | no editor run: documentation-only change |

## 11. Open choices, known gaps and maintenance

- **Known gaps:**
  - Invalid JSON or a SARIF file without `runs` yields no finding and no log line, so the status
    bar can show `$(check)` for a broken report.
  - *Clear all diagnostics* sets the status bar to `$(check)`, which reads as "no findings".
  - `djangoQueryOptimizer.enabled` is read only at activation; turning it off later still
    restarts the watcher on a configuration change.
  - No stale-data cue, no `accessibilityInformation`, no code action for the suggested fix, only
    the first workspace folder.
  - The icon's provenance and licence are not recorded.
- **Open choices:** **[proposed]** log parse failures and show `$(error)` in the status bar;
  **[proposed]** a distinct "cleared" status text; **[proposed]** spell out the name in the
  tooltip and accessible label.
- **Maintenance:** the extension maintainer updates this file with any change to contributed
  commands, settings, status bar text or diagnostic mapping.
