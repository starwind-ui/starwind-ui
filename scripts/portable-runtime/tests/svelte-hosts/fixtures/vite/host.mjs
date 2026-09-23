import assert from "node:assert/strict";
import { realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build, preview } from "vite";
const root = await realpath(process.cwd());
const tools = {};
for (const name of ["vite", "@sveltejs/vite-plugin-svelte", "svelte/compiler"]) {
  const file = await realpath(fileURLToPath(import.meta.resolve(name)));
  assert.ok(file.startsWith(root + path.sep), "Host tool escaped consumer: " + file);
  tools[name] = file;
}
await writeFile("host-tools.json", JSON.stringify(tools));
await build();
const server = await preview({ preview: { host: "127.0.0.1", port: 0 } });
process.send({ url: "http://127.0.0.1:" + server.httpServer.address().port });
process.on("message", (message) => {
  if (message === "close") server.httpServer.close(() => process.exit(0));
});

process.on("disconnect", () => server.httpServer.close(() => process.exit(0)));
