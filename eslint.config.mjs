import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tseslint from "typescript-eslint";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // Ignore build artifacts and node_modules
  {
    ignores: [
      "node_modules",
      "dist",
      "infra/cdk.out",
      "infra/node_modules",
      "infra/coverage",
      "coverage",
      "output.json",
      "**/*.d.ts",
      "bin/**",
      "infra/bin",
      "infra/lib/**/*.js",
    ],
  },

  // Test files - Jest Globals and rules
  {
    files: ["**/*.test.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    plugins: {
      js,
      "@typescript-eslint": tsPlugin,
    },
  },

  // TypeScript rules
  tseslint.configs.recommended,

  // JS + TS settings
  {
    files: ["**/*.{js,mjs,ts}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: { ...globals.node },
    },
    plugins: {
      js,
      "@typescript-eslint": tsPlugin,
    },
    extends: [
      // Core JS rules
      "js/recommended",
    ],
    rules: {
      "no-trailing-spaces": "error",
      "max-len": ["error", { "code": 100, "ignoreUrls": true }],
    },
  },
]);
