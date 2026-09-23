import assert from "node:assert/strict";
import { mkdir, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";
import { chromium } from "playwright";
import { preview } from "vite";
import * as styles from "./stock-styles.mjs";
import { verifyThemeLayoutLifecycle } from "./theme-lifecycle.mjs";
import {
  verifySidebarDocsExample,
  verifyColorPickerDocsExample,
  verifyToastDocsExample,
  verifyCarouselDocsExample,
  verifyDropdownDocsExample,
  verifyContextMenuDocsExample,
  verifyNavigationMenuDocsExample,
  verifyComboboxDocsExample,
} from "./docs-examples.mjs";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2);
const option = (name) => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const selected = [
  ...new Set((option("components") ?? option("component") ?? "").split(",").filter(Boolean)),
];
const visual = args.includes("--visual");
if (visual && !selected.length)
  throw new Error("Visual review requires --component=<name> or --components=<names>.");
const width = Number(option("width") ?? 1440);
assert.ok(width >= 320 && width <= 3840, "Use a viewport width from 320 to 3840.");
const theme = option("theme") ?? "light";
assert.ok(["light", "dark"].includes(theme), "Use --theme=light or --theme=dark.");
const grepIndex = args.indexOf("--grep");
const filter = new RegExp(grepIndex < 0 ? "." : args[grepIndex + 1]);
const evidence = process.env.SVELTE_REVIEW_EVIDENCE_DIR ?? path.join(appRoot, "test-results");
const catalogRoots = (
  await readdir(path.join(appRoot, "src/lib/starwind-runtime"), { withFileTypes: true })
)
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
for (const component of selected)
  assert.ok(catalogRoots.includes(component), `Unknown Svelte scene: ${component}`);
let server, browser, baseURL;
before(async () => {
  await readFile(path.join(appRoot, "build/review/index.html"));
  server = await preview({
    preview: { host: "127.0.0.1", port: 0, strictPort: false },
    logLevel: "error",
  });
  const address = server.httpServer.address();
  assert.ok(address && typeof address === "object");
  baseURL = `http://127.0.0.1:${address.port}`;
  browser = await chromium.launch({ channel: "chrome", headless: true });
});
after(async () => {
  await browser?.close();
  if (server)
    await new Promise((resolve, reject) =>
      server.httpServer.close((error) => (error ? reject(error) : resolve())),
    );
});
function check(name, run, options = {}) {
  test(name, { skip: !filter.test(name), timeout: 30_000 }, async () => {
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
      colorScheme: theme,
      ...options,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    const diagnostics = [];
    page.on("pageerror", (error) => diagnostics.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) diagnostics.push(message.text());
    });
    try {
      await run(page);
      assert.deepEqual(diagnostics, []);
    } catch (error) {
      await mkdir(evidence, { recursive: true });
      await page
        .screenshot({
          path: path.join(evidence, `failure-${name.replace(/[^a-z0-9]+/gi, "-")}.png`),
        })
        .catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });
}

check(
  "Catalog navigation and docs source work before JavaScript",
  async (page) => {
    await page.goto(baseURL);
    await page.getByRole("link", { name: "Open the component catalog" }).click();
    assert.equal(new URL(page.url()).pathname, "/review/");
    assert.deepEqual(
      await page
        .locator("section[data-styled-review]")
        .evaluateAll((nodes) => nodes.map((node) => node.dataset.styledReview).sort()),
      catalogRoots.filter((name) => name !== "sidebar"),
    );
    assert.deepEqual(
      await page
        .locator("nav [data-styled-component]")
        .evaluateAll((nodes) => nodes.map((node) => node.dataset.styledComponent).sort()),
      catalogRoots,
    );
    // Source rendering has one template owner. Inspect selected examples or one representative.
    for (const component of selected.length ? selected : ["button"]) {
      if (new URL(page.url()).pathname !== "/review/") await page.goto(`${baseURL}/review/`);
      if (component === "sidebar") {
        await page.locator('nav [data-styled-component="sidebar"]').click();
        assert.equal(new URL(page.url()).pathname, "/review/sidebar/");
        assert.deepEqual(
          await page
            .locator("section[data-styled-review]")
            .evaluateAll((nodes) => nodes.map((node) => node.dataset.styledReview)),
          ["sidebar"],
        );
        const projects = page.locator('[data-slot="sidebar-container"] a[href="#projects"]');
        // The desktop owner remains present in SSR even when CSS selects the mobile layout.
        assert.equal(await projects.count(), 1);
        if (width >= 768) {
          await projects.click();
          assert.equal(new URL(page.url()).hash, "#projects");
        }
      }
      const docs = page.locator(`[data-docs-example="${component}"]`);
      assert.equal(await docs.locator("[data-docs-preview]").count(), 1);
      assert.equal(
        await docs.getByRole("link", { name: "View docs" }).getAttribute("href"),
        `https://starwind.dev/docs/components/${component}/`,
      );
      const title = component
        .split("-")
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join("");
      const sourceName = [
        "sidebar",
        "color-picker",
        "toast",
        "carousel",
        "combobox",
        "context-menu",
        "dropdown",
        "navigation-menu",
      ].includes(component)
        ? `${title}DocsExample.svelte`
        : `${title}Example.svelte`;
      await docs.getByText("Docs example source", { exact: true }).click();
      assert.equal(
        await docs.locator("details code").textContent(),
        await readFile(path.join(appRoot, "src/lib/review/docs", sourceName), "utf8"),
      );
    }
  },
  { javaScriptEnabled: false },
);

if (!selected.length || selected.includes("theme-toggle") || args.includes("--layout")) {
  check("Catalog theme control updates the page and survives reload", async (page) => {
    await page.goto(`${baseURL}/review/`);
    await page.waitForFunction(() => document.querySelector("[data-theme-icon][data-ready]"));
    const initial = await page.locator("html").evaluate((node) => node.classList.contains("dark"));
    await page.getByRole("button", { name: "Toggle page theme", exact: true }).click();
    await page.waitForFunction(
      (previous) => document.documentElement.classList.contains("dark") !== previous,
      initial,
    );
    await page.reload();
    assert.equal(
      await page.locator("html").evaluate((node) => node.classList.contains("dark")),
      !initial,
    );
  });
}
if (args.includes("--layout"))
  test("Catalog layout releases theme owners on replacement and unmount", { timeout: 30_000 }, () =>
    verifyThemeLayoutLifecycle(browser, appRoot),
  );

const interactions = {
  sidebar: verifySidebarDocsExample,
  "color-picker": verifyColorPickerDocsExample,
  toast: verifyToastDocsExample,
  carousel: verifyCarouselDocsExample,
  dropdown: verifyDropdownDocsExample,
  "context-menu": verifyContextMenuDocsExample,
  "navigation-menu": verifyNavigationMenuDocsExample,
  combobox: verifyComboboxDocsExample,
};
const styleChecks = {
  input: styles.verifyInputStockStyles,
  form: styles.verifyFormStockStyles,
  "input-group": styles.verifyInputGroupStockStyles,
  switch: styles.verifySwitchStockStyles,
  "radio-group": styles.verifyRadioGroupStockStyles,
  toggle: styles.verifyToggleStockStyles,
  "toggle-group": (page) => styles.verifyToggleStockStyles(page, true),
  field: styles.verifyFieldStockStyles,
  "input-otp": styles.verifyInputOtpStockStyles,
  dropzone: styles.verifyDropzoneStockStyles,
  accordion: styles.verifyAccordionStockStyles,
  slider: styles.verifySliderStockStyles,
};
for (const component of selected)
  check(`${component} docs example`, async (page) => {
    await page.goto(`${baseURL}/review/${component === "sidebar" ? "sidebar/" : ""}`);
    await page.waitForFunction(() => document.querySelector("[data-theme-icon][data-ready]"));
    const docs = page.locator(`[data-docs-example="${component}"]`);
    const example = docs.locator("[data-docs-preview]");
    await example.scrollIntoViewIfNeeded();
    assert.equal(await example.isVisible(), true);
    if (visual) {
      await mkdir(evidence, { recursive: true });
      assert.equal(
        await example.evaluate((node) => node.scrollWidth <= node.clientWidth),
        true,
        `${component} fits its container`,
      );
      if (styleChecks[component]) await styleChecks[component](page);
      await example.screenshot({
        path: path.join(evidence, `${component}-${theme}-${width}.png`),
        animations: "disabled",
      });
    }
    if (interactions[component])
      await interactions[component]({
        page,
        evidence: visual ? evidence : undefined,
        width,
        theme,
      });
  });
