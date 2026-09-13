import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startAstroSmokeDevServer } from "../astro-smoke-dev-server.mjs";

export async function verifyAstroTimedOverlayReinit({ page, baseUrl }) {
  await page.goto(`${baseUrl}/smoke/timed-overlay-reinit/`);
  await page.waitForFunction(
    () =>
      window.timedOverlayProbe &&
      document.querySelector("#tooltip-b[aria-describedby]") &&
      document.querySelector("#preview-card-b[aria-describedby]"),
  );
  const evidence = [];
  for (const family of ["tooltip", "preview-card"]) {
    await page.evaluate((family) => {
      window.timedOverlayProbe.capture(family);
      document
        .getElementById(`${family}-b`)
        .dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
    }, family);
    await page.waitForFunction(
      (family) => Math.round(window.timedOverlayProbe.inspect(family).left) === 400,
      family,
    );
    const before = await page.evaluate(
      (family) => window.timedOverlayProbe.inspect(family),
      family,
    );
    assert.equal(before.open, true);
    assert.equal(before.accepted, 1);
    for (const scoped of [false, true, false, true]) {
      await page.evaluate(
        ({ family, scoped }) => {
          document.dispatchEvent(
            new CustomEvent("starwind:init", {
              detail: scoped ? { root: document.getElementById(family) } : undefined,
            }),
          );
        },
        { family, scoped },
      );
      await page.evaluate(() => new Promise(requestAnimationFrame));
      const after = await page.evaluate(
        (family) => window.timedOverlayProbe.inspect(family),
        family,
      );
      assert.deepEqual(after, before);
    }
    await page.evaluate((family) => {
      const trigger = document.getElementById(`${family}-b`);
      trigger.dispatchEvent(new PointerEvent("pointerleave", { pointerType: "mouse" }));
      trigger.dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
    }, family);
    await page.waitForFunction(
      (family) => window.timedOverlayProbe.inspect(family).accepted === 3,
      family,
    );
    const reopened = await page.evaluate(
      (family) => window.timedOverlayProbe.inspect(family),
      family,
    );
    assert.equal(reopened.sameController, true);
    assert.equal(reopened.open, true);
    evidence.push({ family, before, reopened, repeatedInitializations: 4 });
  }
  await page.evaluate(() => document.dispatchEvent(new Event("astro:before-swap")));
  for (const family of ["tooltip", "preview-card"]) {
    const count = await page.evaluate((family) => {
      document
        .getElementById(`${family}-b`)
        .dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
      // Read the captured connection without obtaining a new factory owner after teardown.
      return document.getElementById(`${family}-popup`).hidden;
    }, family);
    assert.equal(count, true);
  }
  console.log(JSON.stringify({ timedOverlayReinit: evidence, teardown: true }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../..");
  const demoRoot = path.join(repoRoot, "apps/demo");
  const demoRequire = createRequire(path.join(demoRoot, "package.json"));
  const reactRequire = createRequire(path.join(repoRoot, "apps/react-demo/package.json"));
  const { chromium } = reactRequire("playwright");
  let server;
  let browser;
  try {
    server = await startAstroSmokeDevServer({
      root: demoRoot,
      host: "127.0.0.1",
      port: 4337,
      astroPackagePath: demoRequire.resolve("astro/package.json"),
    });
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await verifyAstroTimedOverlayReinit({ page, baseUrl: "http://127.0.0.1:4337" });
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await server?.stop();
  }
}
