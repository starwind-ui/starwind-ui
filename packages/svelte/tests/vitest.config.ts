import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [svelte({ hot: false })],
  resolve: {
    conditions: ["svelte"],
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
