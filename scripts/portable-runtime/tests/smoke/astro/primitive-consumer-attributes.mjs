import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startAstroSmokeDevServer } from "../astro-smoke-dev-server.mjs";

async function verifyAsChildPair(page, { close, popup, trigger }) {
  await page.locator(`#${trigger}`).click();
  await page.waitForFunction((id) => document.getElementById(id)?.open === true, popup, {
    timeout: 5000,
  });
  assert.equal(await page.locator(`#${trigger}`).getAttribute("data-state"), "open");
  assert.equal(await page.locator(`#${trigger}`).getAttribute("aria-haspopup"), "dialog");

  await page.locator(`#${close}`).click();
  await page.waitForFunction((id) => document.getElementById(id)?.open === false, popup, {
    timeout: 5000,
  });
  assert.equal(await page.locator(`#${trigger}`).getAttribute("data-state"), "closed");
}

export async function verifyAstroPrimitiveConsumerAttributes({ page, baseUrl }) {
  await page.goto(`${baseUrl}/smoke/primitive-consumer-attributes/`);
  await page.waitForFunction(() => document.querySelector("#styled-trigger[aria-controls]"));

  for (const name of ["dialog", "alert-dialog", "drawer"]) {
    await verifyAsChildPair(page, {
      close: `${name}-close`,
      popup: `${name}-popup`,
      trigger: `${name}-trigger`,
    });
  }
  await verifyAsChildPair(page, {
    close: "styled-close",
    popup: "styled-popup",
    trigger: "styled-trigger",
  });

  assert.equal(await page.locator("#dialog-trigger").getAttribute("class"), "own");
  assert.equal(await page.locator("#drawer-trigger").getAttribute("data-sw-drawer-trigger"), "");
  assert.equal(await page.locator("#styled-trigger").getAttribute("data-slot"), "dialog-trigger");
  assert.equal(await page.locator("#styled-close").getAttribute("data-slot"), "dialog-close");

  assert.equal(await page.locator("#override-trigger").getAttribute("type"), "submit");
  assert.equal(
    await page.locator("#override-breadcrumb").getAttribute("aria-label"),
    "Consumer label",
  );

  console.log(JSON.stringify({ primitiveConsumerAttributes: true }));
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
      port: 4338,
      astroPackagePath: demoRequire.resolve("astro/package.json"),
    });
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await verifyAstroPrimitiveConsumerAttributes({ page, baseUrl: "http://127.0.0.1:4338" });
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await server?.stop();
  }
}
