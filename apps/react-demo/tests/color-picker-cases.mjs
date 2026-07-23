import assert from "node:assert/strict";

export async function verifyReactColorPickerCases({ page }) {
  await assertCanonicalDocsComposition(page);

  const canonicalRoot = page.locator("#canonical-color-picker-root");
  await canonicalRoot.scrollIntoViewIfNeeded();
  await assertCanonicalComposition(page, canonicalRoot);
  await assertNestedCompositeFormatSelect(page, canonicalRoot);
  await assertConstrainedColorPickerPlacement(page);

  const defaultRoot = page.locator("#react-color-picker-default");
  await defaultRoot.scrollIntoViewIfNeeded();

  await assertPublicAnatomy(defaultRoot);
  await assertSpecParityFixtures(page);
  await assertClearEligibility(page);
  await assertInlineKeyboardAndPointer(page);
  await assertControlledBlackState(page);
  await assertControlledState(page);
  await assertControllednessInvariance(page);
  await assertFormAndReset(page);
  await assertRequiredAndInvalidRecovery(page);
  await assertDisabledAndReadOnly(page);
  await assertNestedPopupFocus(page);
}

async function assertCanonicalDocsComposition(page) {
  const section = page.getByTestId("canonical-docs-color-picker");
  const root = page.locator("#react-runtime-prototype-docs-canonical-color-picker");
  await section.scrollIntoViewIfNeeded();

  assert.equal(await section.count(), 1);
  assert.equal(
    await section.evaluate(
      (canonical, qa) =>
        Boolean(canonical.compareDocumentPosition(qa) & Node.DOCUMENT_POSITION_FOLLOWING),
      await page.getByRole("heading", { name: "Focused QA fixtures" }).elementHandle(),
    ),
    true,
    "the canonical docs composition appears before QA variants",
  );
  assert.equal(await root.locator('[data-slot="color-picker-hidden-input"]').count(), 1);
  assert.equal(await root.locator('[data-slot="color-picker-value-text"]').count(), 1);

  await root.getByRole("button", { name: "Open brand color picker" }).click();
  const content = page.getByTestId("canonical-docs-color-picker-content");
  await content.waitFor();

  assert.equal(await content.locator('[data-slot="color-picker-clear"]').count(), 0);
  assert.equal(await content.locator('[data-slot="color-picker-swatch"]').count(), 5);
  assert.equal(await content.locator('[data-slot="color-picker-channel-slider"]').count(), 2);
  assert.equal(await content.locator('[data-slot="color-picker-separator"]').isVisible(), true);
  await assertSliderEndpointGeometry(content);

  const eyeDropper = content.getByRole("button", { name: "Pick a color from the screen" });
  assert.equal(await eyeDropper.count(), 1);
  assert.equal((await eyeDropper.textContent()).trim(), "");
  assert.equal(await eyeDropper.locator("svg").getAttribute("aria-hidden"), "true");

  const area = content.locator('[data-slot="color-picker-area"]');
  const areaThumb = content.locator('[data-slot="color-picker-area-thumb"]');
  const areaBox = await area.boundingBox();
  const areaThumbBox = await areaThumb.boundingBox();
  assert.ok(areaBox && areaThumbBox);
  assert.equal(await area.evaluate((element) => getComputedStyle(element).overflow), "visible");
  assert.equal(await area.evaluate((element) => getComputedStyle(element).borderTopWidth), "1px");
  assert.ok(areaThumbBox.x + areaThumbBox.width > areaBox.x + areaBox.width);
  assert.ok(areaThumbBox.y < areaBox.y);

  const valueSwatch = root.locator('[data-slot="color-picker-value-swatch"]');
  const valueSwatchStyle = await valueSwatch.evaluate((element) => ({
    backgroundImage: getComputedStyle(element).backgroundImage,
    borderWidth: getComputedStyle(element).borderTopWidth,
  }));
  assert.equal(valueSwatchStyle.borderWidth, "1px");
  assert.match(valueSwatchStyle.backgroundImage, /linear-gradient/);
  assert.equal(
    await valueSwatch
      .locator('[data-slot="color-picker-transparency-grid"]')
      .evaluate((element) => getComputedStyle(element).display),
    "none",
  );

  await root.getByRole("button", { name: "Open brand color picker" }).click();
  await content.waitFor({ state: "hidden" });
  const trigger = root.getByRole("button", { name: "Open brand color picker" });
  await trigger.click();
  await content.waitFor();
  await assertBlankControlSpaceDismisses({ page, popup: content, root, trigger });
}

async function assertCanonicalComposition(page, root) {
  assert.equal(await page.getByTestId("canonical-color-picker").count(), 1);
  assert.equal(await root.locator('[data-slot="color-picker-control"]').count(), 1);
  assert.equal(await root.locator('[data-slot="color-picker-hidden-input"]').count(), 1);
  assert.equal(await page.getByTestId("canonical-native-color-picker-input").count(), 1);
  assert.equal(
    await page
      .getByTestId("canonical-native-color-picker-input")
      .locator('[data-slot="color-picker-native-format-select"]')
      .count(),
    1,
  );
  assert.equal(await page.getByTestId("canonical-color-picker-sizes").count(), 1);
  const swatchOnlyTrigger = page.getByTestId("canonical-color-picker-swatch-trigger");
  assert.equal(await swatchOnlyTrigger.count(), 1);
  assert.equal(
    await swatchOnlyTrigger.locator('[data-slot="color-picker-value-swatch"]').count(),
    1,
  );
  assert.equal(await swatchOnlyTrigger.locator('[data-slot="color-picker-value-text"]').count(), 0);
  const swatchOnlyPaint = await swatchOnlyTrigger
    .locator('[data-slot="color-picker-value-swatch"]')
    .evaluate((swatch) => ({
      color: getComputedStyle(swatch).getPropertyValue("--sw-color-picker-swatch-color").trim(),
      height: swatch.getBoundingClientRect().height,
      width: swatch.getBoundingClientRect().width,
    }));
  assert.notEqual(swatchOnlyPaint.color, "");
  assert.ok(swatchOnlyPaint.height > 0);
  assert.ok(swatchOnlyPaint.width > 0);
  assert.equal(await page.locator("#react-color-picker-anatomy-heading + dl > div").count(), 8);
  await assertRenderedSizeScale(page);
}

async function assertSliderEndpointGeometry(content) {
  const sliders = content.locator('[data-slot="color-picker-channel-slider"]');
  const contentBox = await content.boundingBox();
  assert.ok(contentBox);

  for (let index = 0; index < 2; index += 1) {
    const slider = sliders.nth(index);
    const input = slider.locator('[data-slot="color-picker-channel-slider-input"]');
    const thumb = slider.locator('[data-slot="color-picker-channel-slider-thumb"]');

    for (const [key, endpoint] of [
      ["Home", "start"],
      ["End", "end"],
    ]) {
      await input.press(key);
      const sliderBox = await slider.boundingBox();
      const thumbBox = await thumb.boundingBox();
      assert.ok(sliderBox && thumbBox);

      const expectedCenter = endpoint === "start" ? sliderBox.x : sliderBox.x + sliderBox.width;
      const actualCenter = thumbBox.x + thumbBox.width / 2;
      assert.ok(
        Math.abs(actualCenter - expectedCenter) <= 1,
        `${index === 0 ? "hue" : "alpha"} thumb remains center-aligned at ${endpoint}`,
      );
      assert.ok(thumbBox.x >= contentBox.x);
      assert.ok(thumbBox.x + thumbBox.width <= contentBox.x + contentBox.width);
      if (endpoint === "start") {
        assert.ok(thumbBox.x < sliderBox.x, "the start thumb visibly overhangs its track");
      } else {
        assert.ok(
          thumbBox.x + thumbBox.width > sliderBox.x + sliderBox.width,
          "the end thumb visibly overhangs its track",
        );
      }
    }
  }
}

async function assertRenderedSizeScale(page) {
  const expected = {
    sm: { controlHeight: 36, minWidth: 80, swatchSize: 24 },
    md: { controlHeight: 36, minWidth: 80, swatchSize: 28 },
    lg: { controlHeight: 44, minWidth: 96, swatchSize: 32 },
  };

  for (const [label, size] of [
    ["Small", "sm"],
    ["Medium", "md"],
    ["Large", "lg"],
  ]) {
    const trigger = page.getByRole("button", {
      name: `Open ${label.toLowerCase()} color picker`,
    });
    await trigger.click();
    const content = page.getByTestId(`canonical-color-picker-${size}-content`);
    await content.waitFor();

    const inputBox = await content.locator('[data-slot="color-picker-value-input"]').boundingBox();
    const select = content.getByRole("combobox", { name: "Color format" });
    const selectBox = await select.boundingBox();
    const swatch = content.locator('[data-slot="color-picker-swatch"]');
    const swatchBox = await swatch.boundingBox();
    assert.ok(inputBox && selectBox && swatchBox);
    assert.equal(
      await content
        .locator('[data-slot="color-picker-value-input"]')
        .evaluate((element) => Number.parseFloat(getComputedStyle(element).height)),
      expected[size].controlHeight,
    );
    assert.equal(
      await select.evaluate((element) => Number.parseFloat(getComputedStyle(element).height)),
      expected[size].controlHeight,
    );
    assert.equal(
      await select.evaluate((element) => Number.parseFloat(getComputedStyle(element).minWidth)),
      expected[size].minWidth,
    );
    assert.equal(
      await swatch.evaluate((element) => Number.parseFloat(getComputedStyle(element).width)),
      expected[size].swatchSize,
    );
    assert.equal(
      await swatch.evaluate((element) => Number.parseFloat(getComputedStyle(element).height)),
      expected[size].swatchSize,
    );

    await page.keyboard.press("Escape");
    await content.waitFor({ state: "hidden" });
  }
}

async function assertNestedCompositeFormatSelect(page, root) {
  await root.evaluate((element) =>
    window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - 20 }),
  );
  const trigger = page.getByTestId("canonical-color-picker-trigger");
  await trigger.click();

  const popover = page.getByTestId("canonical-color-picker-content");
  await popover.waitFor();
  await page.waitForFunction(
    () =>
      getComputedStyle(document.querySelector('[data-testid="canonical-color-picker-content"]'))
        .transform === "none",
  );
  assert.equal(await popover.getAttribute("data-side"), "bottom");
  assert.equal(await popover.getAttribute("data-align"), "start");
  assert.doesNotMatch((await popover.getAttribute("class")) ?? "", /zoom-out|slide-out-to/);
  const triggerBox = await trigger.boundingBox();
  const initialPopoverBox = await popover.boundingBox();
  assert.ok(triggerBox && initialPopoverBox);
  assert.ok(
    initialPopoverBox.y >= triggerBox.y + triggerBox.height,
    "Color Picker content is geometrically below its trigger",
  );
  const formatTrigger = popover.getByRole("combobox", { name: "Color format" });
  await formatTrigger.click();

  const options = root.locator("[data-sw-color-picker-format-options]:visible");
  await options.waitFor();
  const positioner = options.locator("xpath=..");
  assert.equal(await positioner.evaluate((element) => getComputedStyle(element).zIndex), "60");

  await options.getByRole("option", { name: "RGB" }).click();
  await page.waitForFunction(
    () =>
      document.querySelector("#canonical-color-picker-root")?.getAttribute("data-format") === "rgb",
  );

  assert.equal(await root.getAttribute("data-format"), "rgb");
  assert.equal(
    await popover.isVisible(),
    true,
    "nested Select click keeps the parent Popover open",
  );
  assert.equal(await trigger.getAttribute("aria-expanded"), "true");
  const changedPopoverBox = await popover.boundingBox();
  assert.ok(initialPopoverBox && changedPopoverBox);
  assert.ok(
    Math.abs(initialPopoverBox.x - changedPopoverBox.x) <= 1,
    "start-aligned Color Picker placement remains stable when trigger text width changes",
  );

  await page.getByRole("heading", { name: "Focused QA fixtures" }).click();
  await popover.waitFor({ state: "hidden" });
}

async function assertConstrainedColorPickerPlacement(page) {
  const trigger = page.getByTestId("canonical-color-picker-trigger");
  const popup = page.getByTestId("canonical-color-picker-content");
  const originalStyle = await trigger.getAttribute("style");

  try {
    await page.setViewportSize({ width: 500, height: 800 });
    await trigger.evaluate((element) => {
      element.style.position = "fixed";
      element.style.inset = "auto auto 20px 24px";
      element.style.zIndex = "100";
    });
    await trigger.click();
    await page.waitForFunction(
      (element) => element?.getAttribute("data-side") === "top",
      await popup.elementHandle(),
    );

    const flippedGeometry = await popup.evaluate((element) => {
      const area = element.querySelector('[data-slot="color-picker-area"]');
      const popupRect = element.getBoundingClientRect();
      return {
        areaHeight: area?.getBoundingClientRect().height ?? 0,
        bottom: popupRect.bottom,
        top: popupRect.top,
      };
    });
    assert.ok(
      flippedGeometry.areaHeight >= 128,
      "Color Picker area keeps its 128px minimum height",
    );
    assert.ok(flippedGeometry.top >= 8, "flipped Color Picker remains within viewport padding");
    assert.ok(flippedGeometry.bottom <= 792, "flipped Color Picker remains on screen");
    await page.keyboard.press("Escape");
    await popup.waitFor({ state: "hidden" });

    await page.setViewportSize({ width: 500, height: 260 });
    await trigger.evaluate((element) => {
      element.style.inset = "170px auto auto 24px";
    });
    await trigger.click();
    await popup.waitFor();

    const constrainedGeometry = await popup.evaluate((element) => {
      const area = element.querySelector('[data-slot="color-picker-area"]');
      const popupRect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        areaHeight: area?.getBoundingClientRect().height ?? 0,
        bottom: popupRect.bottom,
        clientHeight: element.clientHeight,
        overflowY: style.overflowY,
        scrollHeight: element.scrollHeight,
        top: popupRect.top,
      };
    });
    assert.ok(constrainedGeometry.areaHeight >= 128, "short viewports do not collapse the area");
    assert.ok(
      constrainedGeometry.top >= 8,
      "constrained Color Picker remains above viewport padding",
    );
    assert.ok(
      constrainedGeometry.bottom <= 252,
      "constrained Color Picker remains below viewport padding",
    );
    assert.equal(constrainedGeometry.overflowY, "auto");
    assert.ok(
      constrainedGeometry.scrollHeight > constrainedGeometry.clientHeight,
      "the complete Color Picker scrolls when neither side can fit it",
    );
    await page.keyboard.press("Escape");
    await popup.waitFor({ state: "hidden" });
  } finally {
    await trigger.evaluate((element, style) => {
      if (style === null) element.removeAttribute("style");
      else element.setAttribute("style", style);
    }, originalStyle);
    await page.setViewportSize({ width: 1280, height: 900 });
  }
}

async function assertBlankControlSpaceDismisses({ page, popup, root, trigger }) {
  const rootBox = await root.boundingBox();
  const triggerBox = await trigger.boundingBox();
  assert.ok(rootBox && triggerBox);

  const point = {
    x: Math.min(triggerBox.x + triggerBox.width + 24, rootBox.x + rootBox.width - 4),
    y: triggerBox.y + triggerBox.height / 2,
  };
  assert.ok(
    point.x > triggerBox.x + triggerBox.width + 1,
    "fixture exposes blank space right of trigger",
  );
  assert.equal(
    await root.evaluate(
      (element, coordinates) =>
        element.contains(document.elementFromPoint(coordinates.x, coordinates.y)),
      point,
    ),
    true,
    "the click point remains inside the Color Picker root",
  );
  assert.equal(
    await trigger.evaluate(
      (element, coordinates) =>
        element.contains(document.elementFromPoint(coordinates.x, coordinates.y)),
      point,
    ),
    false,
    "the click point is outside the visible trigger",
  );

  await page.mouse.click(point.x, point.y);
  await popup.waitFor({ state: "hidden", timeout: 1000 });
}

async function assertControllednessInvariance(page) {
  const controlledFixture = page.getByTestId("initially-controlled-mode-fixture");
  const controlledRoot = page.locator("#react-color-picker-mode-controlled");
  const controlledInput = controlledRoot.getByRole("textbox");
  const controlledElement = await controlledRoot.elementHandle();
  assert.ok(controlledElement);

  assert.match(await controlledInput.inputValue(), /^#4f46e5$/i);
  await controlledFixture.getByRole("button", { name: "Attempt to omit controlled value" }).click();
  await page
    .getByTestId("mode-controlled-prop")
    .getByText(/omitted$/)
    .waitFor();
  assert.match(await controlledInput.inputValue(), /^#4f46e5$/i);
  assert.match(await page.getByTestId("mode-controlled-changes").textContent(), /0$/);
  assert.match(await page.getByTestId("mode-controlled-commits").textContent(), /0$/);

  await controlledFixture.getByRole("button", { name: "Controlled choose rose" }).click();
  await page.getByTestId("mode-controlled-changes").getByText(/1$/).waitFor();
  await page.getByTestId("mode-controlled-commits").getByText(/1$/).waitFor();
  assert.match(
    await controlledInput.inputValue(),
    /^#4f46e5$/i,
    "an initially controlled root does not begin accepting internal state when value is omitted",
  );
  assert.match(await page.getByTestId("mode-controlled-value").textContent(), /^#e11d48$/i);
  assert.match(
    await page.getByTestId("mode-controlled-last-event").textContent(),
    /#e11d48:swatch-press$/i,
  );

  await controlledFixture
    .getByRole("button", { name: "Re-pass external controlled green" })
    .click();
  await page
    .getByTestId("mode-controlled-prop")
    .getByText(/passed$/)
    .waitFor();
  await page.waitForFunction(
    () =>
      document
        .querySelector("#react-color-picker-mode-controlled [data-slot='color-picker-value-input']")
        ?.value.toLowerCase() === "#16a34a",
  );
  assert.match(await page.getByTestId("mode-controlled-changes").textContent(), /1$/);
  assert.match(await page.getByTestId("mode-controlled-commits").textContent(), /1$/);
  await assertSameElement(page, controlledRoot, controlledElement);

  const uncontrolledFixture = page.getByTestId("initially-uncontrolled-mode-fixture");
  const uncontrolledRoot = page.locator("#react-color-picker-mode-uncontrolled");
  const uncontrolledInput = uncontrolledRoot.getByRole("textbox");
  const uncontrolledElement = await uncontrolledRoot.elementHandle();
  assert.ok(uncontrolledElement);

  assert.match(await uncontrolledInput.inputValue(), /^#4f46e5$/i);
  await uncontrolledFixture.getByRole("button", { name: "Uncontrolled choose rose" }).click();
  await page.getByTestId("mode-uncontrolled-changes").getByText(/1$/).waitFor();
  await page.getByTestId("mode-uncontrolled-commits").getByText(/1$/).waitFor();
  assert.match(await uncontrolledInput.inputValue(), /^#e11d48$/i);

  await uncontrolledFixture
    .getByRole("button", { name: "Attempt to pass controlled green" })
    .click();
  await page
    .getByTestId("mode-uncontrolled-prop")
    .getByText(/passed$/)
    .waitFor();
  assert.match(
    await uncontrolledInput.inputValue(),
    /^#e11d48$/i,
    "an initially uncontrolled root retains its accepted internal value when value is passed later",
  );
  assert.match(await page.getByTestId("mode-uncontrolled-changes").textContent(), /1$/);
  assert.match(await page.getByTestId("mode-uncontrolled-commits").textContent(), /1$/);

  await uncontrolledFixture.getByRole("button", { name: "Uncontrolled choose indigo" }).click();
  await page.getByTestId("mode-uncontrolled-changes").getByText(/2$/).waitFor();
  await page.getByTestId("mode-uncontrolled-commits").getByText(/2$/).waitFor();
  assert.match(await uncontrolledInput.inputValue(), /^#4f46e5$/i);
  assert.match(
    await page.getByTestId("mode-uncontrolled-last-event").textContent(),
    /#4f46e5:swatch-press$/i,
  );
  await assertSameElement(page, uncontrolledRoot, uncontrolledElement);

  await controlledElement.dispose();
  await uncontrolledElement.dispose();
}

async function assertSameElement(page, locator, originalElement) {
  const currentElement = await locator.elementHandle();
  assert.ok(currentElement);
  try {
    assert.equal(
      await page.evaluate(
        ([original, current]) => original === current,
        [originalElement, currentElement],
      ),
      true,
      "the ColorPicker root DOM node remains identical across prop-mode changes",
    );
  } finally {
    await currentElement.dispose();
  }
}

async function assertSpecParityFixtures(page) {
  for (const format of ["hex", "rgb", "hsl", "hsb"]) {
    const root = page.locator(`#react-color-picker-format-${format}`);
    assert.equal(await root.getAttribute("data-format"), format);
    assert.equal(await root.locator('[data-slot="color-picker-format-control"]').count(), 1);
    assert.equal(await root.getByRole("combobox", { name: "Color format" }).count(), 1);
    assert.notEqual(await root.getByRole("textbox").inputValue(), "");
  }

  assert.equal(
    await page
      .locator('#react-color-picker-alpha-enabled [data-slot="color-picker-channel-slider-input"]')
      .count(),
    2,
  );
  assert.equal(
    await page
      .locator('#react-color-picker-alpha-disabled [data-slot="color-picker-channel-slider-input"]')
      .count(),
    1,
  );
  assert.match(
    await page.locator("#react-color-picker-alpha-disabled").getByRole("textbox").inputValue(),
    /^#0ea5e9$/i,
  );
}

async function assertClearEligibility(page) {
  const fixture = page.getByTestId("color-picker-clear-eligibility-fixture");
  await fixture.getByRole("button", { name: "Open advanced Clear color picker" }).click();
  const content = page.getByTestId("color-picker-clear-eligibility-content");
  await content.waitFor();
  const clear = content.getByRole("button", { name: "Clear color", includeHidden: true });
  const separator = content.locator('[data-slot="color-picker-separator"]');

  assert.equal(await clear.getAttribute("hidden"), "");
  assert.equal(await clear.isDisabled(), true);
  assert.equal(await separator.isVisible(), false);

  await fixture.getByRole("button", { name: "Toggle empty values" }).click();
  await page
    .getByTestId("color-picker-clear-eligibility-state")
    .getByText(/allowed$/)
    .waitFor();
  await clear.waitFor({ state: "visible" });
  assert.equal(await clear.isDisabled(), false);
  assert.equal(await separator.isVisible(), true);

  await fixture.getByRole("button", { name: "Toggle empty values" }).click();
  await page
    .getByTestId("color-picker-clear-eligibility-state")
    .getByText(/disallowed$/)
    .waitFor();
  await clear.waitFor({ state: "hidden" });
  assert.equal(await clear.getAttribute("hidden"), "");
  assert.equal(await clear.isDisabled(), true);
  assert.equal(await separator.isVisible(), false);

  await page.keyboard.press("Escape");
  await content.waitFor({ state: "hidden" });
}

async function assertControlledBlackState(page) {
  const fixture = page.getByTestId("controlled-color-picker-fixture");
  await fixture.getByRole("button", { name: "External black HSB sync" }).click();
  await page
    .getByTestId("controlled-color-value")
    .getByText(/#000000/i)
    .waitFor();
  assert.match(await page.getByTestId("controlled-color-hsb-value").textContent(), /75%, 0%/);
  assert.match(await page.getByTestId("controlled-color-change-count").textContent(), /0$/);
  assert.match(await page.getByTestId("controlled-color-commit-count").textContent(), /0$/);

  await fixture.getByRole("button", { name: "External open" }).click();
  const popup = page.locator('[data-slot="popover-content"]:visible');
  await popup.waitFor();
  const area = popup.locator('[data-slot="color-picker-area"]');
  const thumb = popup.locator('[data-slot="color-picker-area-thumb"]');
  const areaBox = await area.boundingBox();
  const thumbBox = await thumb.boundingBox();
  assert.ok(areaBox && thumbBox);
  const thumbCenterX = thumbBox.x + thumbBox.width / 2;
  assert.ok(
    thumbCenterX > areaBox.x + areaBox.width * 0.7,
    "controlled black preserves its meaningful saturation coordinate",
  );

  await fixture.getByRole("button", { name: "External close" }).click();
  await popup.waitFor({ state: "hidden" });
}

async function assertPublicAnatomy(root) {
  await root.locator('[data-slot="color-picker-label"]').waitFor();
  assert.equal(await root.locator('[data-slot="color-picker-control"]').count(), 1);
  assert.equal(await root.locator('[data-slot="color-picker-value-input"]').count(), 2);
  assert.equal(await root.locator('[data-slot="popover-trigger"]').count(), 1);
  assert.equal(await root.locator('[data-slot="color-picker-hidden-input"]').count(), 1);
  assert.equal(await root.getByRole("button", { name: "Open accent color picker" }).count(), 1);
  assert.equal(await root.getByRole("textbox").count(), 1);
}

async function assertInlineKeyboardAndPointer(page) {
  const root = page.locator("#react-color-picker-inline");
  const input = root.getByRole("textbox");
  const area = root.locator('[data-slot="color-picker-area"]');
  const hue = root.locator('[data-slot="color-picker-channel-slider-input"]').first();

  await input.waitFor();
  const beforePointer = await input.inputValue();
  await area.click({ position: { x: 50, y: 30 } });
  assert.notEqual(
    await input.inputValue(),
    beforePointer,
    "area pointer editing changes the value",
  );

  const beforeKeyboard = await input.inputValue();
  await hue.focus();
  await hue.press("End");
  await page.waitForFunction(
    (before) =>
      document.querySelector('#react-color-picker-inline [data-slot="color-picker-value-input"]')
        ?.value !== before,
    beforeKeyboard,
  );
  assert.notEqual(
    await input.inputValue(),
    beforeKeyboard,
    "slider keyboard editing changes value",
  );
}

async function assertControlledState(page) {
  const fixture = page.getByTestId("controlled-color-picker-fixture");
  const value = page.getByTestId("controlled-color-value");
  const changes = page.getByTestId("controlled-color-change-count");
  const commits = page.getByTestId("controlled-color-commit-count");

  await fixture.getByRole("button", { name: "External rose sync" }).click();
  await value.getByText(/#e11d48/i).waitFor();
  assert.match(await changes.textContent(), /0$/);
  assert.match(await commits.textContent(), /0$/);

  await fixture.getByRole("button", { name: "External open" }).click();
  await page.getByTestId("controlled-color-open").getByText(/open$/).waitFor();
  assert.match(await changes.textContent(), /0$/, "opening the popup does not change color");
  assert.match(await commits.textContent(), /0$/, "opening the popup does not commit color");
  const popup = page.locator('[data-slot="popover-content"]:visible');
  await popup.waitFor();

  await popup.locator('[data-slot="color-picker-area"]').click({ position: { x: 40, y: 28 } });
  await changes.getByText(/1$/).waitFor();
  await commits.getByText(/1$/).waitFor();
  const pointerValue = (await value.textContent()).replace("Value: ", "").trim();
  assert.match(
    await page.getByTestId("controlled-color-last-change").textContent(),
    new RegExp(`${pointerValue}:area-drag$`, "i"),
  );
  assert.match(
    await page.getByTestId("controlled-color-last-commit").textContent(),
    new RegExp(`${pointerValue}:area-drag$`, "i"),
  );

  await popup.locator('[data-slot="color-picker-channel-slider-input"]').first().press("End");
  await changes.getByText(/2$/).waitFor();
  await commits.getByText(/2$/).waitFor();
  const keyboardValue = (await value.textContent()).replace("Value: ", "").trim();
  assert.match(
    await page.getByTestId("controlled-color-last-change").textContent(),
    new RegExp(`${keyboardValue}:keyboard$`, "i"),
  );
  assert.match(
    await page.getByTestId("controlled-color-last-commit").textContent(),
    new RegExp(`${keyboardValue}:keyboard$`, "i"),
  );
  await page.waitForTimeout(100);
  assert.match(
    await changes.textContent(),
    /2$/,
    "keyboard edit does not emit a delayed duplicate",
  );
  assert.match(
    await commits.textContent(),
    /2$/,
    "keyboard commit does not emit a delayed duplicate",
  );

  await fixture.getByRole("button", { name: "External close" }).click();
  await popup.waitFor({ state: "hidden" });
  assert.match(await changes.textContent(), /2$/, "closing the popup does not change color");
  assert.match(await commits.textContent(), /2$/, "closing the popup does not commit color");

  await fixture.getByRole("button", { name: "External open" }).click();
  await page.locator('[data-slot="popover-content"]:visible').waitFor();
  await popup.getByRole("button", { name: "Use #4f46e5" }).click();
  await value.getByText(/#4f46e5/i).waitFor();
  assert.match(await changes.textContent(), /3$/);
  assert.match(await commits.textContent(), /3$/);

  await fixture.getByRole("button", { name: "Cancel next change" }).click();
  await fixture.getByRole("button", { name: "External open" }).click();
  await page.locator('[data-slot="popover-content"]:visible').waitFor();
  await page
    .locator('[data-slot="popover-content"]:visible')
    .getByRole("button", { name: "Use #e11d48" })
    .click();
  await page
    .getByTestId("controlled-color-last-change")
    .getByText(/#e11d48/i)
    .waitFor();
  assert.match(await value.textContent(), /#4f46e5/i, "canceled value is not accepted");
  assert.match(await changes.textContent(), /4$/);
  assert.match(await commits.textContent(), /3$/, "canceled edit does not duplicate a commit");

  await fixture.getByRole("button", { name: "External clear" }).click();
  await value.getByText(/empty$/).waitFor();
  assert.match(await changes.textContent(), /4$/, "external synchronization is non-emitting");
  assert.match(await commits.textContent(), /3$/, "external synchronization does not commit");

  await fixture.getByRole("button", { name: "External close" }).click();
  await page.locator('[data-slot="popover-content"]:visible').waitFor({ state: "hidden" });
}

async function assertRequiredAndInvalidRecovery(page) {
  const invalidRoot = page.locator("#react-color-picker-invalid-draft");
  const invalidInput = invalidRoot.getByRole("textbox");
  await invalidInput.fill("not-a-color");
  assert.equal(await invalidInput.getAttribute("aria-invalid"), "true");
  assert.equal(await invalidInput.inputValue(), "not-a-color");
  await invalidInput.press("Escape");
  assert.match(await invalidInput.inputValue(), /^#0f766e$/i);
  assert.notEqual(await invalidInput.getAttribute("aria-invalid"), "true");

  const form = page.locator("#react-color-picker-required-form");
  const hidden = form.locator('[data-slot="color-picker-hidden-input"]');
  const result = page.getByTestId("color-picker-required-result");
  assert.equal(await hidden.evaluate((input) => input.checkValidity()), false);
  await form.getByRole("button", { name: "Submit required color" }).click();
  await result.getByText("invalid").waitFor();
  await form.getByRole("button", { name: "Choose required green" }).click();
  assert.equal(await hidden.evaluate((input) => input.checkValidity()), true);
  await form.getByRole("button", { name: "Submit required color" }).click();
  await result.getByText(/#16a34a/i).waitFor();
  const hue = form.locator('[data-slot="color-picker-channel-slider"][data-channel="hue"] input');
  const areaThumb = form.locator('[data-slot="color-picker-area-thumb"]');
  const retainedHue = await hue.inputValue();
  const retainedAreaPosition = await areaThumb.evaluate((thumb) => ({
    x: thumb.style.getPropertyValue("--sw-color-picker-area-x"),
    y: thumb.style.getPropertyValue("--sw-color-picker-area-y"),
  }));
  await form.getByRole("button", { name: "Clear required color" }).click();
  assert.equal(await hidden.evaluate((input) => input.checkValidity()), false);
  assert.equal(await hue.inputValue(), retainedHue);
  assert.deepEqual(
    await areaThumb.evaluate((thumb) => ({
      x: thumb.style.getPropertyValue("--sw-color-picker-area-x"),
      y: thumb.style.getPropertyValue("--sw-color-picker-area-y"),
    })),
    retainedAreaPosition,
  );
  await hue.press("ArrowRight");
  assert.equal(await hidden.evaluate((input) => input.checkValidity()), true);
  const resumedValue = await hidden.inputValue();
  assert.notEqual(resumedValue, "");
  await form.getByRole("button", { name: "Submit required color" }).click();
  await result.getByText(new RegExp(resumedValue, "i")).waitFor();
}

async function assertFormAndReset(page) {
  const form = page.locator("#react-color-picker-form");
  const result = page.getByTestId("color-picker-form-result");
  await form.getByRole("button", { name: "Submit color" }).click();
  await result.getByText(/#0ea5e9/i).waitFor();

  const input = form.getByRole("textbox");
  await input.fill("#f97316");
  await input.press("Enter");
  await form.getByRole("button", { name: "Submit color" }).click();
  await result.getByText(/#f97316/i).waitFor();

  await form.getByRole("button", { name: "Reset color" }).click();
  await result.getByText("reset").waitFor();
  assert.match(await input.inputValue(), /#0ea5e9/i);
}

async function assertDisabledAndReadOnly(page) {
  const disabled = page.locator("#react-color-picker-disabled");
  const readonly = page.locator("#react-color-picker-readonly");
  const disabledInput = disabled.getByRole("textbox").first();
  const readonlyInput = readonly.getByRole("textbox").first();
  const disabledValue = await disabledInput.inputValue();
  const readonlyValue = await readonlyInput.inputValue();
  assert.equal(await disabledInput.isDisabled(), true);
  assert.equal(await readonlyInput.getAttribute("readonly"), "");

  const disabledTrigger = disabled.getByRole("button", { name: "Open accent color picker" });
  assert.equal(await disabledTrigger.isDisabled(), true);
  await assert.rejects(disabledTrigger.click({ timeout: 500 }), /not enabled/);
  assert.equal(await page.locator('[data-slot="popover-content"]:visible').count(), 0);
  assert.equal(await disabledInput.inputValue(), disabledValue);

  await readonly.getByRole("button", { name: "Open accent color picker" }).click();
  const popup = page.locator('[data-slot="popover-content"]:visible');
  await popup.waitFor();
  await popup.locator('[data-slot="color-picker-area"]').click({ position: { x: 30, y: 20 } });
  assert.equal(await readonlyInput.inputValue(), readonlyValue);
  await page.getByRole("heading", { name: "Disabled and read-only" }).click();
  await popup.waitFor({ state: "hidden" });
}

async function assertNestedPopupFocus(page) {
  await page.getByRole("button", { name: "Open color picker dialog" }).click();
  const dialog = page.getByRole("dialog", { name: "Choose a dialog color" });
  await dialog.waitFor();
  const trigger = dialog.getByRole("button", { name: "Open accent color picker" });
  await trigger.click();
  const popup = page.locator('[data-slot="popover-content"]:visible');
  await popup.waitFor();
  await popup.locator('[data-slot="color-picker-area-input-x"]').focus();
  await trigger.focus();
  await trigger.press("Enter");
  await popup.waitFor({ state: "hidden" });
  assert.equal(await dialog.isVisible(), true, "closing nested popup preserves its Dialog");
  await trigger.waitFor({ state: "visible" });
  assert.equal(await trigger.evaluate((element) => element === document.activeElement), true);
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
}
