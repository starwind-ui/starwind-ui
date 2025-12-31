import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import astro from "eslint-plugin-astro";
import prettier from "eslint-plugin-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

// parsers
const tsParser = tseslint.parser;
const astroParser = astro.parser;

export default defineConfig([
  // Global configuration
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  // Base configs
  js.configs.recommended,
  tseslint.configs.recommended,

  // Apps folder configuration - ensure this comes before more specific rules
  {
    files: ["apps/**/*.{ts,js,tsx,json,astro}"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // packages folder configuration
  {
    files: ["packages/**/*.{ts,js,tsx,json,astro}"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // json files
  {
    files: ["**/*.json"],
    rules: {
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },

  // Prettier config
  {
    plugins: {
      prettier: prettier,
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "prettier/prettier": "off", // this gets incredibly annoying otherwise
      "simple-import-sort/imports": "warn",
      "simple-import-sort/exports": "warn",
    },
  },

  // astro setup
  astro.configs.recommended,
  astro.configs["jsx-a11y-recommended"],
  {
    files: ["**/*.astro"],
    languageOptions: {
      parser: astroParser,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: [".astro"],
        sourceType: "module",
        ecmaVersion: "latest",
        project: "./tsconfig.json",
      },
    },
    rules: {
      "no-undef": "off", // Disable "not defined" errors for specific Astro types that are globally available (ImageMetadata)
      "astro/jsx-a11y/no-noninteractive-tabindex": "off",
      "@typescript-eslint/no-explicit-any": "off", // you may want this as it can get annoying
      "astro/jsx-a11y/anchor-is-valid": "off", // ignore since some demos use invalid anchors
    },
  },

  // Ignore patterns - putting this early to ensure it applies to all configs
  {
    ignores: ["**/*/dist/**", "**/*.d.ts", ".tours/", "scripts/", ".github/", ".changeset/"],
  },
]);
