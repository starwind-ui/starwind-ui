import { createRequire } from "node:module";
import path from "node:path";
import { chromium } from "playwright";
import { expect, it } from "vitest";

import { printSveltePortalPlacement } from "../../../../renderers/framework-adapters/svelte/portal-placement.js";

it("keeps focus and reports preparation inside a real iframe", async () => {
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
    await page.setContent('<iframe id="owner-frame"></iframe>');
    await page.addScriptTag({ content: result.outputFiles[0].text });
    const observed = await page.evaluate(() => {
      const frame = document.querySelector("#owner-frame");
      const ownerDocument = frame.contentDocument;
      ownerDocument.body.innerHTML = `
        <div id="owner"><div id="portal"><button id="focused">Focused</button></div></div>
        <div id="target-a"></div><div id="target-b"></div>`;
      const owner = ownerDocument.querySelector("#owner");
      const portal = ownerDocument.querySelector("#portal");
      const focused = ownerDocument.querySelector("#focused");
      const reports = [];
      const runtime = {
        resolvePortalPlacement(_element, options) {
          return { target: ownerDocument.querySelector(options.container) };
        },
        reportPortalPlacement(_element, placement) {
          if (placement) reports.push({ ready: placement.ready, target: placement.target.id });
        },
      };
      const placement = window.PortalPlacement.createPortalPlacement(
        portal,
        owner,
        runtime,
        true,
        true,
      );
      placement.update(true, "#target-a");
      focused.focus();
      const before = ownerDocument.activeElement === focused;
      reports.length = 0;
      const finish = placement.prepare();
      const during = ownerDocument.activeElement === focused;
      finish();
      const after = ownerDocument.activeElement === focused;
      const preparationReports = [...reports];
      placement.update(true, "#target-b");
      const retargetFocus = ownerDocument.activeElement === focused;
      const result = { before, during, after, reports: preparationReports, retargetFocus };
      placement.disconnect();
      placement.restore();
      return result;
    });
    expect(observed).toEqual({
      before: true,
      during: true,
      after: true,
      retargetFocus: true,
      reports: [
        { ready: false, target: "target-a" },
        { ready: true, target: "target-a" },
      ],
    });
  } finally {
    await browser.close();
  }
}, 30_000);
