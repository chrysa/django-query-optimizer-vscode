// Flat config (ESLint v9+). The repo pins eslint ^10, which dropped support for
// .eslintrc and the --ext flag; file matching is declared here via `files`.
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  { ignores: ["out/**", "dist/**", "node_modules/**", "**/*.d.ts"] },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: "module",
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: { ...tsPlugin.configs.recommended.rules },
  },
];
