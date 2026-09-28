import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { preview } from "vite";

const option = (key) =>
  process.argv.find((arg) => arg.startsWith(`--${key}=`))?.slice(key.length + 3);
const width = Number(option("width") ?? 1440);
const theme = option("theme") ?? "light";
const evidence = process.env.SVELTE_REVIEW_EVIDENCE_DIR;
let server;
let browser;
const started = performance.now();
const results = [];
try {
  let url = option("url");
  if (!url) {
    server = await preview({ preview: { host: "127.0.0.1", port: 0 }, logLevel: "error" });
    url = `http://127.0.0.1:${server.httpServer.address().port}`;
  }
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width, height: 1000 },
    colorScheme: theme,
  });
  await context.addInitScript(() => {
    const signals = [];
    const add = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (type, listener, options) {
      if ((this === document || this === window) && options?.signal) signals.push(options.signal);
      return add.call(this, type, listener, options);
    };
    const observers = [];
    for (const name of ["MutationObserver", "ResizeObserver"]) {
      const Native = window[name];
      window[name] = class extends Native {
        active = false;
        constructor(callback) {
          super(callback);
          observers.push(this);
        }
        observe(...args) {
          this.active = true;
          return super.observe(...args);
        }
        disconnect() {
          this.active = false;
          return super.disconnect();
        }
      };
    }
    window.portalResources = () => ({
      signals: signals.filter((signal) => !signal.aborted).length,
      observers: observers.filter((observer) => observer.active).length,
      bodyOverflow: document.body.style.overflow,
      htmlOverflow: document.documentElement.style.overflow,
      locks: document.querySelectorAll("[data-sw-scroll-lock], [data-sw-scroll-locked]").length,
      hosts: document.querySelectorAll("[data-sw-floating-root]").length,
      native: document.querySelectorAll(":popover-open").length,
    });
  });
  const page = await context.newPage();
  page.setDefaultTimeout(6000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (["warning", "error"].includes(message.type())) errors.push(message.text());
  });
  const layer = (name) => page.locator(`[data-portal-layer="${name}"]`);
  const scene = (name) => page.locator(`[data-portal-scene="${name}"]`);
  const settle = async () =>
    page.evaluate(async () => {
      for (let frame = 0; frame < 5; frame++) await new Promise(requestAnimationFrame);
      await Promise.all(
        document
          .getAnimations()
          .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
          .map((animation) => animation.finished.catch(() => {})),
      );
    });
  async function visible(node) {
    await node.waitFor({ state: "visible" });
    await settle();
  }
  async function capture(name) {
    if (!evidence) return;
    await mkdir(evidence, { recursive: true });
    await page.screenshot({
      path: path.join(evidence, `portals-${name}-${theme}-${width}.png`),
      animations: "disabled",
    });
  }
  async function above(inner, outer, name, requireOverlap = true) {
    const outerBox = await outer.boundingBox();
    assert.ok(outerBox, `${name}: outer layer is visible`);
    const sample = await inner.evaluate((node, box) => {
      const r = node.getBoundingClientRect();
      const left = Math.max(r.left, box.x),
        right = Math.min(r.right, box.x + box.width);
      const top = Math.max(r.top, box.y),
        bottom = Math.min(r.bottom, box.y + box.height);
      const overlaps = right > left && bottom > top;
      const x = overlaps ? (left + right) / 2 : r.left + r.width / 2;
      const y = overlaps ? (top + bottom) / 2 : r.top + r.height / 2;
      const hit = document.elementFromPoint(x, y);
      return {
        computed:
          node.closest("[data-sw-select-positioner]") &&
          getComputedStyle(node.closest("[data-sw-select-positioner]")).zIndex,
        overlaps,
        above: node.contains(hit),
        hit: hit?.getAttribute("data-slot"),
        x,
        y,
      };
    }, outerBox);
    assert.ok(
      !requireOverlap || sample.overlaps,
      `${name}: exercise overlapping layers ${JSON.stringify(sample)}`,
    );
    assert.ok(
      sample.above,
      `${name}: inner layer must receive pointer hits ${JSON.stringify(sample)}`,
    );
    results.push({ name, ...sample });
    await capture(name);
  }
  async function completeEditor(picker) {
    const geometry = await picker.evaluate((node) => ({
      x: node.getBoundingClientRect().x,
      y: node.getBoundingClientRect().y,
      width: node.getBoundingClientRect().width,
      height: node.getBoundingClientRect().height,
      clientHeight: node.clientHeight,
      scrollHeight: node.scrollHeight,
    }));
    assert.ok(
      geometry.x >= 0 &&
        geometry.y >= 0 &&
        geometry.x + geometry.width <= width &&
        geometry.y + geometry.height <= 1000,
      `Color Picker fits the viewport: ${JSON.stringify(geometry)}`,
    );
    assert.ok(
      geometry.clientHeight >= geometry.scrollHeight - 1,
      `The complete Color Picker fits this viewport without internal clipping: ${JSON.stringify(geometry)}`,
    );
    results.push({ name: "complete-dialog-editor", ...geometry });
  }
  async function escape(inner, trigger, outer) {
    const native = await inner.evaluate((node) => node.matches(":popover-open"));
    if (native)
      await inner.evaluate((node) =>
        node.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 10000 }),
      );
    await page.keyboard.press("Escape");
    if (native) {
      assert.deepEqual(
        await inner.evaluate((node) => ({
          native: node.matches(":popover-open"),
          hidden: node.hidden,
          state: node.dataset.state,
        })),
        { native: true, hidden: false, state: "closed" },
        "Native presentation retains Runtime exit motion",
      );
      await inner.evaluate((node) =>
        node.getAnimations().forEach((animation) => animation.finish()),
      );
    }
    await inner.waitFor({ state: "hidden" });
    await settle();
    if (outer) assert.equal(await outer.isVisible(), true, "Escape keeps the outer layer open");
    assert.equal(
      await trigger.evaluate((node) => node === document.activeElement),
      true,
      "Escape restores focus to the inner trigger",
    );
  }
  async function selectPlacement(trigger, popup, name) {
    const bounds = await popup.boundingBox();
    assert.ok(
      bounds &&
        bounds.x >= -1 &&
        bounds.y >= -1 &&
        bounds.x + bounds.width <= width + 1 &&
        bounds.y + bounds.height <= 1001,
      `${name}: Select fits the viewport ${JSON.stringify(bounds)}`,
    );
    const triggerBounds = await trigger.boundingBox();
    if ((await popup.getAttribute("data-align-trigger")) === "true") {
      const valueBounds = await trigger.locator('[data-slot="select-value"]').boundingBox();
      const selectedBounds = await popup
        .getByRole("option", { selected: true })
        .locator('[data-slot="select-item-text"]')
        .boundingBox();
      assert.ok(
        valueBounds &&
          selectedBounds &&
          Math.abs(
            valueBounds.y + valueBounds.height / 2 - selectedBounds.y - selectedBounds.height / 2,
          ) <= 2,
        `${name}: selected label stays aligned with its trigger ${JSON.stringify({ valueBounds, selectedBounds })}`,
      );
    } else {
      const side = await popup.getAttribute("data-side");
      assert.ok(
        bounds &&
          triggerBounds &&
          (side === "bottom"
            ? Math.abs(bounds.y - triggerBounds.y - triggerBounds.height - 4) <= 2
            : side === "top" && Math.abs(bounds.y + bounds.height - triggerBounds.y + 4) <= 2),
        `${name}: floating popup stays anchored with its declared offset ${JSON.stringify({ side, bounds, triggerBounds })}`,
      );
    }
  }
  async function nativeMargins(popup, trigger, outer, name) {
    const read = () =>
      popup.evaluate((node) => ({
        native: node.matches(":popover-open"),
        top: getComputedStyle(node).marginTop,
        right: getComputedStyle(node).marginRight,
      }));
    const useClass = async (next) => {
      await popup.evaluate((node, next) => {
        node.classList.remove("portal-margin-a", "portal-margin-b", "portal-margin-responsive");
        if (next) node.classList.add(next);
      }, next);
      await settle();
    };
    const reopen = async () => {
      await escape(popup, trigger, outer);
      await trigger.click();
      await visible(popup);
    };
    await page.setViewportSize({ width: 1440, height: 1000 });
    await useClass("portal-margin-a");
    assert.deepEqual(
      await read(),
      { native: true, top: "12px", right: "0px" },
      `${name}: authored margin class`,
    );
    await useClass("portal-margin-b");
    assert.deepEqual(
      await read(),
      { native: true, top: "18px", right: "0px" },
      `${name}: live margin class`,
    );
    await useClass("portal-margin-responsive");
    assert.deepEqual(
      await read(),
      { native: true, top: "12px", right: "0px" },
      `${name}: wide responsive margin`,
    );
    await page.setViewportSize({ width: 600, height: 1000 });
    await settle();
    const responsive = await read();
    assert.deepEqual(
      responsive,
      { native: true, top: "24px", right: "0px" },
      `${name}: narrow responsive margin`,
    );
    await reopen();
    assert.deepEqual(await read(), responsive, `${name}: responsive margin after reopen`);
    await popup.evaluate((node) => {
      node.style.margin = "7px 9px";
    });
    await settle();
    const inline = await read();
    assert.deepEqual(
      inline,
      { native: true, top: "7px", right: "9px" },
      `${name}: authored inline margin`,
    );
    await reopen();
    assert.deepEqual(await read(), inline, `${name}: inline margin after reopen`);
    await popup.evaluate((node) => {
      node.style.margin = "11px 13px";
    });
    await settle();
    assert.deepEqual(
      await read(),
      { native: true, top: "11px", right: "13px" },
      `${name}: live inline margin`,
    );
    await popup.evaluate((node) => node.style.removeProperty("margin"));
    await useClass(null);
    await page.setViewportSize({ width, height: 1000 });
    await settle();
    await reopen();
    assert.deepEqual(
      await read(),
      { native: true, top: "0px", right: "0px" },
      `${name}: stock preflight margin after reopen`,
    );
    results.push({ name: `${name}-margins`, responsive, inline });
  }
  async function select(trigger, outer, name, format = false) {
    await trigger.click();
    const popup = page.locator(`[id="${await trigger.getAttribute("aria-controls")}"]`);
    await visible(popup);
    await selectPlacement(trigger, popup, name);
    await above(popup, outer, name);
    await popup.getByRole("option", { name: format ? "RGB" : "Blue", exact: true }).click();
    await popup.waitFor({ state: "hidden" });
    await settle();
    assert.match(await trigger.textContent(), format ? /RGB/i : /Blue/);
    assert.equal(await outer.isVisible(), true, "Choosing an option keeps the parent open");
    assert.equal(
      await trigger.evaluate((node) => node === document.activeElement),
      true,
      "Selection restores trigger focus",
    );
    await trigger.click();
    await visible(popup);
    await selectPlacement(trigger, popup, `${name}: reopened`);
    if (name === "dialog-picker-select") {
      await nativeMargins(popup, trigger, outer, name);
      await selectPlacement(trigger, popup, `${name}: reopened after margin changes`);
    }
    await escape(popup, trigger, outer);
  }
  await page.goto(`${url}/review/portals/`);
  await page.waitForFunction(() => document.querySelector("[data-theme-icon][data-ready]"));
  await page.addStyleTag({
    content: `
    .portal-margin-a { margin-top: 12px; }
    .portal-margin-b { margin-top: 18px; }
    .portal-margin-responsive { margin-top: 12px; }
    @media (max-width: 800px) { .portal-margin-responsive { margin-top: 24px; } }
  `,
  });
  await page.getByRole("button", { name: "Unmount examples", exact: true }).click();
  await settle();
  const empty = await page.evaluate(() => window.portalResources());
  await page.getByRole("button", { name: "Mount examples", exact: true }).click();
  await settle();
  const closed = await page.evaluate(() => window.portalResources());
  const closedResources = async () => {
    await settle();
    assert.deepEqual(
      await page.evaluate(() => window.portalResources()),
      closed,
      "Closing layers releases their resources",
    );
  };

  // The original failure: the format menu overlaps the editor's lower controls.
  const colorTrigger = scene("color-picker").locator('[data-slot="color-picker-trigger"]');
  await colorTrigger.click();
  let picker = page.locator('[data-slot="color-picker-content"]').filter({ visible: true });
  await visible(picker);
  await select(picker.getByRole("combobox"), picker, "color-picker-select", true);
  await escape(picker, colorTrigger);
  await closedResources();

  const dialogTrigger = scene("dialog-select").getByRole("button", { name: "Open accent dialog" });
  await dialogTrigger.click();
  await visible(layer("dialog-select-dialog"));
  await select(
    layer("dialog-select-dialog").getByRole("combobox"),
    layer("dialog-select-dialog"),
    "dialog-select",
  );
  await escape(layer("dialog-select-dialog"), dialogTrigger);
  await closedResources();

  const paletteTrigger = scene("dialog-picker").getByRole("button", {
    name: "Open palette dialog",
  });
  await paletteTrigger.click();
  await visible(layer("dialog-picker-dialog"));
  const nestedColorTrigger = layer("dialog-picker-dialog").locator(
    '[data-slot="color-picker-trigger"]',
  );
  await nestedColorTrigger.click();
  picker = page.locator('[data-slot="color-picker-content"]').filter({ visible: true });
  await visible(picker);
  await completeEditor(picker);
  await above(picker, layer("dialog-picker-dialog"), "dialog-picker");
  await select(picker.getByRole("combobox"), picker, "dialog-picker-select", true);
  await picker.locator('[data-sw-color-picker-swatch][data-value="#2563eb"]').click();
  await settle();
  assert.equal(
    await layer("dialog-picker-dialog").locator("[data-portal-palette]").textContent(),
    "#2563eb",
    "Portaled editing updates the accepted Color Picker binding",
  );
  assert.equal(
    await page.locator("#portal-palette-form").evaluate((node) => new FormData(node).get("accent")),
    "rgb(37, 99, 235)",
    "The native form retains the accepted color and format",
  );
  await nativeMargins(picker, nestedColorTrigger, layer("dialog-picker-dialog"), "dialog-picker");
  await completeEditor(picker);
  await escape(picker, nestedColorTrigger, layer("dialog-picker-dialog"));
  await escape(layer("dialog-picker-dialog"), paletteTrigger);
  await closedResources();

  await paletteTrigger.click();
  await visible(layer("dialog-picker-dialog"));
  await nestedColorTrigger.click();
  await visible(picker);
  await picker.getByRole("combobox").click();
  const nativeSelect = page.locator("[data-sw-select-popup]").filter({ visible: true });
  await visible(nativeSelect);
  await layer("dialog-picker-dialog")
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await layer("dialog-picker-dialog").waitFor({ state: "hidden" });
  await closedResources();

  await paletteTrigger.click();
  await visible(layer("dialog-picker-dialog"));
  await nestedColorTrigger.click();
  await visible(picker);
  await picker.getByRole("combobox").click();
  await visible(nativeSelect);
  await page
    .getByRole("button", { name: "Unmount examples", exact: true })
    .evaluate((node) => node.click());
  await settle();
  assert.deepEqual(
    await page.evaluate(() => window.portalResources()),
    empty,
    "Unmount releases the native picker and Select layers",
  );
  await page.getByRole("button", { name: "Mount examples", exact: true }).click();
  await settle();
  assert.deepEqual(await page.evaluate(() => window.portalResources()), closed);

  const sheetTrigger = scene("sheet").getByRole("button", { name: "Open display sheet" });
  await sheetTrigger.click();
  await visible(layer("sheet"));
  const sheetPopoverTrigger = layer("sheet").getByRole("button", { name: "Edit sheet accent" });
  await sheetPopoverTrigger.click();
  await visible(layer("sheet-popover"));
  await above(layer("sheet-popover"), layer("sheet"), "sheet-popover");
  await select(
    layer("sheet-popover").getByRole("combobox"),
    layer("sheet-popover"),
    "sheet-popover-select",
  );
  await escape(layer("sheet-popover"), sheetPopoverTrigger, layer("sheet"));
  await escape(layer("sheet"), sheetTrigger);
  await closedResources();

  const workspaceTrigger = scene("nested-popover").getByRole("button", {
    name: "Open workspace panel",
  });
  await workspaceTrigger.click();
  await visible(layer("outer-popover"));
  const detailTrigger = layer("outer-popover").getByRole("button", { name: "Open details" });
  await detailTrigger.click();
  await visible(layer("inner-popover"));
  await above(layer("inner-popover"), layer("outer-popover"), "nested-popover");
  await layer("inner-popover").getByRole("textbox", { name: "Display name" }).fill("New studio");
  await escape(layer("inner-popover"), detailTrigger, layer("outer-popover"));
  await escape(layer("outer-popover"), workspaceTrigger);
  await closedResources();

  const actionsTrigger = scene("menu").getByRole("button", { name: "Open actions panel" });
  await actionsTrigger.click();
  await visible(layer("menu-popover"));
  const menuTrigger = layer("menu-popover").getByRole("button", { name: "Open workspace actions" });
  await menuTrigger.click();
  await visible(layer("menu"));
  await above(layer("menu"), layer("menu-popover"), "popover-menu");
  const subTrigger = layer("menu").getByRole("menuitem", { name: "Share workspace" });
  await subTrigger.focus();
  await subTrigger.press("ArrowRight");
  await visible(layer("submenu"));
  await above(layer("submenu"), layer("menu"), "menu-submenu", false);
  await escape(layer("submenu"), subTrigger, layer("menu"));
  await escape(layer("menu"), menuTrigger, layer("menu-popover"));
  await menuTrigger.click();
  await visible(layer("menu"));
  await layer("menu").getByRole("menuitem", { name: "Copy workspace", exact: true }).click();
  await layer("menu").waitFor({ state: "hidden" });
  assert.equal(
    await layer("menu-popover").locator("[data-portal-action]").textContent(),
    "Workspace copied",
  );
  await escape(layer("menu-popover"), actionsTrigger);
  await closedResources();

  // Unmount while all three layers are live, including a native top-layer dialog.
  await sheetTrigger.click();
  await visible(layer("sheet"));
  await sheetPopoverTrigger.click();
  await visible(layer("sheet-popover"));
  await layer("sheet-popover").getByRole("combobox").click();
  await visible(layer("sheet-select"));
  await page
    .getByRole("button", { name: "Unmount examples", exact: true })
    .evaluate((node) => node.click());
  await settle();
  assert.equal(
    await page
      .locator(
        "[data-portal-compositions], [data-portal-layer], [data-sw-select-portal], [data-sw-popover-portal], dialog[open]",
      )
      .count(),
    0,
    "Unmount removes authored and portaled elements",
  );
  assert.deepEqual(
    await page.evaluate(() => window.portalResources()),
    empty,
    "Unmount releases overlay observers, global listeners and scroll locks",
  );
  await page.getByRole("button", { name: "Mount examples", exact: true }).click();
  await settle();
  assert.deepEqual(
    await page.evaluate(() => window.portalResources()),
    closed,
    "Remount creates one set of resources",
  );
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      { width, theme, milliseconds: performance.now() - started, results, empty, closed },
      null,
      2,
    ),
  );
} catch (error) {
  if (evidence && browser) {
    await mkdir(evidence, { recursive: true });
    await browser
      .contexts()[0]
      ?.pages()[0]
      ?.screenshot({ path: path.join(evidence, `portals-failure-${theme}-${width}.png`) })
      .catch(() => {});
  }
  throw error;
} finally {
  await browser?.close();
  if (server) await new Promise((resolve) => server.httpServer.close(resolve));
}
