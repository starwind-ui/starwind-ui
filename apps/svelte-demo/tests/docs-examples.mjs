import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import path from "node:path";

export async function verifyComboboxDocsExample({ page, evidence, width, theme }) {
  const preview = page.locator('[data-docs-example="combobox"] [data-docs-preview]');
  const input = preview.getByRole("combobox");
  await preview.scrollIntoViewIfNeeded();
  if (evidence) {
    await preview.screenshot({
      path: path.join(evidence, `docs-combobox-${theme}-${width}.png`),
      animations: "disabled",
    });
  }
  await input.fill("rea");
  const popup = page.locator(`[id="${await input.getAttribute("aria-controls")}"]`);
  await popup.waitFor({ state: "visible" });
  await popup.evaluate(async (node) => {
    for (let frame = 0; frame < 5; frame++) await new Promise(requestAnimationFrame);
    await Promise.all(node.getAnimations().map((animation) => animation.finished));
  });
  assert.deepEqual(
    (await popup.getByRole("option").allTextContents()).map((text) => text.trim()),
    ["React"],
  );
  const bounds = await popup.boundingBox();
  assert.ok(
    bounds && bounds.x >= -1 && bounds.x + bounds.width <= width + 1,
    "Combobox docs popup fits the viewport",
  );
  if (evidence) {
    await page.screenshot({
      path: path.join(evidence, `docs-combobox-open-${theme}-${width}.png`),
      animations: "disabled",
    });
  }
  await input.press("ArrowDown");
  await input.press("Enter");
  await popup.waitFor({ state: "hidden" });
  assert.equal(await input.inputValue(), "React");
  assert.equal(await input.evaluate((node) => node === document.activeElement), true);
}

/** The accepted first Dropdown docs preview owns its open capture. */
export async function verifyDropdownDocsExample({ page, evidence, width, theme }) {
  const example = page.locator('[data-docs-example="dropdown"]');
  const preview = example.locator("[data-docs-preview]");
  const trigger = preview.getByRole("button", { name: "Open Menu", exact: true });
  await trigger.scrollIntoViewIfNeeded();
  if (evidence) {
    await preview.screenshot({
      path: path.join(evidence, `docs-dropdown-${theme}-${width}.png`),
      animations: "disabled",
    });
  }
  await trigger.click();
  const popup = page.getByRole("menu").filter({ hasText: "My Account" });
  await popup.waitFor({ state: "visible" });
  await popup.evaluate(async (node) => {
    for (let frame = 0; frame < 4; frame++) await new Promise(requestAnimationFrame);
    await Promise.all(node.getAnimations().map((animation) => animation.finished));
  });
  assert.deepEqual(await popup.getByRole("menuitem").allTextContents(), [
    "Profile",
    "Settings",
    "Help",
    "Sign out",
  ]);
  assert.equal(
    await popup
      .getByRole("menuitem", { name: "Sign out", exact: true })
      .getAttribute("aria-disabled"),
    "true",
  );
  const bounds = await popup.boundingBox();
  assert.ok(
    bounds && bounds.x >= -1 && bounds.x + bounds.width <= width + 1,
    "Dropdown docs popup fits",
  );
  if (evidence) {
    await page.screenshot({
      path: path.join(evidence, `docs-dropdown-open-${theme}-${width}.png`),
      animations: "disabled",
    });
  }
  await page.keyboard.press("Escape");
  await popup.waitFor({ state: "hidden" });
  assert.equal(await trigger.evaluate((node) => node === document.activeElement), true);
}

/** ContextMenuExampleHero is the first preview and owns the Context Menu docs captures. */
export async function verifyContextMenuDocsExample({ page, evidence, width, theme }) {
  const example = page.locator('[data-docs-example="context-menu"]');
  const preview = example.locator("[data-docs-preview]");
  const trigger = preview.locator("[data-sw-context-menu-trigger]");
  await trigger.evaluate((node) => node.scrollIntoView({ block: "center" }));
  assert.equal(await trigger.evaluate((node) => node.tagName), "DIV");
  assert.match(await trigger.textContent(), /Right click here/);
  if (evidence) {
    await preview.screenshot({
      path: path.join(evidence, `docs-context-menu-${theme}-${width}.png`),
      animations: "disabled",
    });
  }
  await trigger.click({ button: "right", position: { x: 16, y: 16 } });
  const popup = page.getByRole("menu").filter({ hasText: "Show Bookmarks" });
  await popup.waitFor({ state: "visible" });
  await popup.evaluate(async (node) => {
    for (let frame = 0; frame < 5; frame++) await new Promise(requestAnimationFrame);
    await Promise.all(node.getAnimations().map((animation) => animation.finished));
  });
  assert.equal(
    await popup.getByRole("menuitem", { name: /Forward/ }).getAttribute("aria-disabled"),
    "true",
  );
  assert.equal(
    await popup
      .getByRole("menuitemcheckbox", { name: "Show Bookmarks" })
      .getAttribute("aria-checked"),
    "true",
  );
  assert.equal(
    await popup
      .getByRole("menuitemcheckbox", { name: "Show Full URLs" })
      .getAttribute("aria-checked"),
    "false",
  );
  const bounds = await popup.boundingBox();
  assert.ok(
    bounds &&
      bounds.x >= -1 &&
      bounds.x + bounds.width <= width + 1 &&
      bounds.y >= -1 &&
      bounds.y + bounds.height <= 1001,
    "Context Menu docs popup fits " + JSON.stringify(bounds),
  );
  if (evidence) {
    await page.screenshot({
      path: path.join(evidence, `docs-context-menu-open-${theme}-${width}.png`),
      animations: "disabled",
    });
  }
  await page.keyboard.press("Escape");
  await popup.waitFor({ state: "hidden" });
  assert.equal(await trigger.evaluate((node) => node === document.activeElement), true);
}

/** The first documentation navigation preview owns the Navigation Menu docs captures. */
export async function verifyNavigationMenuDocsExample({ page, evidence, width, theme }) {
  const example = page.locator('[data-docs-example="navigation-menu"]');
  const preview = example.locator("[data-docs-preview]");
  const menu = preview.getByRole("navigation", { name: "Documentation navigation" });
  const trigger = menu.getByRole("button", { name: "Getting started", exact: true });
  await trigger.evaluate((node) => node.scrollIntoView({ block: "center" }));
  assert.equal(
    await menu.getByRole("button", { name: "Components", exact: true }).isVisible(),
    width >= 768,
  );
  assert.equal(await menu.getByRole("button", { name: "With icon", exact: true }).count(), 1);
  assert.equal(await menu.getByRole("link", { name: "Docs", exact: true }).count(), 1);
  assert.match(
    await example.locator(".source-example code").textContent(),
    /navigationMenuTriggerStyle/,
  );
  const previewBounds = await preview.boundingBox();
  const controls = await menu.locator("button,a").evaluateAll((nodes) =>
    nodes
      .map((node) => node.getBoundingClientRect())
      .filter((rect) => rect.width > 0)
      .map(({ x, width }) => ({ x, width })),
  );
  assert.ok(
    previewBounds &&
      controls.every(
        (rect) =>
          rect.x >= previewBounds.x && rect.x + rect.width <= previewBounds.x + previewBounds.width,
      ),
    "Navigation Menu docs controls fit inside their preview frame: " +
      JSON.stringify({ previewBounds, controls }),
  );
  if (evidence) {
    await preview.screenshot({
      path: path.join(evidence, `docs-navigation-menu-${theme}-${width}.png`),
      animations: "disabled",
    });
  }
  await trigger.click();
  const popup = page.locator(`[id="${await trigger.getAttribute("aria-controls")}"]`);
  await popup.waitFor({ state: "visible" });
  await popup.evaluate(async (node) => {
    for (let frame = 0; frame < 5; frame++) await new Promise(requestAnimationFrame);
    await Promise.all(node.getAnimations().map((animation) => animation.finished));
  });
  assert.deepEqual(
    (await popup.getByRole("link").allTextContents()).map((text) =>
      text.trim().replace(/\s+/g, " "),
    ),
    [
      "Introduction Reusable components built with Tailwind CSS.",
      "Installation How to install dependencies and structure your app.",
      "Theming Customize colors, typography, and design tokens.",
    ],
  );
  const bounds = await popup.boundingBox();
  assert.ok(
    bounds && bounds.x >= -1 && bounds.x + bounds.width <= width + 1,
    "Navigation Menu docs popup fits " + JSON.stringify(bounds),
  );
  const frame = await preview.boundingBox();
  const rootBounds = await menu.boundingBox();
  assert.ok(
    frame && bounds && bounds.x >= frame.x && bounds.x + bounds.width <= frame.x + frame.width,
    "Navigation Menu docs popup fits its preview frame",
  );
  assert.ok(
    frame && rootBounds && rootBounds.width <= frame.width,
    "Navigation Menu docs trigger row fits its frame",
  );
  if (evidence) {
    await page.screenshot({
      path: path.join(evidence, `docs-navigation-menu-open-${theme}-${width}.png`),
      animations: "disabled",
    });
  }
  await page.keyboard.press("Escape");
  await popup.waitFor({ state: "hidden" });
  assert.equal(await trigger.evaluate((node) => node === document.activeElement), true);
  const statusTrigger = menu.getByRole("button", { name: "With icon", exact: true });
  await statusTrigger.click();
  const statusPopup = page.locator(`[id="${await statusTrigger.getAttribute("aria-controls")}"]`);
  await statusPopup.waitFor({ state: "visible" });
  await page.waitForTimeout(250);
  await statusPopup.getByRole("link", { name: /Backlog/ }).click();
  await statusPopup.waitFor({ state: "hidden" });
  assert.equal(await statusTrigger.getAttribute("aria-expanded"), "false");
  assert.equal(new URL(page.url()).hash, "#navigation-menu-review");
}

/** Stock Carousel layout and controls share this focused review owner. */
export async function verifyCarouselDocsExample({ page, evidence, width, theme }) {
  const preview = page.locator('[data-docs-example="carousel"] [data-docs-preview]');
  for (const orientation of ["horizontal", "vertical"]) {
    const example = preview.locator(`[data-carousel-example="${orientation}"]`);
    const root = example.locator('[data-slot="carousel"]');
    const previous = root.getByRole("button", { name: "Previous slide" });
    const next = root.getByRole("button", { name: "Next slide" });
    const selection = example.locator("[data-carousel-selection]");
    await page.waitForFunction(
      (axis) =>
        document.querySelector(`[data-carousel-example="${axis}"] [data-slot="carousel-previous"]`)
          ?.disabled,
      orientation,
    );
    assert.equal(await root.getAttribute("data-axis"), orientation === "vertical" ? "y" : "x");
    assert.equal(
      await root
        .locator('[data-slot="carousel-container"]')
        .evaluate((node) => getComputedStyle(node).flexDirection),
      orientation === "vertical" ? "column" : "row",
    );
    assert.equal(
      await root
        .locator('[data-slot="carousel-content"]')
        .evaluate((node) => getComputedStyle(node).overflow),
      "hidden",
    );
    assert.equal(await next.evaluate((node) => getComputedStyle(node).width), "32px");
    assert.equal(await previous.isDisabled(), true);
    assert.equal(await next.isEnabled(), true);
    const frame = await preview.boundingBox();
    assert.ok(frame);
    for (const control of [previous, next]) {
      const bounds = await control.boundingBox();
      assert.ok(
        bounds &&
          bounds.x >= frame.x &&
          bounds.x + bounds.width <= frame.x + frame.width &&
          bounds.y >= frame.y &&
          bounds.y + bounds.height <= frame.y + frame.height,
        `${orientation} controls fit their preview`,
      );
    }
    await next.focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(
      (axis) =>
        document
          .querySelector(`[data-carousel-example="${axis}"] [data-carousel-selection]`)
          ?.textContent.includes("Slide 2 of 3"),
      orientation,
    );
    assert.equal(await previous.isEnabled(), true);
    await next.click();
    await page.waitForFunction(
      (axis) =>
        document.querySelector(`[data-carousel-example="${axis}"] [data-slot="carousel-next"]`)
          ?.disabled,
      orientation,
    );
    assert.match(await selection.textContent(), /Slide 3 of 3/);
    await previous.click();
    await page.waitForFunction(
      (axis) =>
        document
          .querySelector(`[data-carousel-example="${axis}"] [data-carousel-selection]`)
          ?.textContent.includes("Slide 2 of 3"),
      orientation,
    );
    assert.match(await selection.textContent(), /Slide 2 of 3/);
    await page.waitForFunction((axis) => {
      const root = document.querySelector(
        `[data-carousel-example="${axis}"] [data-slot="carousel"]`,
      );
      const viewport = root.querySelector('[data-slot="carousel-content"]').getBoundingClientRect();
      const card = root
        .querySelectorAll('[data-slot="carousel-item"]')[1]
        .firstElementChild.getBoundingClientRect();
      return Math.abs(axis === "vertical" ? card.y - viewport.y : card.x - viewport.x) < 1;
    }, orientation);
  }
  if (evidence)
    await preview.screenshot({
      path: path.join(evidence, `docs-carousel-controls-${theme}-${width}.png`),
      animations: "disabled",
    });
  const custom = page.locator('[data-styled-review="carousel"] [data-additional-examples]');
  assert.equal(await custom.locator('[data-slot="carousel-item"]').count(), 2);
  await custom.getByRole("button", { name: "Add a slide" }).click();
  assert.equal(await custom.locator('[data-slot="carousel-item"]').count(), 3);
}

/** Keep an active service-owned Toast visible during the focused capture. */
export async function verifyToastDocsExample({ page, evidence, width, theme }) {
  const preview = page.locator('[data-docs-example="toast"] [data-docs-preview]');
  const viewport = page.locator('[data-slot="toast-viewport"]');
  const notify = preview.getByRole("button", { name: "Show notification", exact: true });
  const motion = {};
  async function sampleEntry(button) {
    await page.mouse.move(0, 0);
    await button.click({ trial: true });
    const samples = await button.evaluate(async (button) => {
      button.click();
      const samples = [];
      const started = performance.now();
      while (performance.now() - started < 450) {
        await new Promise(requestAnimationFrame);
        const item = document.querySelector('[data-slot="toast-viewport"] [data-toast-id]');
        const style = getComputedStyle(item);
        samples.push({ y: item.getBoundingClientRect().y, opacity: Number(style.opacity) });
      }
      return samples;
    });
    assert.ok(
      samples.filter(({ opacity }) => opacity > 0 && opacity < 0.99).length >= 3,
      "Toast entry has intermediate opacity frames",
    );
    const direction = (await viewport.getAttribute("data-position")).startsWith("top") ? -1 : 1;
    assert.ok(
      direction * (samples[0].y - samples.at(-1).y) > 20,
      "Toast slides in from its viewport edge",
    );
    assert.equal(samples.at(-1).opacity, 1);
    return samples;
  }
  motion.notification = await sampleEntry(notify);
  const notification = viewport.locator('[data-toast-id="review-toast"]');
  await notification.waitFor({ state: "visible" });
  assert.equal(await viewport.count(), 1);
  assert.equal(await viewport.locator("template[data-sw-toast-template]").count(), 6);
  assert.equal(await viewport.getAttribute("data-position"), "bottom-right");
  assert.equal(await viewport.evaluate((node) => getComputedStyle(node).position), "fixed");
  assert.equal(
    await notification.locator('[data-slot="toast-title-text"]').textContent(),
    "Changes saved",
  );
  const action = notification.getByRole("button", { name: "Undo", exact: true });
  await action.focus();
  await page.keyboard.press("Enter");
  await notification.waitFor({ state: "detached" });
  assert.equal(await preview.locator("[data-toast-status]").textContent(), "Changes restored.");

  motion.success = await sampleEntry(
    preview.getByRole("button", { name: "Prepare export", exact: true }),
  );
  const success = viewport.locator('[data-toast-id][data-variant="success"]');
  await success.waitFor({ state: "visible" });
  assert.equal(
    await success.locator('[data-slot="toast-title-text"]').textContent(),
    "Export ready",
  );
  assert.equal(await success.locator('[data-slot="toast-title"] svg').count(), 1);
  motion.exit = await success
    .getByRole("button", { name: "Close notification", exact: true })
    .evaluate(async (button) => {
      const item = button.closest("[data-toast-id]");
      const samples = [
        { y: item.getBoundingClientRect().y, opacity: Number(getComputedStyle(item).opacity) },
      ];
      button.click();
      while (item.isConnected) {
        await new Promise(requestAnimationFrame);
        if (item.isConnected)
          samples.push({
            y: item.getBoundingClientRect().y,
            opacity: Number(getComputedStyle(item).opacity),
          });
      }
      return samples;
    });
  assert.ok(
    motion.exit.filter(({ opacity }) => opacity > 0 && opacity < 0.99).length >= 3,
    "Toast exit has intermediate opacity frames",
  );
  assert.ok(motion.exit.at(-1).y - motion.exit[0].y > 20, "Toast exits toward its viewport edge");
  await success.waitFor({ state: "detached" });

  const group = preview.getByRole("button", { name: "Show notification group", exact: true });
  const stacks = {};
  for (const position of ["bottom-right", "top-right"]) {
    await viewport.evaluate(
      (node, position) => node.setAttribute("data-position", position),
      position,
    );
    motion[position] = await sampleEntry(group);
    const items = viewport.locator("[data-toast-id]");
    assert.equal(await items.count(), 3);
    assert.equal(
      new Set(await items.evaluateAll((nodes) => nodes.map((node) => node.dataset.toastId))).size,
      3,
    );
    assert.equal(await items.first().getAttribute("data-variant"), "error");
    await items.first().hover();
    await page.waitForFunction(() => {
      const viewport = document.querySelector('[data-slot="toast-viewport"]');
      const items = [...viewport.querySelectorAll("[data-toast-id]")];
      return (
        viewport.hasAttribute("data-expanded") &&
        items.every(
          (item) =>
            item.hasAttribute("data-expanded") &&
            item.getAnimations().every((animation) => animation.playState === "finished"),
        )
      );
    });
    stacks[position] = await viewport.evaluate((viewport) => ({
      viewport: viewport.getBoundingClientRect().toJSON(),
      items: [...viewport.querySelectorAll("[data-toast-id]")].map((node) => ({
        rect: node.getBoundingClientRect().toJSON(),
        offset: Number.parseFloat(node.style.getPropertyValue("--toast-offset-y")),
      })),
    }));
    const bounds = stacks[position];
    let offset = 0;
    for (const { rect, offset: actualOffset } of bounds.items) {
      assert.ok(Math.abs(actualOffset - offset) <= 1, "Expanded offset includes the card height");
      assert.ok(
        rect.x >= 0 && rect.right <= width && rect.y >= 0 && rect.bottom <= 1000,
        "Expanded notification fits the viewport",
      );
      offset += rect.height + 12;
    }
    assert.ok(
      Math.abs(bounds.viewport.height - (offset - 12)) <= 1,
      "Expanded viewport contains every card and gap",
    );
    const sorted = bounds.items.map(({ rect }) => rect).sort((left, right) => left.y - right.y);
    for (let index = 1; index < sorted.length; index++) {
      assert.ok(
        sorted[index].y - sorted[index - 1].bottom >= 11,
        "Expanded notifications have the configured vertical gap",
      );
    }
    if (evidence) {
      await page.screenshot({
        path: path.join(evidence, `docs-toast-group-${position}-${theme}-${width}.png`),
      });
    }
    await preview.getByRole("button", { name: "Dismiss all", exact: true }).click();
    await items.first().waitFor({ state: "detached" });
    assert.equal(await items.count(), 0);
  }
  await viewport.evaluate((node) => node.setAttribute("data-position", "bottom-right"));
  if (evidence) {
    await writeFile(
      path.join(evidence, `docs-toast-motion-${theme}-${width}.json`),
      JSON.stringify({ motion, stacks }, null, 2),
    );
  }

  await preview.getByRole("button", { name: "Custom template", exact: true }).click();
  await notify.click();
  await notification.waitFor({ state: "visible" });
  assert.ok(await notification.evaluate((node) => node.hasAttribute("data-toast-custom")));
  assert.match(await notification.textContent(), /Workspace update/);
  await action.focus();
  await page.waitForFunction(() => {
    const toast = document.querySelector('[data-toast-id="review-toast"]');
    return (
      toast &&
      !toast.hasAttribute("data-starting-style") &&
      getComputedStyle(toast).opacity === "1" &&
      toast.getAnimations().every((animation) => animation.playState === "finished")
    );
  });
  const bounds = await notification.boundingBox();
  assert.ok(
    bounds &&
      bounds.width > 200 &&
      bounds.x >= 0 &&
      bounds.x + bounds.width <= width &&
      bounds.y >= 0 &&
      bounds.y + bounds.height <= 1000,
    "Active Toast fits the viewport",
  );
  assert.equal(await notification.evaluate((node) => getComputedStyle(node).borderRadius), "10px");
  if (evidence) {
    await page.screenshot({
      path: path.join(evidence, `docs-toast-active-${theme}-${width}.png`),
      animations: "disabled",
    });
    await notification.screenshot({
      path: path.join(evidence, `docs-toast-notification-${theme}-${width}.png`),
      animations: "disabled",
    });
  }
  await action.click();
  await notification.waitFor({ state: "detached" });
  await notify.click();
  await notification.waitFor({ state: "visible" });
  await preview.getByRole("button", { name: "Dismiss all", exact: true }).click();
  await notification.waitFor({ state: "detached" });
}

export async function verifyColorPickerDocsExample({ page, evidence, width, theme }) {
  const preview = page.locator('[data-docs-example="color-picker"] [data-docs-preview]');
  await preview.evaluate((node) => node.scrollIntoView({ block: "start" }));
  const popupExample = preview.locator('[data-color-picker-example="popup"]');
  const inline = preview.locator('[data-color-picker-example="inline"]');
  const trigger = popupExample.locator('[data-slot="color-picker-trigger"]');
  await trigger.click();
  const content = popupExample.locator('[data-slot="color-picker-content"]');
  await content.waitFor({ state: "visible" });
  await content.evaluate(async (node) => {
    for (let i = 0; i < 5; i++) await new Promise(requestAnimationFrame);
    await Promise.all(node.getAnimations().map((animation) => animation.finished));
  });
  const color = content.locator('[data-slot="color-picker-swatch"][aria-label="Blue"]');
  await color.click();
  assert.equal(
    (await popupExample.locator("[data-color-picker-value]").textContent()).trim(),
    "#2563eb",
  );
  assert.equal(
    await preview.locator("form").evaluate((form) => new FormData(form).get("accent")),
    "#2563eb",
  );
  await inline.locator("[data-sw-color-picker-format-select]").selectOption("hsl");
  assert.match(
    await inline.locator('[data-slot="color-picker-value-input"]').inputValue(),
    /^hsl\(/,
  );
  const style = await content.locator('[data-slot="color-picker-area"]').evaluate((node) => ({
    height: node.getBoundingClientRect().height,
    background: getComputedStyle(node.querySelector('[data-slot="color-picker-area-background"]'))
      .backgroundImage,
  }));
  assert.ok(
    style.height >= 140 && style.background.includes("gradient"),
    "Color Picker uses its stock area styles",
  );
  const bounds = await content.boundingBox();
  assert.ok(
    bounds && bounds.x >= -1 && bounds.x + bounds.width <= width + 1,
    "Color Picker popup fits the viewport",
  );
  if (evidence) {
    await preview.screenshot({
      path: path.join(evidence, `docs-color-picker-open-${theme}-${width}.png`),
      animations: "disabled",
    });
    await content.screenshot({
      path: path.join(evidence, `docs-color-picker-popup-${theme}-${width}.png`),
      animations: "disabled",
    });
    await inline.screenshot({
      path: path.join(evidence, `docs-color-picker-inline-${theme}-${width}.png`),
      animations: "disabled",
    });
  }
  await trigger.click();
  const custom = page.locator("[data-color-picker-custom]");
  await custom.getByRole("button", { name: "Teal", exact: true }).click();
  assert.equal(await custom.evaluate((form) => new FormData(form).get("custom-accent")), "#0d9488");
  await custom.getByRole("button", { name: "Clear selection", exact: true }).click();
  assert.equal(await custom.evaluate((form) => new FormData(form).get("custom-accent")), "");
}

export async function verifySidebarDocsExample({ page, evidence, width, theme }) {
  const desktopWidth = Math.max(width, 1200);
  await page.setViewportSize({ width: desktopWidth, height: 1000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  const sidebar = page.locator('[data-slot="sidebar"][data-state]');
  const toggle = page.locator("[data-workspace-toggle]");
  await page.waitForFunction(() =>
    document.querySelector('[data-slot="sidebar"][data-state="expanded"]'),
  );
  const container = page.locator('[data-slot="sidebar-container"]');
  assert.equal(await container.isVisible(), true);
  assert.ok(await container.evaluate((node) => getComputedStyle(node).position === "fixed"));
  const projects = container.getByRole("link", { name: "Projects", exact: true });
  await projects.click();
  assert.equal(new URL(page.url()).hash, "#projects");
  assert.equal(await projects.getAttribute("aria-current"), "page");
  await page.evaluate(() => window.scrollTo(0, 0));
  if (evidence)
    await page.screenshot({
      path: path.join(evidence, `docs-sidebar-desktop-${theme}-${desktopWidth}.png`),
      animations: "disabled",
    });
  await toggle.click();
  await page.waitForFunction(() =>
    document.querySelector(
      '[data-slot="sidebar"][data-state="collapsed"][data-collapsible="icon"]',
    ),
  );
  await page.waitForFunction(
    () => document.querySelector('[data-slot="sidebar-gap"]').getBoundingClientRect().width <= 72,
  );
  await projects.hover();
  const tooltip = page.getByRole("tooltip", { name: "Projects", exact: true });
  await tooltip.waitFor({ state: "visible" });
  assert.ok(await projects.getAttribute("aria-describedby"));
  if (evidence)
    await page.screenshot({
      path: path.join(evidence, `docs-sidebar-icon-${theme}-${desktopWidth}.png`),
      animations: "disabled",
    });
  await toggle.hover();
  await tooltip.waitFor({ state: "hidden" });
  await page.getByLabel("Remember desktop state").check();
  assert.ok(await page.evaluate(() => localStorage.getItem("review-sidebar-workspace") !== null));
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.waitForFunction(
    () =>
      document.querySelector('[data-slot="sidebar-container"]')?.getBoundingClientRect().width ===
      0,
  );
  await toggle.click();
  const dialog = page.getByRole("dialog", { name: "Sidebar", exact: true });
  await dialog.waitFor({ state: "visible" });
  await dialog.evaluate(async (node) => {
    for (let frame = 0; frame < 5; frame++) await new Promise(requestAnimationFrame);
    await Promise.all(node.getAnimations({ subtree: true }).map((animation) => animation.finished));
  });
  const mobileBounds = await dialog.boundingBox();
  assert.ok(
    mobileBounds && mobileBounds.x >= -1 && mobileBounds.x + mobileBounds.width <= 391,
    "Mobile navigation is inside the viewport",
  );
  assert.equal(await dialog.locator('a[href="#projects"]').count(), 1);
  assert.equal(await dialog.locator("button a").count(), 0);
  assert.equal(await page.locator("body").evaluate((node) => node.style.overflow), "hidden");
  if (evidence)
    await page.screenshot({
      path: path.join(evidence, `docs-sidebar-mobile-${theme}-390.png`),
      animations: "disabled",
    });
  await dialog.getByRole("button", { name: "Close workspace navigation", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  await page.waitForFunction(() => document.body.style.overflow !== "hidden");
  await page.setViewportSize({ width: desktopWidth, height: 1000 });
  await container.waitFor({ state: "visible" });
  assert.equal(await sidebar.getAttribute("data-state"), "collapsed");
  await toggle.click();
  await page.waitForFunction(() =>
    document.querySelector('[data-slot="sidebar"][data-state="expanded"]'),
  );
  // Route replacement releases the document tooltip owner and the closed Sheet.
  await page.getByRole("link", { name: "Component catalog", exact: true }).first().click();
  await page.waitForURL("**/review/");
  await page.waitForFunction(
    () => !document.documentElement.hasAttribute("data-starwind-sidebar-tooltips"),
  );
  assert.equal(await page.locator("body").evaluate((node) => node.style.overflow), "");
}
