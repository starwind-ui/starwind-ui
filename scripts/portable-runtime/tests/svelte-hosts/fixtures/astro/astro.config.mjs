import assert from "node:assert/strict";
import { realpath, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
const root = await realpath(process.cwd());
export default defineConfig({
  output: "static",
  integrations: [svelte()],
  vite: {
    cacheDir: path.join(root, ".vite"),
    ssr: { noExternal: ["@starwind-ui/svelte", "@starwind-ui/runtime"] },
    plugins: [
      {
        name: "packed-provenance",
        async generateBundle() {
          const modules = [];
          for (const id of this.getModuleIds()) {
            if (id.startsWith("\0")) continue;
            const file = id.split("?")[0];
            if (!path.isAbsolute(file)) continue;
            const resolved = await realpath(file);
            assert.ok(resolved.startsWith(root + path.sep), "Build escaped consumer: " + resolved);
            modules.push(resolved);
          }
          const target = this.environment.config.consumer === "server" ? "server" : "client";
          await writeFile(`build-${target}-provenance.json`, JSON.stringify(modules.sort()));
          let previous = [];
          try {
            previous = JSON.parse(await readFile("build-provenance.json", "utf8"));
          } catch (error) {
            if (error.code !== "ENOENT") throw error;
          }
          await writeFile(
            "build-provenance.json",
            JSON.stringify([...new Set([...previous, ...modules])].sort()),
          );
        },
      },
    ],
  },
});
