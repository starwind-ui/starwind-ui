import { realpath, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolveToolEntries } from "./resolve-tools.mjs";
import { build, preview } from "astro";
const tools = {};
for (const name of [
  "astro",
  "@astrojs/svelte",
  "vite",
  "@sveltejs/vite-plugin-svelte",
  "svelte/compiler",
]) {
  tools[name] = await realpath(fileURLToPath(import.meta.resolve(name)));
}
Object.assign(
  tools,
  await resolveToolEntries({
    "integration:plugin": {
      specifier: "@sveltejs/vite-plugin-svelte",
      parentURL: import.meta.resolve("@astrojs/svelte"),
    },
    "integration:vite": { specifier: "vite", parentURL: import.meta.resolve("@astrojs/svelte") },
    "astro:vite": { specifier: "vite", parentURL: import.meta.resolve("astro") },
  }),
);
Object.assign(
  tools,
  await resolveToolEntries({
    "plugin:svelte/compiler": {
      specifier: "svelte/compiler",
      parentURL: pathToFileURL(tools["integration:plugin"]).href,
    },
  }),
);
await writeFile("host-tools.json", JSON.stringify(tools));
await build({ root: process.cwd() });
const server = await preview({ root: process.cwd(), server: { host: "127.0.0.1", port: 0 } });
process.send({ url: "http://127.0.0.1:" + server.port });
const close = async () => {
  await server.stop();
  process.exit(0);
};
process.on("message", (message) => {
  if (message === "close") void close();
});
process.on("disconnect", () => void close());
