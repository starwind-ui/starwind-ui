import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const demoRoot = path.resolve(testDir, "..");
const repoRoot = path.resolve(demoRoot, "../..");
const reactDemoRequire = createRequire(path.join(repoRoot, "apps/react-demo/package.json"));
const demoRequire = createRequire(path.join(demoRoot, "package.json"));
const { chromium } = reactDemoRequire("playwright");
const astroPackage = demoRequire.resolve("astro/package.json");
const astroBin = path.join(path.dirname(astroPackage), "bin/astro.mjs");
const host = "127.0.0.1";
const port = Number(process.env.STARWIND_COLOR_PICKER_SMOKE_PORT ?? "4399");
const external = process.env.STARWIND_COLOR_PICKER_SMOKE_SERVER_MODE === "external";
const server = external
  ? null
  : spawn(process.execPath, [astroBin, "preview", "--host", host, "--port", String(port)], {
      cwd: demoRoot,
      env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });

let serverOutput = "";
server?.stdout.on("data", (chunk) => (serverOutput += chunk));
server?.stderr.on("data", (chunk) => (serverOutput += chunk));

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const url = `http://${host}:${port}/runtime-color-picker/`;
  await waitForPage(page, url, server);
  await page.getByRole("heading", { name: "Color Picker", exact: true }).waitFor();

  // Popup interaction, area keyboard/pointer, channel keyboard/pointer, and public events.
  const trigger = page.getByTestId("popup-trigger");
  await trigger.click();
  const popup = page.locator('[data-slot="popover-content"][aria-label="Brand color editor"]');
  await popup.waitFor({ timeout: 3000 }).catch(async () => {
    throw new Error(
      `Popup did not open: trigger=${JSON.stringify(await trigger.evaluate((node) => ({ expanded: node.getAttribute("aria-expanded"), state: node.getAttribute("data-state") })))} root=${JSON.stringify(await page.locator("#popup-picker").evaluate((node) => ({ state: node.getAttribute("data-state") })))} popup=${JSON.stringify(await popup.evaluate((node) => ({ hidden: node.hidden, state: node.getAttribute("data-state") })))}`,
    );
  });

  const falsePresenceAttributes = await page.evaluate(() => {
    const presenceAttributes = new Set([
      "data-alpha",
      "data-disabled",
      "data-dragging",
      "data-focused",
      "data-invalid",
      "data-readonly",
      "data-required",
      "data-selected",
    ]);
    return Array.from(document.querySelectorAll("[data-sw-color-picker]"))
      .flatMap((root) => [root, ...root.querySelectorAll("*")])
      .flatMap((element) => Array.from(element.attributes))
      .filter((attribute) => presenceAttributes.has(attribute.name) && attribute.value === "false")
      .map((attribute) => attribute.name);
  });
  assert.deepEqual(
    falsePresenceAttributes,
    [],
    "Color Picker presence-state attributes must not serialize literal false values",
  );

  // Boundary thumbs keep their projected paint, including alpha over transparency.
  const areaThumbPaint = await popup
    .locator('[data-slot="color-picker-area-thumb"]')
    .evaluate((thumb) => ({
      color: getComputedStyle(thumb).backgroundColor,
      projected: getComputedStyle(thumb)
        .getPropertyValue("--sw-color-picker-area-thumb-color")
        .trim(),
      x: thumb.style.getPropertyValue("--sw-color-picker-area-x"),
      y: thumb.style.getPropertyValue("--sw-color-picker-area-y"),
    }));
  assert.notEqual(areaThumbPaint.color, "rgba(0, 0, 0, 0)");
  assert.notEqual(areaThumbPaint.projected, "");
  assert.equal(areaThumbPaint.x, "100%");
  assert.equal(areaThumbPaint.y, "0%");
  const hueSlider = popup.locator('[data-slot="color-picker-channel-slider"][data-channel="hue"]');
  const hueThumbPaint = await hueSlider.evaluate((slider) => {
    const thumb = slider.querySelector('[data-slot="color-picker-channel-slider-thumb"]');
    return {
      projected: getComputedStyle(thumb)
        .getPropertyValue("--sw-color-picker-channel-thumb-color")
        .trim(),
      position: slider.style.getPropertyValue("--sw-color-picker-channel-position"),
      visible: getComputedStyle(
        thumb.querySelector('[data-slot="color-picker-channel-thumb-color-layer"]'),
      ).backgroundColor,
    };
  });
  assert.notEqual(hueThumbPaint.projected, "");
  assert.equal(hueThumbPaint.position, "0%");
  assert.notEqual(hueThumbPaint.visible, "rgba(0, 0, 0, 0)");
  const alphaSlider = popup.locator(
    '[data-slot="color-picker-channel-slider"][data-channel="alpha"]',
  );
  const alphaThumbPaint = await alphaSlider.evaluate((slider) => {
    const thumb = slider.querySelector('[data-slot="color-picker-channel-slider-thumb"]');
    return {
      projected: getComputedStyle(thumb)
        .getPropertyValue("--sw-color-picker-channel-thumb-color")
        .trim(),
      visible: getComputedStyle(
        thumb.querySelector('[data-slot="color-picker-channel-thumb-color-layer"]'),
      ).backgroundColor,
      transparencyBackings: thumb.querySelectorAll('[data-slot="color-picker-transparency-grid"]')
        .length,
    };
  });
  assert.notEqual(alphaThumbPaint.projected, "");
  assert.notEqual(alphaThumbPaint.visible, "rgba(0, 0, 0, 0)");
  assert.equal(alphaThumbPaint.transparencyBackings, 1);

  // Composite format selection synchronizes without dismissing the parent Popover.
  const compositeFormat = popup.getByRole("combobox", { name: "Color format" });
  await compositeFormat.click();
  const compositePositioner = page.locator(
    '#popup-picker > [data-slot="select-positioner"]:has(> [data-sw-color-picker-format-options])',
  );
  assert.equal(await compositePositioner.count(), 1, "format Select popup marker must be stable");
  assert.equal(
    await compositePositioner.evaluate((positioner) => getComputedStyle(positioner).zIndex),
    "60",
    "format Select positioner must layer above its parent Popover",
  );
  await page.getByRole("listbox").getByRole("option", { name: "RGB" }).click();
  assert.equal(await page.locator("#popup-picker").getAttribute("data-format"), "rgb");
  assert.equal(await popup.isVisible(), true, "nested Select must keep the Color Picker open");
  await compositeFormat.click();
  await page.getByRole("listbox").getByRole("option", { name: "HEX" }).click();
  assert.equal(await page.locator("#popup-picker").getAttribute("data-format"), "hex");
  assert.equal(
    await popup.isVisible(),
    true,
    "parent Popover must remain open after format change",
  );

  const xAxis = popup.locator('[data-slot="color-picker-area-input-x"]');
  await xAxis.focus();
  const xBefore = await xAxis.inputValue();
  const xMaximum = Number(await xAxis.getAttribute("max"));
  const xDirection = Number(xBefore) >= xMaximum ? "ArrowLeft" : "ArrowRight";
  const beforeAreaKeyboard = await readEventCounts(page);
  await xAxis.press(xDirection);
  await expectValueChange(xAxis, xBefore);
  await expectEventCounts(page, {
    changes: beforeAreaKeyboard.changes + 1,
    commits: beforeAreaKeyboard.commits + 1,
  });
  const area = popup.getByTestId("popup-area");
  const areaBox = await area.boundingBox();
  assert.ok(areaBox);
  const beforeAreaPointer = await readEventCounts(page);
  await page.mouse.move(areaBox.x + areaBox.width * 0.7, areaBox.y + areaBox.height * 0.25);
  await page.mouse.down();
  await expectEventCounts(page, {
    changes: beforeAreaPointer.changes + 1,
    commits: beforeAreaPointer.commits,
  });
  await page.mouse.up();
  await expectEventCounts(page, {
    changes: beforeAreaPointer.changes + 1,
    commits: beforeAreaPointer.commits + 1,
  });

  // Captured area movement clamps outside both axes, preserves the right edge at black,
  // and restores that saturation when brightness rises again.
  await page.mouse.move(areaBox.x + areaBox.width / 2, areaBox.y + areaBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(areaBox.x + areaBox.width + 40, areaBox.y + areaBox.height + 40);
  assert.equal(
    await area
      .locator('[data-slot="color-picker-area-thumb"]')
      .evaluate((thumb) => thumb.style.getPropertyValue("--sw-color-picker-area-x")),
    "100%",
  );
  assert.equal(
    await area
      .locator('[data-slot="color-picker-area-thumb"]')
      .evaluate((thumb) => thumb.style.getPropertyValue("--sw-color-picker-area-y")),
    "100%",
  );
  assert.equal(await page.locator("#popup-picker").getAttribute("data-value"), "#00000080");
  await page.mouse.move(areaBox.x + areaBox.width + 40, areaBox.y + areaBox.height / 2);
  assert.equal(
    await area
      .locator('[data-slot="color-picker-area-thumb"]')
      .evaluate((thumb) => thumb.style.getPropertyValue("--sw-color-picker-area-x")),
    "100%",
  );
  assert.equal(
    await area
      .locator('[data-slot="color-picker-area-thumb"]')
      .evaluate((thumb) => thumb.style.getPropertyValue("--sw-color-picker-area-y")),
    "50%",
  );
  assert.notEqual(await page.locator("#popup-picker").getAttribute("data-value"), "#00000080");
  await page.mouse.up();

  const hueInput = popup.locator(
    '[data-slot="color-picker-channel-slider"][data-channel="hue"] input',
  );
  await hueInput.focus();
  const hueBefore = await hueInput.inputValue();
  const beforeHueKeyboard = await readEventCounts(page);
  await hueInput.press("ArrowRight");
  await expectValueChange(hueInput, hueBefore);
  await expectEventCounts(page, {
    changes: beforeHueKeyboard.changes + 1,
    commits: beforeHueKeyboard.commits + 1,
  });
  const hue = popup.getByTestId("popup-hue");
  const hueBox = await hue.boundingBox();
  assert.ok(hueBox);
  const beforeHuePointer = await readEventCounts(page);
  await page.mouse.move(hueBox.x + hueBox.width * 0.2, hueBox.y + hueBox.height / 2);
  await page.mouse.down();
  await expectEventCounts(page, {
    changes: beforeHuePointer.changes + 1,
    commits: beforeHuePointer.commits,
  });
  await page.mouse.up();
  await expectEventCounts(page, {
    changes: beforeHuePointer.changes + 1,
    commits: beforeHuePointer.commits + 1,
  });

  // Invalid whole-value draft is isolated, then a valid draft recovers and commits.
  const popupValue = popup.locator('[data-slot="color-picker-value-input"]').first();
  await popupValue.fill("not-a-color");
  assert.equal(
    await popupValue.getAttribute("aria-invalid"),
    "true",
    "invalid whole-value draft should set aria-invalid",
  );
  await popupValue.press("Escape");
  await popupValue.fill("#123456");
  const beforeValidDraftCommit = await readEventCounts(page);
  await popupValue.press("Enter");
  assert.equal(
    await popupValue.getAttribute("aria-invalid"),
    "false",
    "valid whole-value draft should recover aria-invalid",
  );
  assert.equal(await page.locator("#popup-picker").getAttribute("data-value"), "#123456");
  assert.equal(
    await page.locator('#popup-picker [data-slot="color-picker-hidden-input"]').inputValue(),
    "#123456",
  );
  await expectEventCounts(page, {
    changes: beforeValidDraftCommit.changes + 1,
    commits: beforeValidDraftCommit.commits + 1,
  });

  await page.keyboard.press("Escape");
  await popup.waitFor({ state: "hidden" });
  await expectFocused(trigger);

  // Popup-free formats, alpha capability, and focused compositions expose the expected contract.
  const inlineRoot = page.locator("#inline-picker");
  assert.equal(await inlineRoot.getAttribute("data-format"), "hsb");
  assert.equal(await inlineRoot.getAttribute("data-alpha"), null);
  for (const format of ["hex", "rgb", "hsl", "hsb"]) {
    const formatRoot = page.getByTestId(`format-${format}`);
    assert.equal(await formatRoot.getAttribute("data-format"), format);
    assert.equal(await formatRoot.getAttribute("data-alpha"), null);
  }
  const nativeFormatRoot = page.getByTestId("format-rgb");
  const nativeFormatSelect = nativeFormatRoot.locator(
    '[data-slot="color-picker-native-format-select"]',
  );
  assert.equal(await nativeFormatSelect.inputValue(), "rgb");
  await nativeFormatSelect.selectOption("hsl");
  assert.equal(await nativeFormatRoot.getAttribute("data-format"), "hsl");
  assert.equal(await nativeFormatSelect.inputValue(), "hsl");

  const inputOnlyComposition = page.getByTestId("input-only");
  const inputOnly = inputOnlyComposition.locator('[data-slot="color-picker-value-input"]');
  const inputOnlyRoot = page.getByTestId("input-only-root");
  const swatchOnlyRoot = page.getByTestId("swatch-only-root");
  for (const root of [inlineRoot, inputOnlyRoot, swatchOnlyRoot]) {
    assert.equal(await root.locator('[data-slot="popover-trigger"]').count(), 0);
    assert.equal(await root.locator('[data-slot="popover-content"]').count(), 0);
  }
  await inputOnly.fill("#102030");
  await inputOnly.press("Enter");
  assert.equal(await inputOnlyRoot.getAttribute("data-value"), "#102030");

  const disabledComposition = page.getByTestId("disabled-picker");
  const disabledInput = disabledComposition.locator('[data-slot="color-picker-value-input"]');
  const disabledRoot = page.getByTestId("disabled-picker-root");
  assert.equal(await disabledRoot.getAttribute("data-disabled"), "");
  const disabledValue = await disabledRoot.getAttribute("data-value");
  await attemptNativeDraft(disabledInput, "#ffffff");
  assert.equal(await disabledRoot.getAttribute("data-value"), disabledValue);

  const readonlyComposition = page.getByTestId("readonly-picker");
  const readonlyInput = readonlyComposition.locator('[data-slot="color-picker-value-input"]');
  const readonlyRoot = page.getByTestId("readonly-picker-root");
  assert.equal(await readonlyRoot.getAttribute("data-readonly"), "");
  const readonlyValue = await readonlyRoot.getAttribute("data-value");
  await attemptNativeDraft(readonlyInput, "#ffffff");
  assert.equal(await readonlyRoot.getAttribute("data-value"), readonlyValue);

  // Required native form, public swatch selection, submission, and native reset.
  const form = page.getByTestId("color-picker-form");
  const requiredInput = form.locator('[data-slot="color-picker-hidden-input"]');
  assert.equal(await requiredInput.inputValue(), "", "required review fixture should start empty");
  await form.getByRole("button", { name: "Submit palette" }).click();
  assert.equal(
    await requiredInput.evaluate((input) => input.matches(":invalid")),
    true,
    `required input should be invalid; value=${JSON.stringify(await requiredInput.inputValue())}`,
  );
  await form.getByRole("button", { name: "Green swatch" }).click();
  await form.getByRole("button", { name: "Submit palette" }).click();
  await expectText(page.getByTestId("form-output"), /^accent: /);
  assert.notEqual(await requiredInput.inputValue(), "");
  const requiredHue = form.locator(
    '[data-slot="color-picker-channel-slider"][data-channel="hue"] input',
  );
  const requiredAreaThumb = form.locator('[data-slot="color-picker-area-thumb"]');
  const retainedHue = await requiredHue.inputValue();
  const retainedAreaPosition = await requiredAreaThumb.evaluate((thumb) => ({
    x: thumb.style.getPropertyValue("--sw-color-picker-area-x"),
    y: thumb.style.getPropertyValue("--sw-color-picker-area-y"),
  }));
  await form.getByRole("button", { name: "Clear color" }).click();
  assert.equal(await requiredInput.inputValue(), "");
  assert.equal(await requiredHue.inputValue(), retainedHue);
  assert.deepEqual(
    await requiredAreaThumb.evaluate((thumb) => ({
      x: thumb.style.getPropertyValue("--sw-color-picker-area-x"),
      y: thumb.style.getPropertyValue("--sw-color-picker-area-y"),
    })),
    retainedAreaPosition,
  );
  await requiredHue.press("ArrowRight");
  assert.notEqual(await requiredInput.inputValue(), "");
  await form.getByRole("button", { name: "Submit palette" }).click();
  await expectText(page.getByTestId("form-output"), /^accent: /);
  await form.getByRole("button", { name: "Reset palette" }).click();
  await expectText(page.getByTestId("form-output"), "Reset complete");
  assert.equal(
    await requiredInput.inputValue(),
    "#000000",
    "native reset should restore the picker default value",
  );

  // Popup behavior remains scoped inside a modal Dialog.
  await page.getByTestId("open-dialog-trigger").click();
  const dialog = page.locator('[data-slot="dialog-content"][aria-label="Dialog color editor"]');
  await dialog.waitFor();
  const dialogPickerTrigger = dialog.getByTestId("dialog-trigger");
  await dialogPickerTrigger.click();
  const nestedPicker = page.locator(
    '[data-slot="popover-content"][aria-label="Dialog color editor"]',
  );
  await nestedPicker.waitFor();
  await nestedPicker.getByRole("button", { name: "Blue swatch" }).click();
  await page.keyboard.press("Escape");
  await expectFocused(dialogPickerTrigger);

  // The runtime prototype keeps the labeled canonical specimen first and no-Clear, while the
  // advanced fixture explicitly enables an eligible footer Clear action.
  await page.goto(`http://${host}:${port}/runtime-prototype/`, { waitUntil: "domcontentloaded" });
  const canonical = page.getByTestId("canonical-docs-color-picker");
  await canonical.getByText("Canonical docs example", { exact: true }).waitFor();
  const canonicalTrigger = canonical.getByRole("button", { name: "Open brand color picker" });
  await canonicalTrigger.click();
  const canonicalPopup = page.locator(
    '[data-slot="popover-content"][aria-label="Brand color editor"]',
  );
  await canonicalPopup.waitFor();
  assert.equal(await canonicalPopup.locator('[data-slot="color-picker-clear"]').count(), 0);
  assert.equal(
    await canonicalPopup
      .locator('[data-slot="color-picker-footer"]')
      .getAttribute("data-has-swatches"),
    "true",
  );
  assert.equal(
    await canonicalPopup.locator('[data-slot="color-picker-separator"]').isVisible(),
    true,
  );
  assert.equal(await canonicalPopup.locator('[data-slot="color-picker-swatch"]').count(), 5);

  const eyeDropper = canonicalPopup.getByRole("button", {
    name: "Pick a color from the screen",
  });
  assert.equal(await eyeDropper.innerText(), "", "EyeDropper action must remain icon-only");
  assert.equal(await eyeDropper.locator("svg").count(), 1);

  const valueSwatch = canonicalTrigger.locator('[data-slot="color-picker-value-swatch"]');
  const valueSwatchPaint = await valueSwatch.evaluate((swatch) => {
    const style = getComputedStyle(swatch);
    return {
      borderWidth: style.borderTopWidth,
      backgroundImage: style.backgroundImage,
      childLayers: Array.from(swatch.children).map((child) => getComputedStyle(child).display),
    };
  });
  assert.equal(valueSwatchPaint.borderWidth, "1px");
  assert.match(valueSwatchPaint.backgroundImage, /linear-gradient/);
  assert.deepEqual(valueSwatchPaint.childLayers, ["none", "none"]);

  const canonicalArea = canonicalPopup.locator('[data-slot="color-picker-area"]');
  const canonicalAreaGeometry = await canonicalArea.evaluate((areaElement) => {
    const thumb = areaElement.querySelector('[data-slot="color-picker-area-thumb"]');
    const areaRect = areaElement.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();
    return {
      borderWidth: getComputedStyle(areaElement).borderTopWidth,
      overflow: getComputedStyle(areaElement).overflow,
      centerX: thumbRect.left + thumbRect.width / 2 - areaRect.left,
      centerY: thumbRect.top + thumbRect.height / 2 - areaRect.top,
      width: areaRect.width,
    };
  });
  assert.equal(canonicalAreaGeometry.borderWidth, "1px");
  assert.equal(canonicalAreaGeometry.overflow, "visible");
  assert.ok(canonicalAreaGeometry.centerX <= canonicalAreaGeometry.width);
  assert.ok(canonicalAreaGeometry.centerX >= canonicalAreaGeometry.width - 2);
  assert.ok(canonicalAreaGeometry.centerY >= 0 && canonicalAreaGeometry.centerY <= 2);

  // Exercise the canonical docs specimen itself: pointer capture must preserve saturation at
  // black while clamping beyond the bottom-right corner, then restore it without an x-axis snap.
  const canonicalRoot = page.locator("#runtime-prototype-docs-canonical-color-picker");
  const canonicalAreaBox = await canonicalArea.boundingBox();
  assert.ok(canonicalAreaBox);
  const canonicalAreaThumb = canonicalArea.locator('[data-slot="color-picker-area-thumb"]');
  await page.mouse.move(
    canonicalAreaBox.x + canonicalAreaBox.width / 2,
    canonicalAreaBox.y + canonicalAreaBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    canonicalAreaBox.x + canonicalAreaBox.width + 40,
    canonicalAreaBox.y + canonicalAreaBox.height + 40,
  );
  assert.deepEqual(
    await canonicalAreaThumb.evaluate((thumb) => ({
      x: thumb.style.getPropertyValue("--sw-color-picker-area-x"),
      y: thumb.style.getPropertyValue("--sw-color-picker-area-y"),
    })),
    { x: "100%", y: "100%" },
  );
  assert.equal(await canonicalRoot.getAttribute("data-value"), "#00000080");
  await page.mouse.move(
    canonicalAreaBox.x + canonicalAreaBox.width + 40,
    canonicalAreaBox.y + canonicalAreaBox.height / 2,
  );
  assert.equal(
    await canonicalAreaThumb.evaluate((thumb) =>
      thumb.style.getPropertyValue("--sw-color-picker-area-x"),
    ),
    "100%",
    "upward captured movement must restore full saturation without snapping left",
  );
  assert.notEqual(
    await canonicalRoot.getAttribute("data-value"),
    "#00000080",
    "raising brightness from black must restore the preserved saturation",
  );
  await page.mouse.up();

  const canonicalHue = canonicalPopup.locator(
    '[data-slot="color-picker-channel-slider"][data-channel="hue"]',
  );
  assert.equal(await canonicalHue.evaluate((slider) => getComputedStyle(slider).height), "12px");
  assert.equal(
    await canonicalPopup
      .locator('[data-slot="color-picker-swatch"]')
      .first()
      .evaluate((swatch) => getComputedStyle(swatch).width),
    "28px",
  );
  await page.keyboard.press("Escape");

  const advancedTrigger = page.getByTestId("canonical-color-picker-trigger");
  await advancedTrigger.click();
  const advancedPopup = page.getByTestId("canonical-color-picker-content");
  await advancedPopup.waitFor();
  const eligibleClear = advancedPopup.getByRole("button", { name: "Clear color" });
  assert.equal(await eligibleClear.isVisible(), true);
  assert.equal(await eligibleClear.isEnabled(), true);
  assert.equal(
    await advancedPopup.locator('[data-slot="color-picker-separator"]').isVisible(),
    true,
  );
  await page.keyboard.press("Escape");

  await page.getByTestId("ineligible-clear-color-picker-trigger").click();
  const ineligiblePopup = page.getByTestId("ineligible-clear-color-picker-content");
  await ineligiblePopup.waitFor();
  const ineligibleClear = ineligiblePopup.locator('[data-slot="color-picker-clear"]');
  assert.equal(await ineligibleClear.count(), 1);
  assert.equal(await ineligibleClear.getAttribute("hidden"), "");
  assert.equal(await ineligibleClear.getAttribute("disabled"), "");
  assert.equal(await ineligibleClear.isVisible(), false);
  const ineligibleSeparator = ineligiblePopup.locator('[data-slot="color-picker-separator"]');
  assert.equal(await ineligibleSeparator.count(), 1);
  assert.equal(await ineligibleSeparator.isVisible(), false);
  await page.keyboard.press("Escape");

  await page.getByTestId("canonical-color-picker-swatch-trigger").click();
  const swatchOnlyPopup = page.locator(
    '[data-slot="popover-content"][aria-label="Swatch-only color editor"]',
  );
  await swatchOnlyPopup.waitFor();
  assert.equal(await swatchOnlyPopup.locator('[data-slot="color-picker-separator"]').count(), 0);
  assert.equal(await swatchOnlyPopup.locator('[data-slot="color-picker-clear"]').count(), 0);
  await page.keyboard.press("Escape");

  for (const fixture of [
    { size: "sm", trackHeight: "10px", contentWidth: "256px", formatWidth: "80px" },
    { size: "md", trackHeight: "12px", contentWidth: "288px", formatWidth: "80px" },
    { size: "lg", trackHeight: "16px", contentWidth: "320px", formatWidth: "96px" },
  ]) {
    await page.getByTestId(`canonical-color-picker-${fixture.size}-trigger`).click();
    const sizePopup = page.locator(
      `[data-slot="popover-content"][aria-label="${fixture.size === "sm" ? "Small" : fixture.size === "md" ? "Medium" : "Large"} color editor"]`,
    );
    await sizePopup.waitFor();
    assert.equal(
      await sizePopup.evaluate((popupElement) => getComputedStyle(popupElement).width),
      fixture.contentWidth,
    );
    assert.equal(
      await sizePopup
        .locator('[data-slot="color-picker-channel-slider"][data-channel="hue"]')
        .evaluate((slider) => getComputedStyle(slider).height),
      fixture.trackHeight,
    );
    assert.equal(
      await sizePopup
        .getByRole("combobox", { name: "Color format" })
        .evaluate((control) => getComputedStyle(control).minWidth),
      fixture.formatWidth,
    );
    await page.keyboard.press("Escape");
  }

  assert.deepEqual(errors, []);
  console.log(`Astro Color Picker smoke passed at ${url}`);
} catch (error) {
  throw new Error(
    `${error instanceof Error ? error.message : String(error)}\nserverTail=${serverOutput.slice(-3000)}`,
  );
} finally {
  await browser?.close();
  server?.kill();
}

async function waitForPage(page, url, serverProcess) {
  let lastError;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (serverProcess?.exitCode != null)
      throw new Error(`Preview exited (${serverProcess.exitCode})`);
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 1500 });
      if ((await page.title()) !== "404: Not found") return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw lastError ?? new Error(`Timed out waiting for ${url}`);
}

async function expectText(locator, expected) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const text = await locator.textContent();
    if (typeof expected === "string" ? text?.includes(expected) : expected.test(text ?? "")) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  assert.match(
    (await locator.textContent()) ?? "",
    expected instanceof RegExp ? expected : new RegExp(expected),
  );
}

async function expectValueChange(locator, previous) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if ((await locator.inputValue()) !== previous) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  assert.notEqual(await locator.inputValue(), previous);
}

async function expectFocused(locator) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (await locator.evaluate((node) => node === document.activeElement)) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  assert.equal(
    await locator.evaluate((node) => node === document.activeElement),
    true,
    `focus did not return; active=${await locator.evaluate(() => document.activeElement?.outerHTML.slice(0, 300))}`,
  );
}

async function readEventCounts(page) {
  const text = (await page.getByTestId("popup-events").textContent()) ?? "";
  const match = /^changes: (\d+); commits: (\d+)$/.exec(text.trim());
  assert.ok(match, `unexpected popup event output: ${JSON.stringify(text)}`);
  return { changes: Number(match[1]), commits: Number(match[2]) };
}

async function expectEventCounts(page, expected) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const actual = await readEventCounts(page);
    if (actual.changes === expected.changes && actual.commits === expected.commits) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  assert.deepEqual(await readEventCounts(page), expected);
}

async function attemptNativeDraft(locator, value) {
  await locator.evaluate((input, nextValue) => {
    input.value = nextValue;
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}
