import { createServer } from "node:http";
import { realpath, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createBuilder } from "vite";
const tools = {};
for (const name of [
  "vite",
  "@sveltejs/vite-plugin-svelte",
  "svelte/compiler",
  "@sveltejs/kit",
  "@sveltejs/adapter-node",
]) {
  tools[name] = await realpath(fileURLToPath(import.meta.resolve(name)));
}
await writeFile("host-tools.json", JSON.stringify(tools));
// SvelteKit 3 builds its client and server environments through the Vite app builder, as
// `vite build` does. A plain build() call builds only the client environment.
await (await createBuilder()).buildApp();
const { handler } = await import("./build/handler.js");
const server = createServer(handler);
server.listen(0, "127.0.0.1", () => {
  process.send({ url: "http://127.0.0.1:" + server.address().port });
});
const close = () => {
  server.close(() => process.exit(0));
  server.closeIdleConnections();
};
process.on("message", (message) => {
  if (message === "close") close();
});
process.on("disconnect", close);
