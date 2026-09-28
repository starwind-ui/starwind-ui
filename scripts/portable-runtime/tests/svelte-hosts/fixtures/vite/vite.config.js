import assert from "node:assert/strict";
import { realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
const root = await realpath(process.cwd());
export default {
  root,
  cacheDir: path.join(root, ".vite"),
  plugins: [
    svelte(),
    {
      name: "packed-provenance",
      async generateBundle() {
        const modules = new Set();
        for (const id of this.getModuleIds()) {
          if (id.startsWith("\0")) continue;
          const file = id.split("?")[0];
          if (!path.isAbsolute(file)) throw new Error("Unresolved build module: " + id);
          const resolved = await realpath(file);
          assert.ok(resolved.startsWith(root + path.sep), "Build escaped consumer: " + resolved);
          if (resolved.includes("/@starwind-ui/"))
            assert.ok(resolved.includes("/dist/"), "Package source import: " + resolved);
          modules.add(resolved);
        }
        await writeFile("build-provenance.json", JSON.stringify([...modules].sort(), null, 2));
      },
    },
  ],
};
