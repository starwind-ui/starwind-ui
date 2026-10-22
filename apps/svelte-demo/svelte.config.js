import { readdirSync } from "node:fs";

import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    // Check the Runtime source so strict JavaScript checks do not inspect bundled output.
    alias: {
      ...Object.fromEntries(
        readdirSync(new URL("../../packages/runtime/src/components/", import.meta.url), {
          withFileTypes: true,
        })
          .filter((entry) => entry.isDirectory())
          .map((entry) => [
            `@starwind-ui/runtime/${entry.name}`,
            `../../packages/runtime/src/components/${entry.name}/index.ts`,
          ]),
      ),
      "@starwind-ui/runtime/theme": "../../packages/runtime/src/theme/theme.ts",
      "@starwind-ui/runtime": "../../packages/runtime/src/index.ts",
    },
  },
};
export default config;
