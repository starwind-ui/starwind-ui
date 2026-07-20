import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptRoot, "../../../../..");
const demoRoot = path.join(repoRoot, "apps/vue-demo");
const host = "127.0.0.1";
const demoRequire = createRequire(path.join(demoRoot, "package.json"));
const { chromium } = demoRequire("playwright");
const { preview } = await import(pathToFileURL(demoRequire.resolve("vite")).href);

const server = await preview({
  logLevel: "silent",
  preview: { host, port: 5190, strictPort: false },
  root: demoRoot,
});
let browser;
let page;
const messages = [];
const visualEvidence = {
  dark: path.join(os.tmpdir(), "starwind-vue-display-layout-dark.png"),
  light: path.join(os.tmpdir(), "starwind-vue-display-layout-light.png"),
};

try {
  const baseUrl = server.resolvedUrls?.local[0] ?? `http://${host}:5190/`;
  browser = await chromium.launch({ headless: true });
  page = await browser.newPage({ viewport: { height: 1000, width: 1440 } });
  page.on("console", (message) => {
    if (message.type() === "error") messages.push(`console error: ${message.text()}`);
  });
  page.on("pageerror", (error) => messages.push(`page error: ${error.stack ?? error.message}`));
  page.on("requestfailed", (request) => {
    messages.push(
      `request failed: ${request.url()} (${request.failure()?.errorText ?? "unknown error"})`,
    );
  });
  page.on("response", (response) => {
    if (response.status() >= 400) messages.push(`HTTP ${response.status()}: ${response.url()}`);
  });

  await page.addInitScript(() => {
    if (sessionStorage.getItem("starwind-vue-smoke-theme-seeded")) return;
    localStorage.setItem("colorTheme", "light");
    sessionStorage.setItem("starwind-vue-smoke-theme-seeded", "true");
  });

  await page.goto(new URL("/review", baseUrl).toString(), { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Starwind Vue adapter review" }).waitFor();
  await assertNoErrors(messages);

  await verifyButton(page);
  await verifyCheckbox(page);
  await verifySelect(page);
  await verifyStyled(page);
  const avatarProof = await verifyAvatar(page);
  const progressProof = await verifyProgress(page);
  const scrollAreaProof = await verifyScrollArea(page);
  await captureReviewEvidence(page, visualEvidence.light);
  const themeProof = await verifyTheme(page);
  await verifyAvatarDark(page, avatarProof);
  await verifyProgressDark(page, progressProof);
  await verifyScrollAreaDark(page, scrollAreaProof);
  await captureReviewEvidence(page, visualEvidence.dark);
  await assertNoErrors(messages);

  await page.goto(new URL("/", baseUrl).toString(), { waitUntil: "networkidle" });
  await page.getByTestId("vue-review-index").waitFor();
  await verifyPersistentHeader(page, "index");
  await verifyIndexDarkTheme(page, themeProof);
  await assertNoErrors(messages);

  console.log(
    `Vue production demo smoke passed at ${new URL("/review", baseUrl)}. Visual evidence: ${visualEvidence.light}, ${visualEvidence.dark}`,
  );
} catch (error) {
  throw new Error(
    `${error instanceof Error ? error.message : String(error)}\n\n${await describeFailure(
      page,
      messages,
    )}`,
  );
} finally {
  await browser?.close();
  await server.close();
}

async function verifyAvatar(page) {
  await page.waitForFunction(
    () =>
      document
        .querySelector('[data-testid="avatar-primitive-root"]')
        ?.getAttribute("data-image-loading-status") === "loaded" &&
      document
        .querySelector('[data-testid="avatar-styled-loaded"]')
        ?.getAttribute("data-image-loading-status") === "loaded" &&
      document
        .querySelector('[data-testid="avatar-styled-error"]')
        ?.getAttribute("data-image-loading-status") === "error",
  );
  const loaded = page.getByTestId("avatar-styled-loaded");
  const loadedImage = page.getByTestId("avatar-styled-loaded-image");
  const loadedFallback = page.getByTestId("avatar-styled-loaded-fallback");
  const errorFallback = page.getByTestId("avatar-error-fallback");
  const delayedFallback = page.getByTestId("avatar-delayed-fallback");

  await assertEqual(await loaded.getAttribute("data-avatar-attr"), "forwarded", "Avatar attr");
  await assertEqual(await loadedImage.isVisible(), true, "loaded Avatar image");
  await assertEqual(await loadedFallback.isHidden(), true, "loaded Avatar fallback");
  await assertEqual(await errorFallback.isVisible(), true, "error Avatar fallback");
  await assertEqual(await delayedFallback.getAttribute("data-delay"), "160", "Avatar delay");
  await page.waitForFunction(
    () => !document.querySelector('[data-testid="avatar-delayed-fallback"]')?.hidden,
  );
  await assertText(
    page.getByTestId("avatar-primitive-status"),
    "status: loaded",
    "Primitive Avatar event",
  );
  await assertText(
    page.getByTestId("avatar-styled-status"),
    "status: loaded",
    "Styled Avatar event",
  );
  await assertText(
    page.getByTestId("avatar-ref-state"),
    "refs: SPAN/IMG/SPAN",
    "Styled Avatar refs",
  );
  await assertEqual(
    await page.getByTestId("avatar-variants").locator('[data-slot="avatar"]').count(),
    4,
    "Avatar multiple variants",
  );
  for (const [testId, expectedSize] of [
    ["avatar-size-sm", 32],
    ["avatar-size-md", 40],
    ["avatar-size-lg", 48],
  ]) {
    const bounds = await page.getByTestId(testId).boundingBox();
    if (!bounds) throw new Error(`${testId}: expected a visible Avatar bounding box`);
    if (
      Math.abs(bounds.width - expectedSize) > 0.5 ||
      Math.abs(bounds.height - expectedSize) > 0.5
    ) {
      throw new Error(
        `${testId}: expected ${expectedSize}x${expectedSize}, received ${bounds.width}x${bounds.height}`,
      );
    }
  }

  const lightVisuals = await page.getByTestId("avatar-styled-error").evaluate((root) => {
    const fallback = root.querySelector('[data-slot="avatar-fallback"]');
    if (!(fallback instanceof HTMLElement)) throw new Error("Avatar fallback was not rendered.");
    const rootRect = root.getBoundingClientRect();
    const fallbackRect = fallback.getBoundingClientRect();
    const rootStyle = getComputedStyle(root);
    const fallbackStyle = getComputedStyle(fallback);
    return {
      centerDelta: Math.hypot(
        rootRect.left + rootRect.width / 2 - (fallbackRect.left + fallbackRect.width / 2),
        rootRect.top + rootRect.height / 2 - (fallbackRect.top + fallbackRect.height / 2),
      ),
      fallbackAlignItems: fallbackStyle.alignItems,
      fallbackColor: fallbackStyle.color,
      fallbackDisplay: fallbackStyle.display,
      fallbackJustifyContent: fallbackStyle.justifyContent,
      rootBackground: rootStyle.backgroundColor,
      rootDisplay: rootStyle.display,
    };
  });
  await assertEqual(lightVisuals.rootDisplay, "inline-flex", "Avatar generated root display");
  await assertEqual(lightVisuals.fallbackDisplay, "flex", "Avatar fallback display");
  await assertEqual(
    lightVisuals.fallbackAlignItems,
    "center",
    "Avatar fallback cross-axis centering",
  );
  await assertEqual(
    lightVisuals.fallbackJustifyContent,
    "center",
    "Avatar fallback main-axis centering",
  );
  if (lightVisuals.centerDelta > 0.5) {
    throw new Error(
      `Avatar fallback center: expected centers within 0.5px, received ${lightVisuals.centerDelta}px`,
    );
  }

  await page.getByTestId("avatar-remount-toggle").click();
  await assertEqual(await page.getByTestId("avatar-remount-instance").count(), 0, "Avatar unmount");
  await page.getByTestId("avatar-remount-toggle").click();
  await assertEqual(await page.getByTestId("avatar-remount-instance").count(), 1, "Avatar remount");
  await page.waitForFunction(
    () =>
      document
        .querySelector('[data-testid="avatar-remount-instance"]')
        ?.getAttribute("data-image-loading-status") === "error",
  );
  await assertEqual(
    await page.getByTestId("avatar-remount-fallback").isVisible(),
    true,
    "Avatar remount fallback",
  );

  return lightVisuals;
}

async function verifyProgress(page) {
  const primitive = page.getByTestId("progress-primitive-root");
  const controlled = page.getByTestId("progress-controlled");
  const controlledIndicator = controlled.locator('[data-slot="progress-indicator"]');
  await assertEqual(
    await primitive.getAttribute("aria-valuenow"),
    "42",
    "Primitive Progress value",
  );
  await assertEqual(
    await primitive.getAttribute("aria-labelledby"),
    "primitive-progress-label",
    "Primitive Progress label",
  );
  await assertText(page.getByTestId("progress-primitive-value"), "42%", "Primitive Progress text");
  await assertEqual(await controlled.getAttribute("data-forwarded"), "progress", "Progress attr");
  await assertEqual(
    await controlled.getAttribute("aria-label"),
    "Processed files",
    "Progress label",
  );
  await assertEqual(await controlled.getAttribute("aria-valuenow"), "35", "Progress start value");
  await assertEqual(
    await controlledIndicator.getAttribute("style"),
    "transform: translateX(-65%);",
    "Progress initial transform",
  );
  await assertText(page.getByTestId("progress-ref-state"), "ref: DIV", "Styled Progress ref");

  await page.getByTestId("progress-increment").click();
  await assertEqual(await controlled.getAttribute("aria-valuenow"), "50", "Progress updated value");
  await assertText(
    page.getByTestId("progress-controlled-state"),
    "value: 50",
    "Progress parent state",
  );
  await assertEqual(
    await controlledIndicator.getAttribute("style"),
    "transform: translateX(-50%);",
    "Progress updated transform",
  );
  const controlledTransitionDuration = await controlledIndicator.evaluate(
    (element) => getComputedStyle(element).transitionDuration,
  );
  if (!controlledTransitionDuration.split(",").some((duration) => parseFloat(duration) > 0)) {
    throw new Error(
      `Progress determinate transition: expected a non-zero duration, received ${controlledTransitionDuration}`,
    );
  }
  await page.waitForTimeout(200);
  await assertProgressVisiblePercent(controlled, 50, "Progress settled determinate update");

  const indeterminate = page.getByTestId("progress-indeterminate");
  await assertEqual(
    await indeterminate.getAttribute("data-indeterminate"),
    "",
    "Progress indeterminate marker",
  );
  await assertEqual(
    await indeterminate.getAttribute("aria-valuenow"),
    null,
    "Progress indeterminate ARIA",
  );
  await assertProgressVisiblePercent(indeterminate, 75, "Progress initial indeterminate geometry");
  await page.getByTestId("progress-indeterminate-toggle").click();
  await assertEqual(
    await indeterminate.getAttribute("data-indeterminate"),
    null,
    "Progress determinate marker",
  );
  await assertEqual(
    await indeterminate.getAttribute("aria-valuenow"),
    "60",
    "Progress determinate update",
  );
  await assertProgressVisiblePercent(indeterminate, 60, "Progress instant determinate mode switch");
  await page.waitForFunction(
    () =>
      !document
        .querySelector('[data-testid="progress-indeterminate"] [data-slot="progress-indicator"]')
        ?.hasAttribute("data-instant"),
  );
  await page.getByTestId("progress-indeterminate-toggle").click();
  await assertEqual(
    await indeterminate.getAttribute("data-indeterminate"),
    "",
    "Progress restored indeterminate marker",
  );
  await assertProgressVisiblePercent(
    indeterminate,
    75,
    "Progress instant indeterminate mode switch",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  const reducedMotionProperty = await controlledIndicator.evaluate(
    (element) => getComputedStyle(element).transitionProperty,
  );
  if (reducedMotionProperty !== "none") {
    throw new Error(
      `Progress reduced motion: expected no transitioned property, received ${reducedMotionProperty}`,
    );
  }
  await page.emulateMedia({ reducedMotion: "no-preference" });

  const range = page.getByTestId("progress-range");
  await assertEqual(await range.getAttribute("aria-valuemin"), "20", "Progress range min");
  await assertEqual(await range.getAttribute("aria-valuemax"), "80", "Progress range max");
  await assertEqual(await range.getAttribute("aria-valuenow"), "50", "Progress range value");
  await assertEqual(
    await range.locator('[data-slot="progress-indicator"]').getAttribute("style"),
    "transform: translateX(-50%);",
    "Progress range transform",
  );
  for (const [name, expected] of Object.entries({
    reversed: ["0", "100", "25", "progressing", "transform: translateX(-75%);"],
    "equal-complete": ["10", "10", "10", "complete", "transform: translateX(0%);"],
    "equal-progressing": ["10", "10", "10", "complete", "transform: translateX(0%);"],
    "invalid-bounds": ["0", "100", "25", "progressing", "transform: translateX(-75%);"],
  })) {
    const progress = page.getByTestId(`progress-${name}`);
    const received = [
      await progress.getAttribute("aria-valuemin"),
      await progress.getAttribute("aria-valuemax"),
      await progress.getAttribute("aria-valuenow"),
      await progress.getAttribute("data-status"),
      await progress.locator('[data-slot="progress-indicator"]').getAttribute("style"),
    ];
    await assertEqual(JSON.stringify(received), JSON.stringify(expected), `Progress ${name}`);
  }
  for (const name of ["nan", "positive-infinity", "negative-infinity"]) {
    const progress = page.getByTestId(`progress-${name}`);
    await assertEqual(
      await progress.getAttribute("data-status"),
      "indeterminate",
      `Progress ${name} status`,
    );
    await assertEqual(await progress.getAttribute("aria-valuenow"), null, `Progress ${name} value`);
    await assertEqual(
      await progress.locator('[data-slot="progress-indicator"]').getAttribute("style"),
      null,
      `Progress ${name} transform`,
    );
  }
  await assertEqual(
    await page.getByTestId("progress-variants").locator('[data-slot="progress"]').count(),
    7,
    "Progress variants",
  );

  const lightVisuals = await controlled.evaluate((root) => {
    const indicator = root.querySelector('[data-slot="progress-indicator"]');
    if (!(indicator instanceof HTMLElement))
      throw new Error("Progress indicator was not rendered.");
    const rootStyle = getComputedStyle(root);
    const indicatorStyle = getComputedStyle(indicator);
    const rect = root.getBoundingClientRect();
    return {
      height: rect.height,
      indicatorBackground: indicatorStyle.backgroundColor,
      rootBackground: rootStyle.backgroundColor,
      width: rect.width,
    };
  });
  if (lightVisuals.width <= 0 || Math.abs(lightVisuals.height - 8) > 0.5) {
    throw new Error(
      `Progress dimensions were not visually faithful: ${JSON.stringify(lightVisuals)}`,
    );
  }
  if (lightVisuals.indicatorBackground === lightVisuals.rootBackground) {
    throw new Error(`Progress indicator lacks contrast: ${JSON.stringify(lightVisuals)}`);
  }

  await page.getByTestId("progress-remount-toggle").click();
  await assertEqual(
    await page.getByTestId("progress-remount-instance").count(),
    0,
    "Progress unmount",
  );
  await page.getByTestId("progress-remount-toggle").click();
  await assertEqual(
    await page.getByTestId("progress-remount-instance").count(),
    1,
    "Progress remount",
  );
  await assertEqual(
    await page.getByTestId("progress-remount-instance").getAttribute("aria-valuenow"),
    "70",
    "Progress remount value",
  );

  return lightVisuals;
}

async function verifyProgressDark(page, lightTokens) {
  const darkTokens = await page.getByTestId("progress-controlled").evaluate((root) => {
    const indicator = root.querySelector('[data-slot="progress-indicator"]');
    if (!(indicator instanceof HTMLElement))
      throw new Error("Progress indicator was not rendered.");
    return {
      indicatorBackground: getComputedStyle(indicator).backgroundColor,
      rootBackground: getComputedStyle(root).backgroundColor,
    };
  });
  if (darkTokens.rootBackground === lightTokens.rootBackground) {
    throw new Error(
      `Progress track token did not change in dark mode: ${JSON.stringify(darkTokens)}`,
    );
  }
  if (darkTokens.indicatorBackground === darkTokens.rootBackground) {
    throw new Error(`Dark Progress indicator lacks contrast: ${JSON.stringify(darkTokens)}`);
  }
}

async function verifyScrollArea(page) {
  await page.waitForFunction(
    () => {
      const vertical = document.querySelector('[data-testid="scroll-area-vertical"]');
      const horizontal = document.querySelector('[data-testid="scroll-area-horizontal"]');
      const dual = document.querySelector('[data-testid="scroll-area-dual"]');
      return (
        vertical?.hasAttribute("data-overflow-y-end") &&
        horizontal?.hasAttribute("data-overflow-x-end") &&
        dual?.hasAttribute("data-overflow-x-end") &&
        dual?.hasAttribute("data-overflow-y-end")
      );
    },
    undefined,
    { timeout: 5_000 },
  );
  await assertText(
    page.getByTestId("scroll-area-ref-state"),
    "ref: DIV",
    "Scroll Area exposed ref",
  );

  const vertical = page.getByTestId("scroll-area-vertical");
  const verticalViewport = vertical.locator('[data-slot="scroll-area-viewport"]');
  const verticalScrollbar = vertical.locator(
    '[data-slot="scroll-area-scrollbar"][data-orientation="vertical"]',
  );
  await assertEqual(
    await verticalViewport
      .getAttribute("class")
      .then((value) => value?.includes("custom-viewport-class")),
    true,
    "Scroll Area viewportClass",
  );
  await assertEqual(await verticalScrollbar.isVisible(), true, "vertical scrollbar visibility");
  await assertScrollGeometry(verticalViewport, "vertical");
  const lightFocusTreatment = await focusScrollAreaViewportWithKeyboard(page, verticalViewport);
  assertScrollAreaFocusTreatment(lightFocusTreatment, "light");
  await page.keyboard.press("ArrowDown");
  await page.waitForFunction(
    () => {
      const viewport = document.querySelector(
        '[data-testid="scroll-area-vertical"] [data-slot="scroll-area-viewport"]',
      );
      return viewport === document.activeElement && (viewport?.scrollTop ?? 0) > 0;
    },
    undefined,
    { timeout: 2_000 },
  );
  await assertEqual(
    await vertical.getAttribute("data-overflow-y-start"),
    "",
    "vertical scroll state",
  );

  const horizontal = page.getByTestId("scroll-area-horizontal");
  const horizontalViewport = horizontal.locator('[data-slot="scroll-area-viewport"]');
  const horizontalScrollbar = horizontal.locator(
    '[data-slot="scroll-area-scrollbar"][data-orientation="horizontal"]',
  );
  await assertEqual(
    await horizontal.locator('[data-slot="scroll-area-scrollbar"]').count(),
    1,
    "horizontal custom scrollbar count",
  );
  await assertScrollGeometry(horizontalViewport, "horizontal");
  await horizontalViewport.evaluate((element) => {
    element.scrollLeft = 96;
    element.dispatchEvent(new Event("scroll"));
  });
  await page.waitForFunction(() =>
    document
      .querySelector('[data-testid="scroll-area-horizontal"]')
      ?.hasAttribute("data-overflow-x-start"),
  );

  const dual = page.getByTestId("scroll-area-dual");
  await assertEqual(
    await dual.locator('[data-slot="scroll-area-scrollbar"]').count(),
    2,
    "dual scrollbar count",
  );
  const corner = dual.locator('[data-slot="scroll-area-corner"]');
  await assertEqual(await corner.isVisible(), true, "dual corner visibility");
  await dual.locator('[data-slot="scroll-area-viewport"]').evaluate((element) => {
    element.scrollLeft = 80;
    element.scrollTop = 70;
    element.dispatchEvent(new Event("scroll"));
  });
  await page.waitForFunction(
    () => {
      const root = document.querySelector('[data-testid="scroll-area-dual"]');
      return (
        root?.hasAttribute("data-overflow-x-start") && root?.hasAttribute("data-overflow-y-start")
      );
    },
    undefined,
    { timeout: 2_000 },
  );

  const custom = page.getByTestId("scroll-area-custom");
  await assertEqual(
    await custom.locator('[data-slot="scroll-area-viewport"]').count(),
    1,
    "custom viewport count",
  );
  await assertEqual(
    await custom.locator('[data-slot="scroll-area-content"]').count(),
    1,
    "custom content count",
  );
  await assertEqual(
    await custom.locator('[data-slot="scroll-area-scrollbar"]').count(),
    2,
    "custom scrollbar count",
  );
  await assertEqual(
    await custom.locator('[data-slot="scroll-area-thumb"]').count(),
    2,
    "custom thumb count",
  );
  await assertEqual(
    await custom.locator('[data-slot="scroll-area-corner"]').count(),
    1,
    "custom corner count",
  );
  await assertEqual(
    await custom
      .locator('[data-slot="scroll-area-viewport"]')
      .getAttribute("class")
      .then((value) => value?.includes("custom-standalone-viewport")),
    true,
    "custom standalone viewport class",
  );

  const resize = page.getByTestId("scroll-area-resize");
  const resizeScrollbar = resize.locator('[data-slot="scroll-area-scrollbar"]');
  await assertEqual(await resizeScrollbar.isHidden(), true, "resize initial scrollbar");
  await page.getByTestId("scroll-area-resize-toggle").click();
  await page.waitForFunction(
    () =>
      document
        .querySelector('[data-testid="scroll-area-resize"]')
        ?.hasAttribute("data-overflow-y-end"),
    undefined,
    { timeout: 2_000 },
  );
  await assertEqual(await resizeScrollbar.isVisible(), true, "resize grown scrollbar");
  await page.getByTestId("scroll-area-resize-toggle").click();
  await page.waitForFunction(
    () =>
      !document
        .querySelector('[data-testid="scroll-area-resize"]')
        ?.hasAttribute("data-overflow-y-end"),
    undefined,
    { timeout: 2_000 },
  );
  await assertEqual(await resizeScrollbar.isHidden(), true, "resize shrunk scrollbar");

  const instanceOne = page.getByTestId("scroll-area-instance-one");
  const instanceTwo = page.getByTestId("scroll-area-instance-two");
  await instanceOne.locator('[data-slot="scroll-area-viewport"]').evaluate((element) => {
    element.scrollTop = 60;
    element.dispatchEvent(new Event("scroll"));
  });
  await page.waitForFunction(() =>
    document
      .querySelector('[data-testid="scroll-area-instance-one"]')
      ?.hasAttribute("data-overflow-y-start"),
  );
  await assertEqual(
    await instanceTwo.getAttribute("data-overflow-y-start"),
    null,
    "Scroll Area instance isolation",
  );

  await page.getByTestId("scroll-area-cleanup-toggle").click();
  await assertEqual(
    await page.getByTestId("scroll-area-cleanup-instance").count(),
    0,
    "Scroll Area cleanup DOM",
  );
  await page.getByTestId("scroll-area-cleanup-toggle").click();
  await page.waitForFunction(() =>
    document
      .querySelector('[data-testid="scroll-area-cleanup-instance"]')
      ?.hasAttribute("data-overflow-y-end"),
  );
  await assertEqual(
    await page.getByTestId("scroll-area-cleanup-instance").count(),
    1,
    "Scroll Area remount",
  );

  const lightVisuals = await readScrollAreaVisuals(dual);
  if (lightVisuals.cornerBackground !== lightVisuals.rootBackground) {
    throw new Error(
      `Light Scroll Area corner does not use the bg-background surface: ${JSON.stringify(lightVisuals)}`,
    );
  }
  return lightVisuals;
}

async function verifyScrollAreaDark(page, lightVisuals) {
  const dual = page.getByTestId("scroll-area-dual");
  const verticalViewport = page
    .getByTestId("scroll-area-vertical")
    .locator('[data-slot="scroll-area-viewport"]');
  const darkFocusTreatment = await focusScrollAreaViewportWithKeyboard(page, verticalViewport);
  assertScrollAreaFocusTreatment(darkFocusTreatment, "dark");
  const darkVisuals = await readScrollAreaVisuals(dual);
  await assertEqual(darkVisuals.rootWidth, lightVisuals.rootWidth, "dark Scroll Area width");
  await assertEqual(darkVisuals.rootHeight, lightVisuals.rootHeight, "dark Scroll Area height");
  if (darkVisuals.rootBackground === lightVisuals.rootBackground) {
    throw new Error(`Scroll Area root theme token did not change: ${darkVisuals.rootBackground}`);
  }
  if (darkVisuals.thumbBackground === lightVisuals.thumbBackground) {
    throw new Error(`Scroll Area thumb theme token did not change: ${darkVisuals.thumbBackground}`);
  }
  if (darkVisuals.itemBackground === lightVisuals.itemBackground) {
    throw new Error(
      `Scroll Area content theme token did not change: ${darkVisuals.itemBackground}`,
    );
  }
  await assertEqual(darkVisuals.cornerVisible, true, "dark Scroll Area corner");
  await assertEqual(darkVisuals.thumbVisible, true, "dark Scroll Area thumb");
  if (darkVisuals.cornerBackground !== darkVisuals.rootBackground) {
    throw new Error(
      `Dark Scroll Area corner does not use the bg-background surface: ${JSON.stringify(darkVisuals)}`,
    );
  }
  if (darkVisuals.cornerBackground === lightVisuals.cornerBackground) {
    throw new Error(
      `Scroll Area corner theme token did not change: ${darkVisuals.cornerBackground}`,
    );
  }
  if (darkVisuals.thumbBackground === darkVisuals.rootBackground) {
    throw new Error("Dark Scroll Area thumb is not visually distinct from the viewport.");
  }
}

async function focusScrollAreaViewportWithKeyboard(page, viewport) {
  const primitiveViewport = page
    .getByTestId("scroll-area-primitive-root")
    .locator("[data-sw-scroll-area-viewport]");
  await primitiveViewport.focus();
  await page.keyboard.press("Tab");
  await assertEqual(
    await viewport.evaluate((element) => element === document.activeElement),
    true,
    "keyboard-focused Styled Scroll Area viewport",
  );

  const settleTime = await viewport.evaluate((element) => {
    const style = getComputedStyle(element);
    const properties = style.transitionProperty.split(",").map((value) => value.trim());
    const durations = style.transitionDuration.split(",").map(parseCssTime);
    const delays = style.transitionDelay.split(",").map(parseCssTime);
    let maximum = 0;
    for (const [index, property] of properties.entries()) {
      if (property !== "all" && property !== "box-shadow" && property !== "color") continue;
      const duration = durations[index % durations.length] ?? 0;
      const delay = delays[index % delays.length] ?? 0;
      maximum = Math.max(maximum, duration + delay);
    }
    return Math.ceil(maximum) + 50;

    function parseCssTime(value) {
      if (value.endsWith("ms")) return Number.parseFloat(value);
      if (value.endsWith("s")) return Number.parseFloat(value) * 1000;
      return 0;
    }
  });
  await viewport.evaluate(
    (_element, duration) =>
      new Promise((resolve) => {
        setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(resolve)), duration);
      }),
    settleTime,
  );

  return viewport.evaluate((element, settledAfterMs) => {
    const style = getComputedStyle(element);
    const root = element.closest("[data-sw-scroll-area]");
    if (!(root instanceof HTMLElement)) throw new Error("Scroll Area root was not found.");
    const backgroundColor = getComputedStyle(root).backgroundColor;
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas was unavailable for focus contrast verification.");

    function readColor(color, background) {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = background;
      context.fillRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data];
    }

    function luminance([red, green, blue]) {
      const channels = [red, green, blue].map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    }

    function contrast(foreground, background) {
      const foregroundLuminance = luminance(readColor(foreground, background));
      const backgroundLuminance = luminance(readColor(background, background));
      return (
        (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
        (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
      );
    }

    const shadowLengths = [...style.boxShadow.matchAll(/-?\d+(?:\.\d+)?px/g)].map((match) =>
      Math.abs(Number.parseFloat(match[0])),
    );
    const ringColor = style.getPropertyValue("--tw-ring-color").trim() || style.outlineColor;
    return {
      boxShadow: style.boxShadow,
      focusVisible: element.matches(":focus-visible"),
      maximumShadowLength: Math.max(0, ...shadowLengths),
      outlineColor: style.outlineColor,
      outlineContrast: contrast(style.outlineColor, backgroundColor),
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth),
      ringColor,
      ringContrast: contrast(ringColor, backgroundColor),
      settledAfterMs,
    };
  }, settleTime);
}

function assertScrollAreaFocusTreatment(treatment, theme) {
  if (!treatment.focusVisible) {
    throw new Error(`${theme} Scroll Area viewport did not match :focus-visible.`);
  }
  const hasOutline =
    treatment.outlineStyle !== "none" &&
    treatment.outlineWidth >= 1 &&
    treatment.outlineContrast >= 1.5;
  const hasRing = treatment.maximumShadowLength >= 3 && treatment.ringContrast >= 1.5;
  if (!hasOutline && !hasRing) {
    throw new Error(
      `${theme} Scroll Area viewport has no visible settled ring or outline: ${JSON.stringify(treatment)}`,
    );
  }
}

async function assertScrollGeometry(viewport, orientation) {
  const geometry = await viewport.evaluate((element, orientation) => {
    const root = element.closest("[data-sw-scroll-area]");
    const scrollbarElement = root?.querySelector(
      `[data-slot="scroll-area-scrollbar"][data-orientation="${orientation}"]`,
    );
    const thumbElement = scrollbarElement?.querySelector('[data-slot="scroll-area-thumb"]');
    if (!(scrollbarElement instanceof HTMLElement) || !(thumbElement instanceof HTMLElement)) {
      throw new Error(`${orientation} Scroll Area geometry anatomy is incomplete.`);
    }
    const scrollbarStyle = getComputedStyle(scrollbarElement);
    const viewportSize = orientation === "horizontal" ? element.clientWidth : element.clientHeight;
    const scrollSize = orientation === "horizontal" ? element.scrollWidth : element.scrollHeight;
    const trackSize =
      orientation === "horizontal"
        ? scrollbarElement.clientWidth -
          Number.parseFloat(scrollbarStyle.paddingInlineStart) -
          Number.parseFloat(scrollbarStyle.paddingInlineEnd)
        : scrollbarElement.clientHeight -
          Number.parseFloat(scrollbarStyle.paddingBlockStart) -
          Number.parseFloat(scrollbarStyle.paddingBlockEnd);
    const thumbSize = Number.parseFloat(
      orientation === "horizontal" ? thumbElement.style.width : thumbElement.style.height,
    );
    return {
      expected: Math.min(Math.max((viewportSize / scrollSize) * trackSize, 20), trackSize),
      scrollSize,
      thumbSize,
      trackSize,
      viewportSize,
    };
  }, orientation);
  if (geometry.scrollSize <= geometry.viewportSize) {
    throw new Error(`${orientation} Scroll Area fixture did not overflow.`);
  }
  if (Math.abs(geometry.thumbSize - geometry.expected) > 1) {
    throw new Error(
      `${orientation} Scroll Area thumb expected ${geometry.expected}px, received ${geometry.thumbSize}px.`,
    );
  }
}

async function readScrollAreaVisuals(root) {
  return root.evaluate((element) => {
    const corner = element.querySelector('[data-slot="scroll-area-corner"]');
    const item = element.querySelector(".scroll-area-item");
    const thumb = element.querySelector('[data-slot="scroll-area-thumb"]');
    if (
      !(corner instanceof HTMLElement) ||
      !(item instanceof HTMLElement) ||
      !(thumb instanceof HTMLElement)
    ) {
      throw new Error("Scroll Area visual anatomy is incomplete.");
    }
    const bounds = element.getBoundingClientRect();
    return {
      cornerBackground: getComputedStyle(corner).backgroundColor,
      cornerVisible: getComputedStyle(corner).display !== "none",
      itemBackground: getComputedStyle(item).backgroundColor,
      rootBackground: getComputedStyle(element).backgroundColor,
      rootHeight: bounds.height,
      rootWidth: bounds.width,
      thumbBackground: getComputedStyle(thumb).backgroundColor,
      thumbVisible: getComputedStyle(thumb).display !== "none",
    };
  });
}

async function verifyAvatarDark(page, lightTokens) {
  const darkTokens = await page.getByTestId("avatar-styled-error").evaluate((root) => {
    const fallback = root.querySelector('[data-slot="avatar-fallback"]');
    if (!(fallback instanceof HTMLElement)) throw new Error("Avatar fallback was not rendered.");
    return {
      fallbackColor: getComputedStyle(fallback).color,
      rootBackground: getComputedStyle(root).backgroundColor,
    };
  });
  if (darkTokens.rootBackground === lightTokens.rootBackground) {
    throw new Error(
      `Avatar root background token did not change in dark mode: ${JSON.stringify(darkTokens)}`,
    );
  }
  if (darkTokens.fallbackColor === lightTokens.fallbackColor) {
    throw new Error(
      `Avatar inherited fallback foreground did not change in dark mode: ${JSON.stringify(darkTokens)}`,
    );
  }
  await assertEqual(
    await page.getByTestId("avatar-error-fallback").isVisible(),
    true,
    "dark Avatar fallback",
  );
  await assertEqual(
    await page.getByTestId("avatar-styled-loaded-image").isVisible(),
    true,
    "dark Avatar image",
  );
}

async function verifyTheme(page) {
  await verifyPersistentHeader(page, "review");
  const headerToggle = page.getByTestId("header-theme-toggle");
  const reviewToggle = page.getByTestId("review-theme-toggle");
  const initialHeaderBackground = await page
    .getByTestId("vue-demo-header")
    .evaluate((element) => getComputedStyle(element).backgroundColor);

  await assertEqual(
    await headerToggle.evaluate((element) => element.tagName),
    "BUTTON",
    "header semantic button",
  );
  await assertEqual(await headerToggle.getAttribute("type"), "button", "header button type");
  await assertEqual(await headerToggle.getAttribute("data-state"), "off", "header light state");
  await assertEqual(await reviewToggle.getAttribute("data-state"), "off", "review light state");
  await assertThemeIcons(headerToggle, true, false, "header light icons");
  await assertThemeIcons(reviewToggle, true, false, "review custom light icons");
  await assertEqual(
    await reviewToggle.getAttribute("data-forwarded"),
    "theme-toggle",
    "Theme Toggle attr",
  );
  await assertText(
    page.getByTestId("theme-toggle-ref-tag"),
    "ref: BUTTON",
    "Theme Toggle exposed ref",
  );

  await headerToggle.click();
  await page.waitForFunction(
    () =>
      document.documentElement.classList.contains("dark") &&
      localStorage.getItem("colorTheme") === "dark" &&
      [...document.querySelectorAll("[data-sw-theme-toggle]")].every(
        (element) =>
          element.getAttribute("data-state") === "on" &&
          element.getAttribute("aria-pressed") === "true",
      ),
  );
  const darkHeaderBackground = await page
    .getByTestId("vue-demo-header")
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  if (darkHeaderBackground === initialHeaderBackground) {
    throw new Error(`Theme visual token did not change: ${darkHeaderBackground}`);
  }
  await assertThemeIcons(headerToggle, false, true, "header dark icons");
  await assertThemeIcons(reviewToggle, false, true, "review custom dark icons");

  await reviewToggle.click();
  await assertText(
    page.getByTestId("theme-toggle-click-count"),
    "clicks: 1",
    "Theme Toggle listener",
  );
  await assertEqual(
    await headerToggle.getAttribute("data-state"),
    "off",
    "synchronized click state",
  );

  await reviewToggle.focus();
  await page.keyboard.press("Space");
  await assertEqual(
    await headerToggle.getAttribute("data-state"),
    "on",
    "keyboard synchronized state",
  );
  await assertEqual(
    await reviewToggle.getAttribute("aria-pressed"),
    "true",
    "keyboard pressed state",
  );
  await assertEqual(
    await reviewToggle.locator("[data-theme-icon][data-ready]").count(),
    2,
    "ready icons",
  );

  await page.getByTestId("theme-toggle-remount").click();
  await assertEqual(
    await page.getByTestId("review-theme-toggle").count(),
    0,
    "Theme Toggle unmount",
  );
  await assertEqual(
    await headerToggle.getAttribute("data-state"),
    "on",
    "app controller survives unmount",
  );
  await page.getByTestId("theme-toggle-remount").click();
  const remounted = page.getByTestId("review-theme-toggle");
  await assertEqual(await remounted.getAttribute("data-state"), "on", "Theme Toggle remount sync");
  await assertEqual(
    await remounted.getAttribute("aria-pressed"),
    "true",
    "Theme Toggle remount ARIA",
  );
  return { darkHeaderBackground, initialHeaderBackground };
}

async function verifyIndexDarkTheme(page, themeProof) {
  const headerToggle = page.getByTestId("header-theme-toggle");
  await assertEqual(
    await page.evaluate(() => document.documentElement.classList.contains("dark")),
    true,
    "index document dark class",
  );
  await assertEqual(
    await page.evaluate(() => localStorage.getItem("colorTheme")),
    "dark",
    "index persisted theme",
  );
  await assertEqual(await headerToggle.getAttribute("data-state"), "on", "index Toggle state");
  await assertEqual(await headerToggle.getAttribute("aria-pressed"), "true", "index Toggle ARIA");
  await assertThemeIcons(headerToggle, false, true, "index dark icons");

  const indexHeaderBackground = await page
    .getByTestId("vue-demo-header")
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  await assertEqual(
    indexHeaderBackground,
    themeProof.darkHeaderBackground,
    "index dark visual token",
  );
  if (indexHeaderBackground === themeProof.initialHeaderBackground) {
    throw new Error(`Index retained the light visual token: ${indexHeaderBackground}`);
  }
}

async function assertThemeIcons(toggle, lightVisible, darkVisible, label) {
  const icons = toggle.locator("[data-theme-icon]");
  await assertEqual(await icons.count(), 2, `${label} count`);
  await assertEqual(await icons.nth(0).isVisible(), lightVisible, `${label} light visibility`);
  await assertEqual(await icons.nth(1).isVisible(), darkVisible, `${label} dark visibility`);
}

async function verifyPersistentHeader(page, route) {
  const header = page.getByTestId("vue-demo-header");
  await assertEqual(await header.count(), 1, `${route} persistent header`);
  await assertEqual(
    await header.getByRole("navigation", { name: "Demo pages" }).count(),
    1,
    `${route} accessible nav`,
  );
  await assertEqual(
    await header.getByTestId("header-theme-toggle").count(),
    1,
    `${route} header toggle`,
  );
}

async function verifyButton(page) {
  const button = page.getByTestId("button-primitive");
  await assertEqual(await button.getAttribute("data-review-attr"), "forwarded", "Button attr");
  await assertEqual(
    await button.getAttribute("aria-label"),
    "Run primitive Button review",
    "Button ARIA attr",
  );
  await assertText(page.getByTestId("button-ref-tag"), "ref: BUTTON", "Button exposed ref");
  await assertText(
    page.getByTestId("button-slot"),
    "Primitive slot content",
    "Button default slot",
  );
  await button.click();
  await assertText(page.getByTestId("button-click-count"), "clicks: 1", "Button listener");
  await page.getByRole("button", { name: "Update slot" }).click();
  await assertText(page.getByTestId("button-slot"), "Updated slot content", "Button slot update");

  await assertEqual(
    await page.getByTestId("button-styled-primary").getAttribute("data-slot"),
    "button",
    "Styled Button data-slot",
  );
  await assertEqual(
    await page.getByTestId("button-styled-anchor").evaluate((element) => element.tagName),
    "A",
    "Styled Button semantic anchor",
  );
}

async function verifyCheckbox(page) {
  const uncontrolled = page.getByTestId("checkbox-uncontrolled");
  await assertEqual(await uncontrolled.getAttribute("aria-checked"), "true", "uncontrolled start");
  await uncontrolled.click();
  await assertEqual(await uncontrolled.getAttribute("aria-checked"), "false", "uncontrolled click");
  await assertEqual(
    await page.getByTestId("checkbox-uncontrolled-indicator").isHidden(),
    true,
    "uncontrolled indicator presence",
  );

  const controlled = page.getByTestId("checkbox-controlled");
  const controlledIndicator = controlled.locator("[data-sw-checkbox-indicator]");
  await assertEqual(
    await controlledIndicator.isHidden(),
    true,
    "controlled indicator unchecked presence",
  );
  await controlled.click();
  await assertEqual(await controlled.getAttribute("aria-checked"), "true", "controlled model");
  await assertEqual(
    await controlledIndicator.isHidden(),
    false,
    "controlled indicator checked presence",
  );
  await assertText(
    page.getByTestId("checkbox-controlled-state"),
    "checked: true",
    "controlled parent state",
  );

  const canceled = page.getByTestId("checkbox-canceled");
  await canceled.click();
  await assertEqual(await canceled.getAttribute("aria-checked"), "false", "canceled state");
  await assertText(
    page.getByTestId("checkbox-cancel-state"),
    "attempts: 1, updates: 0",
    "canceled events",
  );

  const formControl = page.getByTestId("checkbox-form-control");
  const formIndicator = formControl.locator("[data-sw-checkbox-indicator]");
  await assertEqual(await formIndicator.isHidden(), false, "checked form indicator presence");
  await page.getByTestId("checkbox-form-submit").click();
  await assertText(
    page.getByTestId("checkbox-form-result"),
    '{"newsletter":"yes"}',
    "checked form data",
  );
  await formControl.click();
  await assertEqual(await formIndicator.isHidden(), true, "unchecked form indicator presence");
  await page.getByTestId("checkbox-form-submit").click();
  await assertText(
    page.getByTestId("checkbox-form-result"),
    '{"newsletter":"no"}',
    "unchecked form data",
  );

  await page.getByTestId("checkbox-cleanup-toggle").click();
  await assertText(page.getByTestId("checkbox-cleanup-state"), "unmounted", "Checkbox unmount");
  await assertEqual(
    await page.getByTestId("checkbox-cleanup-instance").count(),
    0,
    "Checkbox cleanup DOM",
  );
  await page.getByTestId("checkbox-cleanup-toggle").click();
  await assertEqual(
    await page.getByTestId("checkbox-cleanup-instance").count(),
    1,
    "Checkbox remount",
  );
  const cleanup = page.getByTestId("checkbox-cleanup-instance");
  const cleanupIndicator = cleanup.locator("[data-sw-checkbox-indicator]");
  await assertEqual(
    await cleanupIndicator.isHidden(),
    true,
    "cleanup indicator unchecked presence",
  );
  await cleanup.click();
  await assertEqual(await cleanupIndicator.isHidden(), false, "cleanup indicator checked presence");
}

async function verifySelect(page) {
  const portalTarget = page.getByTestId("select-portal-target");
  const uncontrolled = page.getByTestId("select-uncontrolled-root");
  const uncontrolledTrigger = page.getByTestId("select-uncontrolled-trigger");
  await uncontrolledTrigger.click();
  await assertEqual(await uncontrolledTrigger.getAttribute("aria-expanded"), "true", "Select open");
  await assertEqual(
    await portalTarget.getByTestId("select-uncontrolled-portal").count(),
    1,
    "Select portal target",
  );
  await page.getByTestId("select-uncontrolled-item-banana").click();
  await assertEqual(await uncontrolled.getAttribute("data-value"), "banana", "Select value");
  await assertTextIncludes(
    page.getByTestId("select-uncontrolled-state"),
    "value=banana, open=false",
    "uncontrolled Select output",
  );

  const controlledTrigger = page.getByTestId("select-controlled-trigger");
  await controlledTrigger.click();
  await assertTextIncludes(
    page.getByTestId("select-controlled-parent-state"),
    "open=true",
    "controlled open model",
  );
  await page.getByTestId("select-controlled-item-banana").click();
  await assertTextIncludes(
    page.getByTestId("select-controlled-parent-state"),
    "parent value=banana, open=false",
    "controlled value model",
  );

  const cancelOpen = page.getByTestId("select-cancel-open-trigger");
  await cancelOpen.click();
  await assertEqual(
    await cancelOpen.getAttribute("aria-expanded"),
    "false",
    "canceled Select open",
  );
  await assertTextIncludes(
    page.getByTestId("select-cancel-open-state"),
    "open-details=1, canceled=1",
    "canceled open details",
  );

  const cancelValue = page.getByTestId("select-cancel-value-root");
  await page.getByTestId("select-cancel-value-trigger").click();
  await page.getByTestId("select-cancel-value-item-banana").click();
  await assertEqual(await cancelValue.getAttribute("data-value"), "apple", "canceled Select value");
  await assertTextIncludes(
    page.getByTestId("select-cancel-value-state"),
    "value-details=1",
    "canceled value detail",
  );
  await assertTextIncludes(
    page.getByTestId("select-cancel-value-state"),
    "canceled=1",
    "canceled value count",
  );

  await page.getByTestId("select-add-item").click();
  await page.getByTestId("select-dynamic-trigger").click();
  await assertEqual(
    await page.getByTestId("select-dynamic-item-cherry").count(),
    1,
    "dynamic Select item",
  );
  await page.getByTestId("select-dynamic-item-cherry").click();
  await assertEqual(
    await page.getByTestId("select-dynamic-root").getAttribute("data-value"),
    "cherry",
    "dynamic Select value",
  );

  const firstInstance = page.getByTestId("select-instance-one-trigger");
  const secondInstance = page.getByTestId("select-instance-two-trigger");
  await firstInstance.click();
  await assertEqual(await firstInstance.getAttribute("aria-expanded"), "true", "first Select open");
  await assertEqual(
    await secondInstance.getAttribute("aria-expanded"),
    "false",
    "second Select isolation",
  );
  await firstInstance.click();

  await page.getByTestId("select-form-submit").click();
  await assertText(page.getByTestId("select-form-result"), '{"fruit":"apple"}', "Select form data");

  await page.getByTestId("select-cleanup-toggle").click();
  await assertText(page.getByTestId("select-cleanup-state"), "unmounted", "Select unmount");
  await assertEqual(
    await page.getByTestId("select-cleanup-portal").count(),
    0,
    "Select portal cleanup",
  );
  await page.getByTestId("select-cleanup-toggle").click();
  await assertEqual(await page.getByTestId("select-cleanup-root").count(), 1, "Select remount");
}

async function verifyStyled(page) {
  const variantButtons = page.getByTestId("styled-button-variants").locator('[data-slot="button"]');
  await assertEqual(await variantButtons.count(), 5, "Styled Button variants");

  const checkbox = page.getByTestId("styled-checkbox");
  await checkbox.click();
  await assertEqual(await checkbox.getAttribute("aria-checked"), "false", "Styled Checkbox model");
  await assertText(
    page.getByTestId("styled-checkbox-state"),
    "checked: false",
    "Styled Checkbox parent state",
  );

  const selectScenario = page.getByTestId("styled-select-scenario");
  const trigger = selectScenario.locator("[data-sw-select-trigger]");
  await assertEqual(await trigger.evaluate((element) => element.tagName), "BUTTON", "asChild tag");
  await assertEqual(await trigger.getAttribute("type"), "button", "asChild button default");
  await trigger.click();
  await assertText(
    page.getByTestId("styled-select-listener-state"),
    "child-clicks=1, wrapper-clicks=1",
    "asChild merged listeners",
  );
  await assertEqual(await trigger.getAttribute("aria-expanded"), "true", "Styled Select open");
  await page.locator('[data-slot="select-item"][data-value="banana"]:visible').click();
  await assertTextIncludes(trigger, "banana", "Styled Select value");

  const standardTrigger = page.getByTestId("styled-select-standard-trigger");
  await standardTrigger.evaluate((element) => element.scrollIntoView({ block: "center" }));
  await page.waitForFunction(
    () => {
      const trigger = document.querySelector('[data-testid="styled-select-standard-trigger"]');
      if (!(trigger instanceof HTMLElement)) return false;
      const rect = trigger.getBoundingClientRect();
      return rect.top >= 48 && window.innerHeight - rect.bottom >= 48;
    },
    undefined,
    { timeout: 2_000 },
  );
  await standardTrigger.click();
  await assertEqual(
    await standardTrigger.getAttribute("aria-expanded"),
    "true",
    "standard Styled Select open",
  );
  const standardContent = page.getByTestId("styled-select-standard-content");
  await assertEqual(
    await standardContent.getAttribute("data-align-trigger"),
    "true",
    "standard Styled Select item alignment",
  );
  await page.waitForFunction(
    () => {
      const trigger = document.querySelector('[data-testid="styled-select-standard-trigger"]');
      const value = trigger?.querySelector("[data-sw-select-value]");
      const selectedText = document.querySelector(
        '[data-testid="styled-select-standard-content"] [aria-selected="true"] [data-sw-select-item-text]',
      );
      if (!(value instanceof HTMLElement) || !(selectedText instanceof HTMLElement)) return false;
      const valueRect = value.getBoundingClientRect();
      const selectedTextRect = selectedText.getBoundingClientRect();
      return (
        Math.abs(
          valueRect.top +
            valueRect.height / 2 -
            (selectedTextRect.top + selectedTextRect.height / 2),
        ) <= 1
      );
    },
    undefined,
    { timeout: 2_000 },
  );
  const itemAlignmentDelta = await standardContent.evaluate((content) => {
    const trigger = document.querySelector('[data-testid="styled-select-standard-trigger"]');
    const value = trigger?.querySelector("[data-sw-select-value]");
    const selectedText = content.querySelector('[aria-selected="true"] [data-sw-select-item-text]');
    if (!value || !selectedText) return Number.POSITIVE_INFINITY;

    const valueRect = value.getBoundingClientRect();
    const selectedTextRect = selectedText.getBoundingClientRect();
    return Math.abs(
      valueRect.top + valueRect.height / 2 - (selectedTextRect.top + selectedTextRect.height / 2),
    );
  });
  if (itemAlignmentDelta > 1) {
    throw new Error(
      `standard Styled Select selected item alignment: expected centers within 1px, received ${itemAlignmentDelta}px`,
    );
  }
  await standardTrigger.click();
}

async function assertText(locator, expected, label) {
  const actual = (await locator.textContent())?.trim().replace(/\s+/g, " ") ?? "";
  await assertEqual(actual, expected, label);
}

async function assertTextIncludes(locator, expected, label) {
  const actual = (await locator.textContent())?.trim().replace(/\s+/g, " ") ?? "";
  if (!actual.includes(expected))
    throw new Error(`${label}: expected ${JSON.stringify(expected)} in ${JSON.stringify(actual)}`);
}

async function assertProgressVisiblePercent(root, expected, label) {
  const actual = await root.evaluate((element) => {
    const indicator = element.querySelector('[data-slot="progress-indicator"]');
    if (!(indicator instanceof HTMLElement)) return Number.NaN;

    const rootRect = element.getBoundingClientRect();
    const indicatorRect = indicator.getBoundingClientRect();
    const visibleLeft = Math.max(rootRect.left, indicatorRect.left);
    const visibleRight = Math.min(rootRect.right, indicatorRect.right);
    return (Math.max(0, visibleRight - visibleLeft) / rootRect.width) * 100;
  });
  if (!Number.isFinite(actual) || Math.abs(actual - expected) > 1) {
    throw new Error(`${label}: expected ${expected}% visible, received ${actual}%`);
  }
}

async function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(
      `${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
    );
  }
}

async function assertNoErrors(messages) {
  if (messages.length > 0) throw new Error(messages.join("\n"));
}

async function captureReviewEvidence(page, evidencePath) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForFunction(() => window.scrollX === 0 && window.scrollY === 0);
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  await page.screenshot({ fullPage: true, path: evidencePath });
}

async function describeFailure(page, messages) {
  let snapshot;
  try {
    snapshot = await page?.evaluate(() => ({
      body: document.body.innerText.slice(0, 2000),
      openSelects: Array.from(document.querySelectorAll("[data-sw-select-trigger]"))
        .filter((element) => element.getAttribute("aria-expanded") === "true")
        .map((element) => element.getAttribute("data-testid")),
      portalCount: document.querySelectorAll("[data-sw-select-portal]").length,
      standardSelect: (() => {
        const trigger = document.querySelector('[data-testid="styled-select-standard-trigger"]');
        const value = trigger?.querySelector("[data-sw-select-value]");
        const content = document.querySelector('[data-testid="styled-select-standard-content"]');
        const selected = content?.querySelector('[aria-selected="true"]');
        const selectedText = selected?.querySelector("[data-sw-select-item-text]");
        const positioner = content?.closest("[data-sw-select-positioner]");
        const rect = (element) => {
          if (!(element instanceof HTMLElement)) return null;
          const bounds = element.getBoundingClientRect();
          return {
            bottom: bounds.bottom,
            centerY: bounds.top + bounds.height / 2,
            height: bounds.height,
            top: bounds.top,
          };
        };
        return {
          content: rect(content),
          contentAlignItem: content?.getAttribute("data-align-item-with-trigger"),
          contentAlignTrigger: content?.getAttribute("data-align-trigger"),
          positioner: rect(positioner),
          positionerAlignItem: positioner?.getAttribute("data-align-item-with-trigger"),
          selected: rect(selected),
          selectedText: rect(selectedText),
          selectedValue: selected?.getAttribute("data-value"),
          trigger: rect(trigger),
          value: rect(value),
          viewportHeight: window.innerHeight,
        };
      })(),
      title: document.title,
      url: window.location.href,
    }));
  } catch (error) {
    snapshot = { error: error instanceof Error ? error.message : String(error), url: page?.url() };
  }
  return `Vue smoke failure context:\nmessages=${JSON.stringify(messages, null, 2)}\nsnapshot=${JSON.stringify(snapshot, null, 2)}`;
}
