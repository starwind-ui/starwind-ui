import assert from "node:assert/strict";
import { readFile, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import adapter from "@sveltejs/adapter-node";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

const root = await realpath(process.cwd());
// SvelteKit 3 has no svelte.config.js. Its options go to the sveltekit() plugin, as in `sv create`.
// The repository type check reads every .ts file under scripts, so this config stays JavaScript.
// It has no ssr.noExternal, as in a real project. vite-plugin-svelte bundles the Svelte adapter,
// and adapter-node 6 bundles the Runtime because the project does not declare it.
export default defineConfig({
  cacheDir: path.join(root, ".vite"),
  plugins: [
    sveltekit({
      compilerOptions: {
        runes: ({ filename }) =>
          filename.split(/[/\\]/).includes("node_modules") ? undefined : true,
      },
      adapter: adapter({ precompress: false }),
    }),
    {
      name: "packed-provenance",
      async generateBundle(options) {
        const modules = [];
        for (const id of this.getModuleIds()) {
          if (id.startsWith("\0")) continue;
          const file = id.split("?")[0];
          if (!path.isAbsolute(file)) continue;
          const resolved = await realpath(file);
          assert.ok(resolved.startsWith(root + path.sep), "Build escaped consumer: " + resolved);
          modules.push(resolved);
        }
        // Kit runs distinct server and client builds. Retain both graphs.
        const target = options.dir?.includes("/client") ? "client" : "server";
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
});
