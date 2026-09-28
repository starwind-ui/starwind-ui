import assert from "node:assert/strict";
import { realpath, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { sveltekit } from "@sveltejs/kit/vite";
const root = await realpath(process.cwd());
export default {
  cacheDir: path.join(root, ".vite"),
  ssr: { noExternal: ["@starwind-ui/svelte", "@starwind-ui/runtime"] },
  plugins: [
    sveltekit(),
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
        const target = options.dir.includes("/client") ? "client" : "server";
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
};
