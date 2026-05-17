import * as path from "path";
import { runTests } from "@vscode/test-electron";

async function main(): Promise<void> {
  const extensionDevelopmentPath = path.resolve(__dirname, "../../");
  const extensionTestsPath = path.resolve(__dirname, "./unit/");

  await runTests({ extensionDevelopmentPath, extensionTestsPath });
}

main().catch((err: unknown) => {
  console.error("Test run failed:", err);
  process.exit(1);
});
