/**
 * Django Query Optimizer — VS Code extension
 *
 * Reads SARIF 2.1.0 files produced by `pytest --query-analysis --sarif-output`
 * and surfaces the ORM findings as VS Code diagnostics (squiggles + Problems panel).
 *
 * Activation: workspaceContains:**‌/*.sarif
 *
 * Architecture:
 *   SarifParser    — pure SARIF → Diagnostic conversion (no VS Code deps)
 *   SarifWatcher   — FileSystemWatcher that triggers parse + publish on change
 *   DiagnosticsHub — owns the DiagnosticCollection, dispatches per-file sets
 *   StatusBarItem  — shows total finding count
 */

import * as path from "path";
import * as vscode from "vscode";

// ── SARIF types (subset of the 2.1.0 spec) ───────────────────────────────────

interface SarifRegion {
  startLine?: number;
  startColumn?: number;
  endLine?: number;
  endColumn?: number;
}

interface SarifPhysicalLocation {
  artifactLocation?: { uri?: string; uriBaseId?: string };
  region?: SarifRegion;
}

interface SarifLocation {
  physicalLocation?: SarifPhysicalLocation;
}

interface SarifResult {
  ruleId?: string;
  level?: "error" | "warning" | "note" | "none";
  message?: { text?: string };
  locations?: SarifLocation[];
}

interface SarifRun {
  tool?: { driver?: { name?: string; version?: string } };
  results?: SarifResult[];
  originalUriBaseIds?: Record<string, { uri?: string }>;
}

interface SarifDocument {
  version?: string;
  runs?: SarifRun[];
}

// ── Parsing ──────────────────────────────────────────────────────────────────

const LEVEL_TO_SEVERITY: Record<string, vscode.DiagnosticSeverity> = {
  error: vscode.DiagnosticSeverity.Error,
  warning: vscode.DiagnosticSeverity.Warning,
  note: vscode.DiagnosticSeverity.Information,
  none: vscode.DiagnosticSeverity.Hint,
};

export interface ParsedFinding {
  /** Workspace-relative or absolute URI string */
  fileUri: string;
  diagnostic: vscode.Diagnostic;
}

/**
 * Convert a SARIF result level string to a VS Code DiagnosticSeverity.
 * Defaults to Warning when the level is absent or unknown.
 */
function toSeverity(level: string | undefined): vscode.DiagnosticSeverity {
  return LEVEL_TO_SEVERITY[level ?? "warning"] ?? vscode.DiagnosticSeverity.Warning;
}

/**
 * Build a zero-based VS Code Range from an optional SARIF region.
 * Falls back to line 0, column 0 when no region is provided.
 */
function toRange(region: SarifRegion | undefined): vscode.Range {
  const startLine = Math.max(0, (region?.startLine ?? 1) - 1);
  const startCol = Math.max(0, (region?.startColumn ?? 1) - 1);
  const endLine = Math.max(startLine, (region?.endLine ?? region?.startLine ?? 1) - 1);
  const endCol = region?.endColumn != null ? Math.max(0, region.endColumn - 1) : startCol;
  return new vscode.Range(startLine, startCol, endLine, endCol);
}

/**
 * Resolve a SARIF artifact URI to an absolute filesystem URI string.
 *
 * Resolution order:
 * 1. Absolute `file://` URI → used as-is.
 * 2. Path with `uriBaseId = "%SRCROOT%"` → resolved against the workspace root.
 * 3. Any other relative path → resolved against `sarifFileDir`.
 */
function resolveUri(
  uri: string,
  uriBaseId: string | undefined,
  sarifFileDir: string,
  workspaceRoot: string | undefined,
  originalUriBaseIds: Record<string, { uri?: string }> | undefined,
): string {
  if (uri.startsWith("file://")) {
    return uri;
  }

  // Expand a named base ID if it maps to an absolute URI
  if (uriBaseId && originalUriBaseIds?.[uriBaseId]?.uri) {
    const base = originalUriBaseIds[uriBaseId].uri!;
    return vscode.Uri.file(path.resolve(base.replace(/^file:\/\//, ""), uri)).toString();
  }

  // %SRCROOT% → workspace root (django-query-optimizer convention)
  if (uriBaseId === "%SRCROOT%" && workspaceRoot) {
    return vscode.Uri.file(path.resolve(workspaceRoot, uri)).toString();
  }

  // Relative path → resolve against the SARIF file's directory
  return vscode.Uri.file(path.resolve(sarifFileDir, uri)).toString();
}

/**
 * Parse a SARIF 2.1.0 JSON string into a list of {@link ParsedFinding}s.
 *
 * @param json         Raw SARIF JSON text.
 * @param sarifFilePath Absolute path to the SARIF file (used for relative URI resolution).
 * @param workspaceRoot Absolute path to the workspace root (used for %SRCROOT% resolution).
 */
export function parseSarif(
  json: string,
  sarifFilePath: string,
  workspaceRoot: string | undefined,
): ParsedFinding[] {
  let doc: SarifDocument;
  try {
    doc = JSON.parse(json) as SarifDocument;
  } catch {
    return [];
  }

  if (!Array.isArray(doc.runs)) {
    return [];
  }

  const sarifDir = path.dirname(sarifFilePath);
  const findings: ParsedFinding[] = [];

  for (const run of doc.runs) {
    const baseIds = run.originalUriBaseIds;
    for (const result of run.results ?? []) {
      const message = result.message?.text ?? result.ruleId ?? "ORM issue detected";
      const severity = toSeverity(result.level);

      const location = result.locations?.[0]?.physicalLocation;
      const artifactUri = location?.artifactLocation?.uri;

      if (!artifactUri) {
        // No location info — attach to a virtual "unknown" file so it still appears
        const range = new vscode.Range(0, 0, 0, 0);
        const diag = new vscode.Diagnostic(range, message, severity);
        diag.source = "django-query-optimizer";
        diag.code = result.ruleId;
        findings.push({ fileUri: vscode.Uri.file(sarifFilePath).toString(), diagnostic: diag });
        continue;
      }

      const fileUri = resolveUri(
        artifactUri,
        location?.artifactLocation?.uriBaseId,
        sarifDir,
        workspaceRoot,
        baseIds,
      );

      const range = toRange(location?.region);
      const diag = new vscode.Diagnostic(range, message, severity);
      diag.source = "django-query-optimizer";
      diag.code = result.ruleId;

      findings.push({ fileUri, diagnostic: diag });
    }
  }

  return findings;
}

// ── DiagnosticsHub ────────────────────────────────────────────────────────────

/**
 * Owns the VS Code DiagnosticCollection and groups diagnostics by file URI.
 */
class DiagnosticsHub implements vscode.Disposable {
  private readonly _collection: vscode.DiagnosticCollection;

  constructor() {
    this._collection = vscode.languages.createDiagnosticCollection("django-query-optimizer");
  }

  /** Replace all diagnostics with the new set of findings. */
  publish(findings: ParsedFinding[]): void {
    this._collection.clear();
    const byFile = new Map<string, vscode.Diagnostic[]>();
    for (const { fileUri, diagnostic } of findings) {
      const existing = byFile.get(fileUri) ?? [];
      existing.push(diagnostic);
      byFile.set(fileUri, existing);
    }
    for (const [uri, diags] of byFile) {
      this._collection.set(vscode.Uri.parse(uri), diags);
    }
  }

  /** Total number of diagnostics currently published. */
  get count(): number {
    let total = 0;
    this._collection.forEach((_uri, diags) => (total += diags.length));
    return total;
  }

  clear(): void {
    this._collection.clear();
  }

  dispose(): void {
    this._collection.dispose();
  }
}

// ── Status bar ────────────────────────────────────────────────────────────────

class QueryOptimizerStatusBar implements vscode.Disposable {
  private readonly _item: vscode.StatusBarItem;

  constructor() {
    this._item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this._item.command = "djangoQueryOptimizer.reload";
    this._item.tooltip = "Django Query Optimizer — click to reload SARIF files";
  }

  update(count: number, loading = false): void {
    if (loading) {
      this._item.text = "$(loading~spin) DQO";
      this._item.show();
      return;
    }
    if (count === 0) {
      this._item.text = "$(check) DQO";
    } else {
      this._item.text = `$(warning) DQO: ${count}`;
    }
    this._item.show();
  }

  hide(): void {
    this._item.hide();
  }

  dispose(): void {
    this._item.dispose();
  }
}

// ── SarifWatcher ─────────────────────────────────────────────────────────────

class SarifWatcher implements vscode.Disposable {
  private _watcher: vscode.FileSystemWatcher | undefined;
  private readonly _disposables: vscode.Disposable[] = [];

  constructor(
    private readonly _hub: DiagnosticsHub,
    private readonly _statusBar: QueryOptimizerStatusBar,
    private readonly _outputChannel: vscode.OutputChannel,
  ) {}

  start(pattern: string): void {
    this._watcher?.dispose();
    this._watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(
        vscode.workspace.workspaceFolders?.[0] ?? "",
        pattern,
      ),
    );
    this._disposables.push(
      this._watcher.onDidCreate((uri) => this._onSarifChange(uri)),
      this._watcher.onDidChange((uri) => this._onSarifChange(uri)),
      this._watcher.onDidDelete(() => this._onSarifDelete()),
    );
    // Initial load of existing files
    void this._loadAll(pattern);
  }

  private async _loadAll(pattern: string): Promise<void> {
    const files = await vscode.workspace.findFiles(pattern);
    if (files.length === 0) {
      return;
    }
    const allFindings: ParsedFinding[] = [];
    for (const uri of files) {
      allFindings.push(...(await this._parseSarifFile(uri)));
    }
    this._hub.publish(allFindings);
    this._statusBar.update(this._hub.count);
  }

  private async _onSarifChange(uri: vscode.Uri): Promise<void> {
    this._statusBar.update(0, true);
    this._outputChannel.appendLine(`[DQO] Reloading ${uri.fsPath}`);
    const pattern = this._currentPattern();
    await this._loadAll(pattern);
  }

  private _onSarifDelete(): void {
    this._hub.clear();
    this._statusBar.update(0);
    this._outputChannel.appendLine("[DQO] SARIF file deleted — diagnostics cleared");
  }

  private async _parseSarifFile(uri: vscode.Uri): Promise<ParsedFinding[]> {
    try {
      const bytes = await vscode.workspace.fs.readFile(uri);
      const json = Buffer.from(bytes).toString("utf-8");
      const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      return parseSarif(json, uri.fsPath, root);
    } catch (err) {
      this._outputChannel.appendLine(`[DQO] Error reading ${uri.fsPath}: ${String(err)}`);
      return [];
    }
  }

  private _currentPattern(): string {
    return vscode.workspace
      .getConfiguration("djangoQueryOptimizer")
      .get<string>("sarifPattern", "**/*.sarif");
  }

  async reload(): Promise<void> {
    this._statusBar.update(0, true);
    await this._loadAll(this._currentPattern());
    this._statusBar.update(this._hub.count);
  }

  dispose(): void {
    this._watcher?.dispose();
    this._disposables.forEach((d) => d.dispose());
  }
}

// ── Extension entry points ────────────────────────────────────────────────────

export function activate(context: vscode.ExtensionContext): void {
  const enabled = vscode.workspace
    .getConfiguration("djangoQueryOptimizer")
    .get<boolean>("enabled", true);
  if (!enabled) {
    return;
  }

  const outputChannel = vscode.window.createOutputChannel("Django Query Optimizer");
  const hub = new DiagnosticsHub();
  const statusBar = new QueryOptimizerStatusBar();
  const watcher = new SarifWatcher(hub, statusBar, outputChannel);

  const pattern = vscode.workspace
    .getConfiguration("djangoQueryOptimizer")
    .get<string>("sarifPattern", "**/*.sarif");

  watcher.start(pattern);

  context.subscriptions.push(
    outputChannel,
    hub,
    statusBar,
    watcher,
    vscode.commands.registerCommand("djangoQueryOptimizer.reload", async () => {
      await watcher.reload();
      outputChannel.appendLine(`[DQO] Manual reload — ${hub.count} finding(s)`);
    }),
    vscode.commands.registerCommand("djangoQueryOptimizer.clear", () => {
      hub.clear();
      statusBar.update(0);
      outputChannel.appendLine("[DQO] Diagnostics cleared");
    }),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("djangoQueryOptimizer")) {
        const newPattern = vscode.workspace
          .getConfiguration("djangoQueryOptimizer")
          .get<string>("sarifPattern", "**/*.sarif");
        watcher.start(newPattern);
      }
    }),
  );
}

export function deactivate(): void {
  // Disposables registered via context.subscriptions are cleaned up automatically.
}
