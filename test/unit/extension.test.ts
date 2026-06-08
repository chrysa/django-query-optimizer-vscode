import * as assert from "assert";
import * as path from "path";
import * as vscode from "vscode";

const EXTENSION_ID = "chrysa.django-query-optimizer";

/** Poll `predicate` until true or the timeout elapses. */
async function waitFor(
  predicate: () => boolean,
  timeoutMs = 10000,
  intervalMs = 100,
): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error("waitFor: timed out");
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

function modelsUri(): vscode.Uri {
  const root = vscode.workspace.workspaceFolders![0].uri.fsPath;
  return vscode.Uri.file(path.join(root, "models.py"));
}

function diagnosticsForModels(): vscode.Diagnostic[] {
  return vscode.languages.getDiagnostics(modelsUri());
}

suite("extension integration", () => {
  suiteSetup(async () => {
    const ext = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(ext, `extension ${EXTENSION_ID} not found`);
    await ext!.activate();
    assert.strictEqual(ext!.isActive, true);
  });

  test("loads SARIF findings from the workspace on activation", async () => {
    await waitFor(() => diagnosticsForModels().length >= 2);
    const diags = diagnosticsForModels();
    assert.strictEqual(diags.length, 2);
    assert.ok(diags.some((d) => d.severity === vscode.DiagnosticSeverity.Error));
    assert.ok(diags.some((d) => d.severity === vscode.DiagnosticSeverity.Warning));
    assert.ok(diags.every((d) => d.source === "django-query-optimizer"));
  });

  test("reload command republishes diagnostics", async () => {
    await vscode.commands.executeCommand("djangoQueryOptimizer.reload");
    await waitFor(() => diagnosticsForModels().length >= 2);
    assert.strictEqual(diagnosticsForModels().length, 2);
  });

  test("clear command removes all diagnostics", async () => {
    await vscode.commands.executeCommand("djangoQueryOptimizer.clear");
    await waitFor(() => diagnosticsForModels().length === 0);
    assert.strictEqual(diagnosticsForModels().length, 0);
  });

  test("reload after clear restores diagnostics", async () => {
    await vscode.commands.executeCommand("djangoQueryOptimizer.reload");
    await waitFor(() => diagnosticsForModels().length >= 2);
    assert.strictEqual(diagnosticsForModels().length, 2);
  });

  test("updating the sarifPattern setting restarts the watcher", async () => {
    const config = vscode.workspace.getConfiguration("djangoQueryOptimizer");
    await config.update(
      "sarifPattern",
      "**/*.sarif",
      vscode.ConfigurationTarget.Workspace,
    );
    await waitFor(() => diagnosticsForModels().length >= 2);
    assert.strictEqual(diagnosticsForModels().length, 2);
    await config.update(
      "sarifPattern",
      undefined,
      vscode.ConfigurationTarget.Workspace,
    );
  });
});
