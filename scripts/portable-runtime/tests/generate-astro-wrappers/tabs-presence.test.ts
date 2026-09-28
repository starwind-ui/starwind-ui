import { execFile } from "node:child_process";
import { once } from "node:events";
import { cp, mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { chromium } from "playwright";
import { expect, it } from "vitest";

it("builds Astro Tabs with finite panel motion, scoped refresh, reduced motion and page swaps", async () => {
  const repo = process.cwd();
  const directory = await realpath(await mkdtemp(path.join(tmpdir(), "starwind-astro-tabs-")));
  const require = createRequire(path.join(repo, "packages/astro/package.json"));
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  const server = createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url!, "http://localhost").pathname;
      const file = pathname === "/" ? "index.html" : pathname.slice(1);
      response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html");
      response.end(await readFile(path.join(directory, "dist", file)));
    } catch {
      response.writeHead(404).end();
    }
  });
  try {
    await mkdir(path.join(directory, "src/pages"), { recursive: true });
    await symlink(
      path.join(repo, "packages/astro/node_modules"),
      path.join(directory, "node_modules"),
    );
    await cp(path.join(repo, "packages/astro/src/tabs"), path.join(directory, "src/tabs"), {
      recursive: true,
    });
    await cp(path.join(repo, "packages/astro/src/internal"), path.join(directory, "src/internal"), {
      recursive: true,
    });
    await writeFile(
      path.join(directory, "astro.config.mjs"),
      `export default { vite: { resolve: { alias: { '@starwind-ui/runtime/tabs': ${JSON.stringify(path.join(repo, "packages/runtime/src/components/tabs/index.ts"))} } } } };`,
    );
    await writeFile(
      path.join(directory, "src/pages/index.astro"),
      `---
import { TabsRoot, TabsList, TabsTab, TabsPanel } from '../tabs/index';
---
<html><head><link rel="icon" href="data:,"/><style is:global>
[data-sw-tabs-panel] { opacity: 1; transition: opacity 180ms linear; }
[data-starting-style], [data-ending-style] { opacity: 0; }
@media (prefers-reduced-motion: reduce) { [data-sw-tabs-panel] { transition: none; } }
</style></head><body><button id="external">Select B</button>
<TabsRoot defaultValue="a"><TabsList><TabsTab value="a">A</TabsTab><TabsTab value="b">B</TabsTab></TabsList>
<TabsPanel value="a">Account content <a href="#a">Account link</a></TabsPanel>
<TabsPanel value="b" keepMounted>Password content</TabsPanel></TabsRoot>
<script>
import { createTabs } from '@starwind-ui/runtime/tabs';
document.querySelector('#external')!.addEventListener('click', () => createTabs(document.querySelector<HTMLElement>('[data-sw-tabs]')!).setValue('b'));
</script></body></html>`,
    );
    await promisify(execFile)(
      process.execPath,
      [
        path.join(path.dirname(require.resolve("astro/package.json")), "bin/astro.mjs"),
        "build",
        "--root",
        directory,
      ],
      { cwd: directory },
    );
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Missing browser server port");
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${address.port}`);
    const a = page.locator('[data-sw-tabs-panel][data-value="a"]');
    const b = page.locator('[data-sw-tabs-panel][data-value="b"]');
    await expect.poll(() => a.getAttribute("role")).toBe("tabpanel");
    expect(await a.getAttribute("data-starting-style")).toBe(null);
    expect(await b.evaluate((node) => (node as HTMLElement).hidden)).toBe(true);
    await page.locator("#external").click();
    expect(
      await a.evaluate((node) => ({
        hidden: (node as HTMLElement).hidden,
        inert: (node as HTMLElement).inert,
        ending: node.hasAttribute("data-ending-style"),
      })),
    ).toEqual({ hidden: false, inert: true, ending: true });
    expect(await page.locator('[data-sw-tabs-tab][data-value="b"]').getAttribute("tabindex")).toBe(
      "0",
    );
    await page.evaluate(() =>
      document.dispatchEvent(
        new CustomEvent("starwind:init", {
          detail: { root: document.querySelector("[data-sw-tabs]") },
        }),
      ),
    );
    expect(await a.evaluate((node) => (node as HTMLElement).hidden)).toBe(false);
    await expect.poll(() => a.evaluate((node) => (node as HTMLElement).hidden)).toBe(true);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.locator('[data-sw-tabs-tab][data-value="a"]').click();
    expect(await b.evaluate((node) => (node as HTMLElement).hidden)).toBe(true);
    await page.evaluate(() => {
      document.dispatchEvent(new Event("astro:before-swap"));
      document.dispatchEvent(new Event("astro:after-swap"));
    });
    expect(await a.getAttribute("data-starting-style")).toBe(null);
    await page.locator("#external").click();
    expect(await a.evaluate((node) => (node as HTMLElement).hidden)).toBe(true);
    expect(errors).toEqual([]);
  } finally {
    await browser?.close();
    if (server.listening) await new Promise<void>((resolve) => server.close(() => resolve()));
    await rm(directory, { recursive: true, force: true });
  }
}, 60000);
