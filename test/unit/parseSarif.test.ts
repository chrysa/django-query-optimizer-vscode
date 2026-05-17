import * as assert from "assert";
import * as path from "path";
import * as vscode from "vscode";
import { parseSarif } from "../../src/extension";

const WORKSPACE_ROOT = "/workspace/myproject";
const SARIF_FILE = path.join(WORKSPACE_ROOT, "query-results.sarif");

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSarif(results: object[], toolName = "django-query-optimizer"): string {
  return JSON.stringify({
    version: "2.1.0",
    runs: [
      {
        tool: { driver: { name: toolName, version: "0.1.0" } },
        results,
      },
    ],
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

suite("parseSarif", () => {
  test("returns empty array for empty SARIF", () => {
    const findings = parseSarif(makeSarif([]), SARIF_FILE, WORKSPACE_ROOT);
    assert.strictEqual(findings.length, 0);
  });

  test("returns empty array for invalid JSON", () => {
    const findings = parseSarif("not json", SARIF_FILE, WORKSPACE_ROOT);
    assert.strictEqual(findings.length, 0);
  });

  test("returns empty array when runs is missing", () => {
    const findings = parseSarif(JSON.stringify({ version: "2.1.0" }), SARIF_FILE, WORKSPACE_ROOT);
    assert.strictEqual(findings.length, 0);
  });

  test("maps error level to DiagnosticSeverity.Error", () => {
    const sarif = makeSarif([
      {
        ruleId: "n_plus_1",
        level: "error",
        message: { text: "N+1 detected" },
        locations: [
          {
            physicalLocation: {
              artifactLocation: { uri: "views/orders.py", uriBaseId: "%SRCROOT%" },
              region: { startLine: 42 },
            },
          },
        ],
      },
    ]);
    const findings = parseSarif(sarif, SARIF_FILE, WORKSPACE_ROOT);
    assert.strictEqual(findings.length, 1);
    assert.strictEqual(findings[0].diagnostic.severity, vscode.DiagnosticSeverity.Error);
  });

  test("maps warning level to DiagnosticSeverity.Warning", () => {
    const sarif = makeSarif([
      {
        ruleId: "slow_query",
        level: "warning",
        message: { text: "Slow query" },
        locations: [
          {
            physicalLocation: {
              artifactLocation: { uri: "views/orders.py", uriBaseId: "%SRCROOT%" },
              region: { startLine: 10 },
            },
          },
        ],
      },
    ]);
    const findings = parseSarif(sarif, SARIF_FILE, WORKSPACE_ROOT);
    assert.strictEqual(findings[0].diagnostic.severity, vscode.DiagnosticSeverity.Warning);
  });

  test("maps note level to DiagnosticSeverity.Information", () => {
    const sarif = makeSarif([
      {
        ruleId: "duplicate_query",
        level: "note",
        message: { text: "Duplicate query" },
      },
    ]);
    const findings = parseSarif(sarif, SARIF_FILE, WORKSPACE_ROOT);
    assert.strictEqual(findings[0].diagnostic.severity, vscode.DiagnosticSeverity.Information);
  });

  test("defaults to Warning for unknown level", () => {
    const sarif = makeSarif([{ ruleId: "x", level: "unknown_level", message: { text: "msg" } }]);
    const findings = parseSarif(sarif, SARIF_FILE, WORKSPACE_ROOT);
    assert.strictEqual(findings[0].diagnostic.severity, vscode.DiagnosticSeverity.Warning);
  });

  test("resolves %SRCROOT% URI against workspace root", () => {
    const sarif = makeSarif([
      {
        ruleId: "n_plus_1",
        level: "error",
        message: { text: "N+1" },
        locations: [
          {
            physicalLocation: {
              artifactLocation: { uri: "api/views.py", uriBaseId: "%SRCROOT%" },
              region: { startLine: 5 },
            },
          },
        ],
      },
    ]);
    const findings = parseSarif(sarif, SARIF_FILE, WORKSPACE_ROOT);
    assert.ok(findings[0].fileUri.includes("api/views.py"), `URI: ${findings[0].fileUri}`);
  });

  test("resolves relative URI against SARIF file directory", () => {
    const sarif = makeSarif([
      {
        ruleId: "slow_query",
        level: "warning",
        message: { text: "Slow" },
        locations: [
          {
            physicalLocation: {
              artifactLocation: { uri: "app/models.py" },
              region: { startLine: 1 },
            },
          },
        ],
      },
    ]);
    const findings = parseSarif(sarif, SARIF_FILE, WORKSPACE_ROOT);
    assert.ok(findings[0].fileUri.includes("app/models.py"));
  });

  test("result with no location attaches diagnostic to the SARIF file", () => {
    const sarif = makeSarif([{ ruleId: "n_plus_1", level: "error", message: { text: "N+1" } }]);
    const findings = parseSarif(sarif, SARIF_FILE, WORKSPACE_ROOT);
    assert.strictEqual(findings.length, 1);
    assert.ok(findings[0].fileUri.includes("query-results.sarif"));
  });

  test("sets diagnostic.source to 'django-query-optimizer'", () => {
    const sarif = makeSarif([{ ruleId: "slow_query", level: "warning", message: { text: "Slow" } }]);
    const findings = parseSarif(sarif, SARIF_FILE, WORKSPACE_ROOT);
    assert.strictEqual(findings[0].diagnostic.source, "django-query-optimizer");
  });

  test("sets diagnostic.code to ruleId", () => {
    const sarif = makeSarif([{ ruleId: "missing_select_related", level: "warning", message: { text: "FK" } }]);
    const findings = parseSarif(sarif, SARIF_FILE, WORKSPACE_ROOT);
    assert.strictEqual(findings[0].diagnostic.code, "missing_select_related");
  });

  test("builds correct range from SARIF region (1-based → 0-based)", () => {
    const sarif = makeSarif([
      {
        ruleId: "n_plus_1",
        level: "error",
        message: { text: "N+1" },
        locations: [
          {
            physicalLocation: {
              artifactLocation: { uri: "views.py", uriBaseId: "%SRCROOT%" },
              region: { startLine: 10, startColumn: 5, endLine: 10, endColumn: 20 },
            },
          },
        ],
      },
    ]);
    const findings = parseSarif(sarif, SARIF_FILE, WORKSPACE_ROOT);
    const range = findings[0].diagnostic.range;
    assert.strictEqual(range.start.line, 9);
    assert.strictEqual(range.start.character, 4);
    assert.strictEqual(range.end.line, 9);
    assert.strictEqual(range.end.character, 19);
  });

  test("handles multiple runs", () => {
    const doc = {
      version: "2.1.0",
      runs: [
        {
          tool: { driver: { name: "dqo" } },
          results: [{ ruleId: "r1", level: "error", message: { text: "m1" } }],
        },
        {
          tool: { driver: { name: "dqo" } },
          results: [{ ruleId: "r2", level: "warning", message: { text: "m2" } }],
        },
      ],
    };
    const findings = parseSarif(JSON.stringify(doc), SARIF_FILE, WORKSPACE_ROOT);
    assert.strictEqual(findings.length, 2);
  });

  test("handles multiple results in one run", () => {
    const sarif = makeSarif([
      { ruleId: "r1", level: "error", message: { text: "m1" } },
      { ruleId: "r2", level: "warning", message: { text: "m2" } },
      { ruleId: "r3", level: "note", message: { text: "m3" } },
    ]);
    const findings = parseSarif(sarif, SARIF_FILE, WORKSPACE_ROOT);
    assert.strictEqual(findings.length, 3);
  });
});
