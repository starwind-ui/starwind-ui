import { defineConfig } from "eslint/config";
import astro from "eslint-plugin-astro";

const astroA11yConfigs = astro.configs["flat/jsx-a11y-recommended"].map((config) => ({
  ...config,
  files: config.files ?? ["**/*.astro"],
  rules: Object.fromEntries(
    Object.entries(config.rules ?? {}).filter(([ruleName]) =>
      ruleName.startsWith("astro/jsx-a11y/"),
    ),
  ),
}));

export default defineConfig([
  {
    ignores: [
      "**/*/dist/**",
      "**/*/node_modules/**",
      "**/*/.astro/**",
      "**/*.d.ts",
      "**/.turbo/**",
      ".tours/",
      ".github/",
      ".changeset/",
      ".agent/**",
      ".windsurf/**",
      "ai-context/**",
    ],
  },
  ...astroA11yConfigs,
  {
    files: ["**/*.astro"],
    rules: {
      // Some demos intentionally use placeholder anchors.
      "astro/jsx-a11y/anchor-is-valid": "off",
      // Existing component patterns include managed tabindex behavior.
      "astro/jsx-a11y/no-noninteractive-tabindex": "off",
    },
  },
]);
