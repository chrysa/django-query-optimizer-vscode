// Mocha test runner entry point invoked by @vscode/test-electron.
// runTest.ts points extensionTestsPath here; VS Code loads the compiled
// out/test/unit/index.js and calls the exported run().
import * as fs from "fs";
import * as path from "path";
import Mocha from "mocha";

export function run(): Promise<void> {
  const mocha = new Mocha({ ui: "tdd", color: true });
  const testsRoot = __dirname;

  const files = fs
    .readdirSync(testsRoot)
    .filter((file) => file.endsWith(".test.js"));
  files.forEach((file) => mocha.addFile(path.join(testsRoot, file)));

  return new Promise((resolve, reject) => {
    try {
      mocha.run((failures) => {
        if (failures > 0) {
          reject(new Error(`${failures} test(s) failed.`));
        } else {
          resolve();
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}
