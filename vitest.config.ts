/// <reference types="vitest" />

import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: {
    // Vitest configuration options
    globals: true,
    environment: "node",
    typecheck: {
      tsconfig: "./tsconfig.json",
    },
    // Include all test files in the tests directory
    include: ["tests/**/*.ts"],
  },
});
