import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import os from "node:os";
import path from "node:path";
import { expect, it, vi } from "vitest";
import { startAstroSmokeDevServer } from "./smoke/astro-smoke-dev-server.mjs";

const demoRequire = createRequire(new URL("../../../apps/demo/package.json", import.meta.url));
const astroPackagePath = demoRequire.resolve("astro/package.json");

it("stops its development listener in an agent environment", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "starwind-astro-smoke-lifecycle-"));
  mkdirSync(path.join(root, "src/pages"), { recursive: true });
  writeFileSync(path.join(root, "package.json"), '{"type":"module"}');
  writeFileSync(
    path.join(root, "astro.config.mjs"),
    "export default { devToolbar: { enabled: false } };\n",
  );
  writeFileSync(path.join(root, "src/pages/index.astro"), "<h1>Smoke listener fixture</h1>\n");
  vi.stubEnv("CODEX_THREAD_ID", "astro-smoke-lifecycle-test");
  const port = await freePort();
  const url = `http://127.0.0.1:${port}/`;
  let server;
  try {
    server = await startAstroSmokeDevServer({ root, host: "127.0.0.1", port, astroPackagePath });
    await expect
      .poll(
        async () => {
          try {
            return (await fetch(url)).status < 500;
          } catch {
            return null;
          }
        },
        { timeout: 15_000 },
      )
      .toBe(true);
    await server.stop();
    await expect
      .poll(
        async () => {
          try {
            await fetch(url);
            return true;
          } catch {
            return false;
          }
        },
        { timeout: 3000 },
      )
      .toBe(false);
  } finally {
    await server?.stop();
    // Clean up an orphan if the regression reappears in the CLI launch path.
    try {
      const { pid } = JSON.parse(readFileSync(path.join(root, ".astro/dev.json"), "utf8"));
      process.kill(pid, "SIGTERM");
    } catch {}
    vi.unstubAllEnvs();
    rmSync(root, { recursive: true, force: true });
  }
}, 25_000);

async function freePort() {
  const listener = createServer();
  await new Promise((resolve) => listener.listen(0, "127.0.0.1", resolve));
  const port = listener.address().port;
  await new Promise((resolve) => listener.close(resolve));
  return port;
}
