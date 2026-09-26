import { createRequire } from "node:module";
import path from "node:path";
import { chromium } from "playwright";
import { expect, it } from "vitest";
import { printSveltePortalPlacement } from "../../renderers/framework-adapters/svelte/portal-placement.js";

it("keeps a parent before its child when portal destinations converge child-first", async () => {
  const { build } = createRequire(path.join(process.cwd(), "node_modules/vite/package.json"))(
    "esbuild",
  );
  const result = await build({
    stdin: {
      contents: printSveltePortalPlacement(),
      loader: "ts",
      resolveDir: path.join(process.cwd(), "packages/svelte/src/_internal"),
    },
    bundle: true,
    write: false,
    format: "iife",
    globalName: "PortalPlacement",
    platform: "browser",
  });
  const browser = await chromium.launch({ channel: "chrome" });
  try {
    const page = await browser.newPage();
    await page.setContent(
      `<div id="owner"><div id="parent-root"><div id="parent-portal"><div style="position:fixed;inset:20px auto auto 20px;width:200px;height:200px;z-index:50;background:white">Parent<div id="child-root"><div id="child-portal"><button style="position:fixed;left:40px;top:40px;z-index:50">Child action</button></div></div></div></div></div></div><div id="host"></div>`,
    );
    await page.addScriptTag({ content: result.outputFiles[0].text });
    await page.evaluate(() => {
      const w = window as any;
      const element = (id: string) => document.getElementById(id)!;
      const host = element("host");
      const runtime = {
        resolvePortalPlacement: () => ({ target: host }),
        reportPortalPlacement: () => {},
      };
      const child = w.PortalPlacement.createPortalPlacement(
        element("child-portal"),
        element("child-root"),
        runtime,
      );
      const parent = w.PortalPlacement.createPortalPlacement(
        element("parent-portal"),
        element("parent-root"),
        runtime,
      );
      // Svelte's descendants can register before their ancestors. A new Dialog host
      // then causes both observers to move their portals to the same destination.
      child.update(true);
      parent.update(true);
      w.placements = { child, parent };
    });
    expect(
      await page.locator("#host > div").evaluateAll((nodes) => nodes.map((node) => node.id)),
    ).toEqual(["parent-portal", "child-portal"]);
    await page.getByRole("button", { name: "Child action" }).click({ timeout: 2000 });
    await page.evaluate(() => {
      const { parent } = (window as any).placements;
      parent.prepare()();
    });
    await page.getByRole("button", { name: "Child action" }).click({ timeout: 2000 });
    await page.evaluate(() => {
      for (const p of Object.values((window as any).placements) as any[]) {
        p.disconnect();
        p.restore();
      }
    });
    expect(await page.locator("#host > div").count()).toBe(0);
    expect(await page.locator("#parent-portal #child-root #child-portal").count()).toBe(1);
  } finally {
    await browser.close();
  }
}, 30_000);
