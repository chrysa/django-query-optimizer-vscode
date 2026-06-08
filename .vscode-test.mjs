import { defineConfig } from "@vscode/test-cli";

// Test runner + coverage config for @vscode/test-cli.
// A fixture workspace is opened so the extension activates
// (workspaceContains:**/*.sarif) and the watcher/hub/status-bar run for real.
export default defineConfig({
  files: "out/test/**/*.test.js",
  workspaceFolder: "./test/fixtures",
  mocha: {
    ui: "tdd",
    timeout: 20000,
  },
  coverage: {
    includeAll: true,
    exclude: ["**/test/**", "**/.vscode-test.mjs"],
    reporter: ["text", "lcovonly"],
  },
});
