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
  styledAlertDialogDark: path.join(os.tmpdir(), "starwind-vue-styled-alert-dialog-open-dark.png"),
  styledAlertDialogLight: path.join(os.tmpdir(), "starwind-vue-styled-alert-dialog-open-light.png"),
  styledPopoverDark: path.join(os.tmpdir(), "starwind-vue-styled-popover-open-dark.png"),
  styledPopoverLight: path.join(os.tmpdir(), "starwind-vue-styled-popover-open-light.png"),
  styledMenusFloatingDark: path.join(
    os.tmpdir(),
    "starwind-vue-styled-menus-floating-open-dark.png",
  ),
  styledMenusFloatingLight: path.join(
    os.tmpdir(),
    "starwind-vue-styled-menus-floating-open-light.png",
  ),
  portableClosureDesktopDark: path.join(
    os.tmpdir(),
    "starwind-vue-portable-closure-desktop-dark.png",
  ),
  portableClosureDesktopLight: path.join(
    os.tmpdir(),
    "starwind-vue-portable-closure-desktop-light.png",
  ),
  portableClosureNarrowDark: path.join(
    os.tmpdir(),
    "starwind-vue-portable-closure-narrow-dark.png",
  ),
  portableClosureNarrowLight: path.join(
    os.tmpdir(),
    "starwind-vue-portable-closure-narrow-light.png",
  ),
};
const visualEvidenceDimensions = {};
const styledSheetGeometries = [];
const portableClosureEvidenceStyle =
  '[data-testid="vue-demo-header"] { visibility: hidden !important; }';
for (const theme of ["light", "dark"]) {
  for (const side of ["top", "right", "bottom", "left"]) {
    visualEvidence[`styledSheet${capitalize(side)}${capitalize(theme)}`] = path.join(
      os.tmpdir(),
      `starwind-vue-styled-sheet-${side}-${theme}.png`,
    );
  }
}

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

  await verifyAccordion(page);
  await verifyTabs(page);
  await verifyField(page);
  await verifySlider(page);
  await verifyInputOtp(page);
  await verifyDropzone(page);
  await verifyButton(page);
  await verifyCheckbox(page);
  await verifyCheckboxGroup(page);
  await verifyCollapsible(page);
  await verifyDialog(page);
  await verifyAlertDialog(page);
  await verifyDrawer(page);
  await verifyPopover(page);
  await verifyRadioGroup(page);
  await verifySwitch(page);
  await verifyToggle(page);
  await verifyToggleGroup(page);
  await verifyInput(page);
  await verifyForm(page);
  await verifySelect(page);
  await verifyStyledMenusFloating(page);
  await verifyStyledComplexServices(page);
  const styledProof = await verifyStyled(page);
  const portableClosureProof = await verifyPortableStyledClosure(page, visualEvidence);
  await verifyStyledPopover(page, visualEvidence.styledPopoverLight, "light");
  visualEvidenceDimensions.styledAlertDialogLight = await verifyStyledAlertDialog(
    page,
    "cancel",
    visualEvidence.styledAlertDialogLight,
    "light",
  );
  await verifyStyledSheetEvidence(page, "light", visualEvidence);
  await captureStyledMenusFloatingEvidence(page, visualEvidence.styledMenusFloatingLight, "light");
  const avatarProof = await verifyAvatar(page);
  const progressProof = await verifyProgress(page);
  const scrollAreaProof = await verifyScrollArea(page);
  await captureReviewEvidence(page, visualEvidence.light);
  const themeProof = await verifyTheme(page);
  await verifyPortableStyledClosureDark(page, portableClosureProof, visualEvidence);
  await verifyAvatarDark(page, avatarProof);
  await verifyProgressDark(page, progressProof);
  await verifyScrollAreaDark(page, scrollAreaProof);
  await verifyStyledFormsDark(page, styledProof);
  await verifyStyledPopover(page, visualEvidence.styledPopoverDark, "dark");
  visualEvidenceDimensions.styledAlertDialogDark = await verifyStyledAlertDialog(
    page,
    "action",
    visualEvidence.styledAlertDialogDark,
    "dark",
  );
  await verifyStyledSheetEvidence(page, "dark", visualEvidence);
  await captureStyledMenusFloatingEvidence(page, visualEvidence.styledMenusFloatingDark, "dark");
  await captureReviewEvidence(page, visualEvidence.dark);
  await assertNoErrors(messages);

  await page.goto(new URL("/", baseUrl).toString(), { waitUntil: "networkidle" });
  await page.getByTestId("vue-review-index").waitFor();
  await verifyPersistentHeader(page, "index");
  await verifyIndexDarkTheme(page, themeProof);
  await assertNoErrors(messages);

  console.log(
    `Vue production demo smoke passed at ${new URL("/review", baseUrl)}. Visual evidence: ${visualEvidence.light}, ${visualEvidence.dark}. Portable closure evidence: ${visualEvidence.portableClosureDesktopLight}, ${visualEvidence.portableClosureDesktopDark}, ${visualEvidence.portableClosureNarrowLight}, ${visualEvidence.portableClosureNarrowDark}. Styled menus and floating evidence: ${visualEvidence.styledMenusFloatingLight}, ${visualEvidence.styledMenusFloatingDark}. Styled Popover evidence: ${visualEvidence.styledPopoverLight}, ${visualEvidence.styledPopoverDark}. Styled Alert Dialog evidence: ${visualEvidence.styledAlertDialogLight} (${formatDimensions(visualEvidenceDimensions.styledAlertDialogLight)}), ${visualEvidence.styledAlertDialogDark} (${formatDimensions(visualEvidenceDimensions.styledAlertDialogDark)}). Styled Sheet geometries: ${JSON.stringify(styledSheetGeometries)}. Styled Sheet side evidence: ${["light", "dark"].flatMap((theme) => ["top", "right", "bottom", "left"].map((side) => visualEvidence[`styledSheet${capitalize(side)}${capitalize(theme)}`])).join(", ")}`,
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

async function verifyPortableStyledClosure(page, evidence) {
  const section = page.getByTestId("portable-styled-closure-review");
  await section.scrollIntoViewIfNeeded();
  await assertEqual(await section.count(), 1, "portable closure catalog inventory");
  await assertEqual(
    await section.locator("[data-closure-group]").count(),
    19,
    "portable closure group inventory",
  );
  await assertEqual(
    await page.getByTestId("portable-closure-grid").getAttribute("data-closure-group-count"),
    "19",
    "portable closure declared group count",
  );

  await assertEqual(
    await page.getByTestId("portable-alert").getAttribute("role"),
    "alert",
    "portable Alert inferred semantics",
  );
  await assertEqual(
    await page.getByTestId("portable-alert").getAttribute("data-forwarded"),
    "alert",
    "portable Alert attrs",
  );
  await assertEqual(
    await page.getByTestId("portable-aspect-ratio").evaluate((element) => element.tagName),
    "FIGURE",
    "portable Aspect Ratio dynamic root",
  );
  await assertEqual(
    await page.getByTestId("portable-breadcrumb").evaluate((element) => element.tagName),
    "NAV",
    "portable Breadcrumb semantics",
  );
  await assertEqual(
    await page.getByTestId("portable-breadcrumb").getAttribute("aria-label"),
    "Portable catalog path",
    "portable Breadcrumb public label",
  );
  await assertEqual(
    await page.getByTestId("portable-native-select").evaluate((element) => element.tagName),
    "SELECT",
    "portable Native Select semantics",
  );
  await assertEqual(
    await page.getByTestId("portable-native-select").inputValue(),
    "eu",
    "portable Native Select value",
  );
  const nativeSelectGeometry = await page
    .getByTestId("portable-native-select")
    .evaluate((select) => {
      const wrapper = select.parentElement;
      const icon = wrapper?.querySelector('[data-testid="portable-native-select-icon"]');
      if (!(wrapper instanceof HTMLElement) || !(icon instanceof HTMLElement)) {
        throw new Error("portable Native Select wrapper and custom icon are required");
      }
      const wrapperBounds = wrapper.getBoundingClientRect();
      const iconBounds = icon.getBoundingClientRect();
      const iconStyle = getComputedStyle(icon);
      return {
        contained:
          iconBounds.left >= wrapperBounds.left &&
          iconBounds.right <= wrapperBounds.right &&
          iconBounds.top >= wrapperBounds.top &&
          iconBounds.bottom <= wrapperBounds.bottom,
        height: iconBounds.height,
        position: iconStyle.position,
        rightInset: wrapperBounds.right - iconBounds.right,
        verticalDelta: Math.abs(
          iconBounds.top + iconBounds.height / 2 - (wrapperBounds.top + wrapperBounds.height / 2),
        ),
        visibility: iconStyle.visibility,
        width: iconBounds.width,
      };
    });
  await assertEqual(
    nativeSelectGeometry.contained,
    true,
    "portable Native Select icon containment",
  );
  await assertEqual(
    nativeSelectGeometry.position,
    "absolute",
    "portable Native Select icon position",
  );
  await assertEqual(
    nativeSelectGeometry.visibility,
    "visible",
    "portable Native Select icon visibility",
  );
  if (
    nativeSelectGeometry.width <= 0 ||
    nativeSelectGeometry.height <= 0 ||
    nativeSelectGeometry.rightInset < 8 ||
    nativeSelectGeometry.rightInset > 16 ||
    nativeSelectGeometry.verticalDelta > 1
  ) {
    throw new Error(
      `portable Native Select icon geometry: ${JSON.stringify(nativeSelectGeometry)}`,
    );
  }
  await assertEqual(
    await page.getByTestId("portable-label").getAttribute("for"),
    "portable-labelled-input",
    "portable Label target",
  );
  const labelledInputGeometry = await page
    .getByTestId("portable-labelled-input")
    .evaluate((input) => {
      const bounds = input.getBoundingClientRect();
      const style = getComputedStyle(input);
      const label = document.querySelector('[data-testid="portable-label"]');
      return {
        associated:
          label instanceof HTMLLabelElement &&
          label.control === input &&
          input instanceof HTMLInputElement,
        display: style.display,
        height: bounds.height,
        visibility: style.visibility,
        width: bounds.width,
      };
    });
  await assertEqual(labelledInputGeometry.associated, true, "portable Label control association");
  if (
    labelledInputGeometry.display === "none" ||
    labelledInputGeometry.visibility !== "visible" ||
    labelledInputGeometry.width <= 0 ||
    labelledInputGeometry.height <= 0
  ) {
    throw new Error(`portable labelled Input geometry: ${JSON.stringify(labelledInputGeometry)}`);
  }
  const paginationLinks = await page
    .getByTestId("portable-pagination")
    .locator("a, button")
    .evaluateAll((elements) =>
      elements.map((element) => ({
        ariaCurrent: element.getAttribute("aria-current"),
        dataSlot: element.getAttribute("data-slot"),
      })),
    );
  const activePaginationLinks = paginationLinks.filter(({ ariaCurrent }) => ariaCurrent === "page");
  if (activePaginationLinks.length !== 1) {
    throw new Error(`portable Pagination semantics: ${JSON.stringify(paginationLinks)}`);
  }
  await assertEqual(
    JSON.stringify(paginationLinks.map(({ dataSlot }) => dataSlot)),
    JSON.stringify([
      "pagination-previous",
      "pagination-link",
      "pagination-link",
      "pagination-next",
    ]),
    "portable Pagination public part identity",
  );
  await assertEqual(
    await page.getByTestId("portable-spinner").getAttribute("role"),
    "status",
    "portable Spinner semantics",
  );
  await assertEqual(
    await page.getByTestId("portable-table").locator("thead, tbody, tfoot, caption").count(),
    4,
    "portable Table semantic sections",
  );
  await assertEqual(
    await page.getByTestId("portable-textarea").getAttribute("name"),
    "notes",
    "portable Textarea native attrs",
  );
  await assertEqual(
    await page.getByTestId("portable-video").evaluate((element) => element.tagName),
    "VIDEO",
    "portable Video native root",
  );
  await assertText(
    page.getByTestId("portable-closure-ref-state"),
    "refs: DIV/ARTICLE/SELECT/TEXTAREA/VIDEO",
    "portable closure exposed refs",
  );

  const lightCard = await readPortableClosureVisual(page);
  await section.screenshot({
    path: evidence.portableClosureDesktopLight,
    style: portableClosureEvidenceStyle,
  });
  await page.setViewportSize({ height: 844, width: 390 });
  await section.scrollIntoViewIfNeeded();
  const narrowLayout = await section.evaluate((element) => {
    const groups = Array.from(element.querySelectorAll("[data-closure-group]"));
    const bounds = groups.map((group) => group.getBoundingClientRect());
    const sectionBounds = element.getBoundingClientRect();
    return {
      allContained: bounds.every(
        (bounds) =>
          bounds.left >= sectionBounds.left - 1 && bounds.right <= sectionBounds.right + 1,
      ),
      columns: getComputedStyle(element.querySelector('[data-testid="portable-closure-grid"]'))
        .gridTemplateColumns,
      overflow: element.scrollWidth - element.clientWidth,
    };
  });
  await assertEqual(narrowLayout.allContained, true, "portable closure narrow containment");
  if (narrowLayout.overflow > 1) {
    throw new Error(`portable closure narrow overflow: ${JSON.stringify(narrowLayout)}`);
  }
  if (narrowLayout.columns.trim().split(/\s+/).length !== 1) {
    throw new Error(`portable closure narrow columns: ${JSON.stringify(narrowLayout)}`);
  }
  await section.screenshot({
    path: evidence.portableClosureNarrowLight,
    style: portableClosureEvidenceStyle,
  });
  await page.setViewportSize({ height: 1000, width: 1440 });
  await section.scrollIntoViewIfNeeded();

  await page.getByTestId("portable-closure-remount").click();
  await assertEqual(
    await page.getByTestId("portable-closure-grid").count(),
    0,
    "portable closure unmount cleanup",
  );
  await assertText(
    page.getByTestId("portable-closure-ref-state"),
    "refs: none/none/none/none/none",
    "portable closure cleared refs",
  );
  await page.getByTestId("portable-closure-remount").click();
  await page.getByTestId("portable-closure-grid").waitFor();
  await assertEqual(
    await section.locator("[data-closure-group]").count(),
    19,
    "portable closure remount inventory",
  );
  await assertText(
    page.getByTestId("portable-closure-ref-state"),
    "refs: DIV/ARTICLE/SELECT/TEXTAREA/VIDEO",
    "portable closure restored refs",
  );
  return lightCard;
}

async function verifyPortableStyledClosureDark(page, lightVisual, evidence) {
  const section = page.getByTestId("portable-styled-closure-review");
  await section.scrollIntoViewIfNeeded();
  const darkVisual = await readPortableClosureVisual(page);
  if (
    darkVisual.backgroundColor === lightVisual.backgroundColor &&
    darkVisual.borderColor === lightVisual.borderColor &&
    darkVisual.color === lightVisual.color
  ) {
    throw new Error(
      `portable closure dark theme did not change visible styling: light=${JSON.stringify(lightVisual)}, dark=${JSON.stringify(darkVisual)}`,
    );
  }
  if (
    Math.abs(darkVisual.height - lightVisual.height) > 1 ||
    Math.abs(darkVisual.width - lightVisual.width) > 1
  ) {
    throw new Error(
      `portable closure theme geometry drifted: light=${JSON.stringify(lightVisual)}, dark=${JSON.stringify(darkVisual)}`,
    );
  }
  await section.screenshot({
    path: evidence.portableClosureDesktopDark,
    style: portableClosureEvidenceStyle,
  });
  await page.setViewportSize({ height: 844, width: 390 });
  await section.screenshot({
    path: evidence.portableClosureNarrowDark,
    style: portableClosureEvidenceStyle,
  });
  await page.setViewportSize({ height: 1000, width: 1440 });
}

async function readPortableClosureVisual(page) {
  return page.getByTestId("portable-card").evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      borderColor: style.borderColor,
      color: style.color,
      height: bounds.height,
      width: bounds.width,
    };
  });
}

async function verifyAccordion(page) {
  const section = page.getByTestId("accordion-review");
  const dynamicAlpha = page.getByTestId("accordion-dynamic-alpha");
  const dynamicBeta = page.getByTestId("accordion-dynamic-beta");
  await assertEqual(
    await section.locator("[data-sw-accordion]").count(),
    3,
    "Accordion multiple-owner inventory",
  );
  await assertEqual(
    await page.getByTestId("accordion-dynamic-panel-alpha").isVisible(),
    true,
    "Accordion default multiple item",
  );
  await dynamicAlpha.focus();
  await page.keyboard.press("Tab");
  await assertEqual(
    await dynamicBeta.evaluate((element) => element === document.activeElement),
    true,
    "Accordion native sequential focus",
  );
  await dynamicBeta.click();
  await assertEqual(
    await page.getByTestId("accordion-dynamic-panel-beta").isVisible(),
    true,
    "Accordion multiple item activation",
  );

  const controlled = page.getByTestId("accordion-controlled");
  await assertEqual(
    await controlled.getAttribute("data-state"),
    "open",
    "Accordion controlled default state",
  );
  await page.getByTestId("accordion-controlled-beta").click();
  await assertText(
    page.getByTestId("accordion-controlled-state"),
    "value=alpha, proposals=beta:canceled",
    "Accordion canceled proposal",
  );
  await page.getByTestId("accordion-cancel-toggle").click();
  await page.getByTestId("accordion-controlled-beta").click();
  await assertText(
    page.getByTestId("accordion-controlled-state"),
    "value=beta, proposals=beta:canceled,beta:accepted",
    "Accordion accepted proposal",
  );
  await page.getByTestId("accordion-add-item").click();
  await page.getByTestId("accordion-dynamic-item-3").waitFor();
  await page.getByTestId("accordion-dynamic-item-3").click();
  await assertEqual(
    await page.getByTestId("accordion-dynamic-panel-item-3").isVisible(),
    true,
    "Accordion dynamic item activation",
  );
  await page.getByTestId("accordion-remount").click();
  await assertEqual(
    await page.getByTestId("styled-accordion-trigger").count(),
    0,
    "Styled Accordion unmount",
  );
  await page.getByTestId("accordion-remount").click();
  await page.getByTestId("styled-accordion-trigger").waitFor();
  await page.getByTestId("styled-accordion-trigger").click();
  await assertEqual(
    await page.getByTestId("styled-accordion-content").isVisible(),
    true,
    "Styled Accordion content after remount",
  );
}

async function verifyTabs(page) {
  const section = page.getByTestId("tabs-review");
  const dynamicAccount = page.getByTestId("tabs-dynamic-account");
  const dynamicPassword = page.getByTestId("tabs-dynamic-password");
  await assertEqual(
    await section.locator("[data-sw-tabs]").count(),
    3,
    "Tabs multiple-owner inventory",
  );
  await dynamicAccount.focus();
  await page.keyboard.press("ArrowDown");
  await assertEqual(
    await dynamicPassword.evaluate((element) => element === document.activeElement),
    true,
    "Tabs horizontal keyboard focus",
  );
  await assertEqual(
    await dynamicPassword.getAttribute("aria-selected"),
    "true",
    "Tabs automatic keyboard activation",
  );
  const indicatorBounds = await page.getByTestId("tabs-indicator").boundingBox();
  const activeTabHeight = await page
    .getByTestId("tabs-indicator")
    .evaluate((element) => element.style.getPropertyValue("--active-tab-height"));
  if (!indicatorBounds || indicatorBounds.height <= 0 || !activeTabHeight) {
    throw new Error(`Tabs indicator geometry was unresolved: ${JSON.stringify(indicatorBounds)}`);
  }

  const controlled = page.getByTestId("tabs-controlled");
  await assertEqual(
    await controlled.getAttribute("data-value"),
    "account",
    "Tabs controlled default state",
  );
  await page.getByTestId("tabs-controlled-password").click();
  await assertTextIncludes(
    page.getByTestId("tabs-controlled-state"),
    "value=account",
    "Tabs canceled proposal",
  );
  await page.getByTestId("tabs-cancel-toggle").click();
  await page.getByTestId("tabs-controlled-password").click();
  await assertTextIncludes(
    page.getByTestId("tabs-controlled-state"),
    "value=password",
    "Tabs accepted proposal",
  );
  await page.getByTestId("tabs-add-item").click();
  await page.getByTestId("tabs-dynamic-tab-3").waitFor();
  await page.getByTestId("tabs-dynamic-tab-3").click();
  await assertEqual(
    await page.getByTestId("tabs-dynamic-tab-3").getAttribute("aria-selected"),
    "true",
    "Tabs dynamic item activation",
  );
  await page.getByTestId("tabs-remount").click();
  await assertEqual(
    await page.getByTestId("styled-tabs-trigger").count(),
    0,
    "Styled Tabs unmount",
  );
  await page.getByTestId("tabs-remount").click();
  await page.getByTestId("styled-tabs-trigger").waitFor();
  await assertEqual(
    await page.getByTestId("styled-tabs-content").isVisible(),
    true,
    "Styled Tabs content after remount",
  );
}

async function verifyField(page) {
  const section = page.getByTestId("field-review");
  const email = page.getByTestId("field-email-control");
  const terms = page.getByTestId("field-terms-control");

  await page.getByTestId("field-submit").click();
  await page
    .getByTestId("field-email")
    .locator('[data-sw-field-error][data-match="valueMissing"]')
    .waitFor({ state: "visible" });
  await assertText(page.getByTestId("field-submit-count"), "submits: 0", "Field invalid submit");
  const requiredEmailError = page
    .getByTestId("field-email")
    .locator('[data-sw-field-error][data-match="valueMissing"]');
  await assertEqual(await requiredEmailError.isVisible(), true, "Field valueMissing message");
  if (!(await requiredEmailError.textContent())?.trim()) {
    throw new Error("Field valueMissing validation message was empty");
  }
  await assertEqual(
    await section.getByText("Accept the terms.").isVisible(),
    true,
    "Field checkbox valueMissing message",
  );

  await page.getByTestId("field-dynamic-message").click();
  await email.fill("invalid");
  await page.getByTestId("field-submit").click();
  await page
    .getByTestId("field-email")
    .locator('[data-sw-field-error][data-match="typeMismatch"]')
    .waitFor({ state: "visible" });
  await assertEqual(
    await section.getByText("Use a valid email address.").isVisible(),
    true,
    "Field dynamic typeMismatch message",
  );

  await email.fill("reader@example.com");
  await terms.evaluate((element) => element.click());
  await page.getByTestId("field-submit").click();
  await assertText(page.getByTestId("field-submit-count"), "submits: 1", "Field valid submit");
  const submittedValues = await section.locator("form").evaluate((form) => {
    const entries = new FormData(form);
    return {
      reviewEmail: entries.get("reviewEmail"),
      terms: entries.get("terms"),
    };
  });
  await assertEqual(
    JSON.stringify(submittedValues),
    JSON.stringify({ reviewEmail: "reader@example.com", terms: "accepted" }),
    "Field FormData bridge",
  );

  await page.getByTestId("field-reset").click();
  await page.waitForFunction(() => {
    const terms = document.querySelector('[data-testid="field-terms-control"]');
    const visibleErrors = document.querySelectorAll(
      '[data-testid="field-review"] [data-sw-field-error]:not([hidden])',
    );
    return terms?.getAttribute("aria-checked") === "false" && visibleErrors.length === 0;
  });
  await assertEqual(
    await email.inputValue(),
    "reader@example.com",
    "Field controlled value after native reset",
  );
  await assertEqual(
    await terms.getAttribute("aria-checked"),
    "false",
    "Field native reset checkbox",
  );
}

async function verifySlider(page) {
  const section = page.getByTestId("slider-review");
  const primitiveRoot = section.locator("[data-sw-slider]").first();
  const primitiveThumb = primitiveRoot.locator("[data-sw-slider-thumb]");
  await primitiveThumb.focus();
  await page.keyboard.press("ArrowRight");
  await assertText(page.getByTestId("slider-value"), "36", "Slider keyboard change");
  await section.getByRole("button", { name: "Cancel next change" }).click();
  await primitiveThumb.focus();
  await page.keyboard.press("ArrowRight");
  await assertText(page.getByTestId("slider-value"), "36", "Slider canceled keyboard change");

  const styled = page.getByTestId("styled-slider");
  const styledControl = styled.locator("[data-sw-slider-control]");
  const controlBounds = await styledControl.boundingBox();
  if (!controlBounds || controlBounds.width <= 0 || controlBounds.height <= 0) {
    throw new Error(
      `Styled Slider control geometry was unresolved: ${JSON.stringify(controlBounds)}`,
    );
  }
  await page.mouse.click(
    controlBounds.x + controlBounds.width * 0.5,
    controlBounds.y + controlBounds.height / 2,
  );
  const pointerValue = (await page.getByTestId("slider-range-value").textContent())?.trim();
  if (pointerValue === "[20,80]") {
    throw new Error(`Styled Slider pointer geometry did not update the value: ${pointerValue}`);
  }

  await assertEqual(
    await styled.locator("[data-sw-slider-thumb]").count(),
    2,
    "Styled Slider initial thumb inventory",
  );
  await assertEqual(
    await styled.locator("[data-sw-slider-input]").count(),
    2,
    "Styled Slider initial native-input inventory",
  );
  await section.getByRole("button", { name: "Toggle thumb count" }).click();
  await assertEqual(
    await styled.locator("[data-sw-slider-thumb]").count(),
    3,
    "Styled Slider dynamic thumb inventory",
  );
  const nativeInputs = await styled.locator("[data-sw-slider-input]").evaluateAll((inputs) =>
    inputs.map((input) => ({
      name: input.getAttribute("name"),
      value: input.value,
    })),
  );
  await assertEqual(
    JSON.stringify(nativeInputs),
    JSON.stringify([
      { name: "price[0]", value: "20" },
      { name: "price[1]", value: "50" },
      { name: "price[2]", value: "80" },
    ]),
    "Styled Slider dynamic native inputs",
  );
  for (const thumb of await styled.locator("[data-sw-slider-thumb]").all()) {
    const bounds = await thumb.boundingBox();
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
      throw new Error(`Styled Slider thumb geometry was unresolved: ${JSON.stringify(bounds)}`);
    }
  }

  await section.getByRole("button", { name: "Unmount Slider" }).click();
  await assertEqual(await page.getByTestId("styled-slider").count(), 0, "Styled Slider unmount");
  await section.getByRole("button", { name: "Remount Slider" }).click();
  await page.getByTestId("styled-slider").waitFor();
  const vertical = section.locator('[data-sw-slider][data-orientation="vertical"]');
  const verticalBounds = await vertical.locator("[data-sw-slider-control]").boundingBox();
  if (!verticalBounds || verticalBounds.height <= verticalBounds.width) {
    throw new Error(`Vertical Slider geometry was unresolved: ${JSON.stringify(verticalBounds)}`);
  }
}

async function verifyInputOtp(page) {
  const section = page.getByTestId("input-otp-review");
  const primitive = section.locator(
    '[data-sw-input-otp][aria-label="Primitive verification code"]',
  );
  const primitiveInput = primitive.locator("input");
  await primitiveInput.focus();
  await page.keyboard.press("3");
  await assertText(page.getByTestId("input-otp-value"), "123", "Input OTP keyboard edit");
  await section.getByRole("button", { name: "Cancel next edit" }).click();
  await primitiveInput.focus();
  await page.keyboard.press("4");
  await assertText(page.getByTestId("input-otp-value"), "123", "Input OTP canceled edit");
  await primitiveInput.evaluate((input) => {
    const paste = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(paste, "clipboardData", {
      value: { getData: () => "a23456z" },
    });
    input.dispatchEvent(paste);
  });
  await assertText(page.getByTestId("input-otp-value"), "123234", "Input OTP normalized paste");

  const styledForm = section.locator("#otp-review-form");
  const styled = styledForm.locator("[data-sw-input-otp]");
  await assertEqual(await styled.count(), 1, "Styled Input OTP inventory");
  await assertEqual(await styled.locator("input").count(), 1, "Styled Input OTP native input");
  await assertEqual(
    await styled.locator('[data-slot="input-otp-slot"]').count(),
    6,
    "Styled Input OTP visual slots",
  );
  const styledInput = styled.locator("input");
  await assertEqual(await styledInput.inputValue(), "123", "Styled Input OTP default value");
  await styledInput.fill("654321");
  await styledForm.getByRole("button", { name: "Reset code" }).click();
  await assertEqual(await styledInput.inputValue(), "123", "Styled Input OTP native reset");

  await section.getByRole("button", { name: "Unmount Input OTP" }).click();
  await assertEqual(await styled.count(), 0, "Styled Input OTP unmount");
  await section.getByRole("button", { name: "Remount Input OTP" }).click();
  await styled.waitFor();
}

async function verifyDropzone(page) {
  const section = page.getByTestId("dropzone-review");
  const primitive = section.locator('[data-sw-dropzone][aria-label="Primitive image dropzone"]');
  const primitiveInput = primitive.locator('input[type="file"]');
  await primitiveInput.setInputFiles({
    buffer: Buffer.from("image"),
    mimeType: "image/png",
    name: "selected.png",
  });
  await assertText(
    page.getByTestId("primitive-dropzone-files"),
    "selected.png",
    "Dropzone native selection",
  );
  await dispatchDrop(primitive, [
    { name: "photo.png", type: "image/png" },
    { name: "notes.zip", type: "application/zip" },
  ]);
  await assertText(
    page.getByTestId("primitive-dropzone-files"),
    "photo.png",
    "Dropzone drag filtering",
  );

  const styled = section.locator("[data-sw-dropzone]").nth(1);
  await dispatchDrop(styled, [
    { name: "cover.jpg", type: "image/jpeg" },
    { name: "diagram.png", type: "image/png" },
    { name: "notes.zip", type: "application/zip" },
  ]);
  await assertText(
    page.getByTestId("styled-dropzone-files"),
    "cover.jpg, diagram.png",
    "Styled Dropzone drag filtering",
  );
  await section.getByRole("button", { name: "Show uploading" }).click();
  await assertEqual(
    await styled.getAttribute("data-is-uploading"),
    "true",
    "Styled Dropzone upload state",
  );
  await assertEqual(
    await styled.locator("[data-sw-dropzone-loading-indicator]").isVisible(),
    true,
    "Styled Dropzone loading presentation",
  );
  await section.getByRole("button", { name: "Finish upload" }).click();
  await assertEqual(
    await styled.getAttribute("data-is-uploading"),
    "false",
    "Styled Dropzone completed state",
  );

  await section.getByRole("button", { name: "Unmount Dropzone" }).click();
  await assertEqual(
    await section.locator("[data-sw-dropzone]").count(),
    1,
    "Styled Dropzone unmount",
  );
  await section.getByRole("button", { name: "Remount Dropzone" }).click();
  await assertEqual(
    await section.locator("[data-sw-dropzone]").count(),
    2,
    "Styled Dropzone remount",
  );
}

async function dispatchDrop(locator, files) {
  await locator.evaluate((element, fileSpecs) => {
    const dataTransfer = new DataTransfer();
    for (const file of fileSpecs) {
      dataTransfer.items.add(new File(["content"], file.name, { type: file.type }));
    }
    element.dispatchEvent(
      new DragEvent("dragenter", { bubbles: true, cancelable: true, dataTransfer }),
    );
    if (element.getAttribute("data-drag-active") !== "true") {
      throw new Error("Dropzone did not publish active drag state");
    }
    element.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer }));
    if (element.getAttribute("data-drag-active") !== "false") {
      throw new Error("Dropzone did not clear active drag state after drop");
    }
  }, files);
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

async function verifyCollapsible(page) {
  const defaultRoot = page.getByTestId("collapsible-default-root");
  const defaultTrigger = page.getByTestId("collapsible-default-trigger");
  const defaultPanel = page.getByTestId("collapsible-default-panel");
  await assertEqual(
    await defaultRoot.getAttribute("data-state"),
    "open",
    "Collapsible default open",
  );
  await assertEqual(await defaultPanel.isVisible(), true, "Collapsible default panel presence");
  await defaultTrigger.click();
  await assertEqual(await defaultRoot.getAttribute("data-state"), "closed", "Collapsible close");
  await assertEqual(await defaultPanel.isVisible(), false, "Collapsible closed panel visibility");
  await assertEqual(await defaultPanel.count(), 1, "Collapsible closed panel mounted");

  const controlledRoot = page.getByTestId("collapsible-controlled-root");
  const controlledTrigger = page.getByTestId("collapsible-controlled-trigger");
  await controlledTrigger.click();
  await assertEqual(
    await controlledRoot.getAttribute("data-state"),
    "closed",
    "Collapsible canceled proposal",
  );
  await page.getByTestId("collapsible-cancel-toggle").click();
  await controlledTrigger.click();
  await assertEqual(
    await controlledRoot.getAttribute("data-state"),
    "open",
    "Collapsible controlled proposal",
  );

  const asChild = page.getByTestId("collapsible-as-child");
  await assertEqual(await asChild.evaluate((element) => element.tagName), "BUTTON", "asChild tag");
  await assertEqual(await asChild.getAttribute("type"), "button", "asChild type");
  await asChild.click();
  await assertText(
    page.getByTestId("collapsible-listener-state"),
    "child-clicks=1, wrapper-clicks=1",
    "Collapsible merged listeners",
  );

  await page.getByTestId("collapsible-remount-toggle").click();
  await assertText(
    page.getByTestId("collapsible-remount-state"),
    "unmounted",
    "Collapsible unmount",
  );
  await page.getByTestId("collapsible-remount-toggle").click();
  await assertEqual(
    await page.getByTestId("collapsible-remount-root").count(),
    1,
    "Collapsible remount",
  );
}

async function verifyDialog(page) {
  const trigger = page.getByTestId("dialog-trigger");
  const popup = page.getByTestId("dialog-popup");
  await trigger.click();
  await assertEqual(await popup.isVisible(), false, "Dialog canceled open");
  await trigger.click();
  await assertEqual(await popup.isVisible(), true, "Dialog accepted open");
  await assertEqual(
    await page.locator("body").getAttribute("data-sw-scroll-locked"),
    "",
    "Dialog modal scroll lock",
  );
  await page.getByTestId("nested-dialog-trigger").click();
  await page.keyboard.press("Escape");
  await assertEqual(await popup.isVisible(), true, "Dialog nested Escape ownership");
  await page.keyboard.press("Escape");
  await assertEqual(await popup.isVisible(), false, "Dialog Escape dismissal");
  await page.waitForFunction(
    () => !document.querySelector('[data-testid="dialog-popup"]')?.hasAttribute("open"),
  );
  await page.getByTestId("dialog-remount").click();
  await assertEqual(await page.getByTestId("primitive-dialog").count(), 0, "Dialog unmount");
  await page.getByTestId("dialog-remount").click();
  await assertEqual(await page.getByTestId("primitive-dialog").count(), 1, "Dialog remount");
}

async function verifyAlertDialog(page) {
  const trigger = page.getByTestId("alert-dialog-trigger");
  const popup = page.getByTestId("alert-dialog-popup");
  const portalTarget = page.getByTestId("alert-dialog-portal-target");

  await trigger.click();
  await assertEqual(await popup.isVisible(), false, "Alert Dialog canceled controlled open");
  await assertText(
    page.getByTestId("alert-dialog-state"),
    "open: false",
    "Alert Dialog canceled model",
  );

  await trigger.click();
  await assertEqual(await popup.isVisible(), true, "Alert Dialog accepted controlled open");
  await assertText(
    page.getByTestId("alert-dialog-state"),
    "open: true",
    "Alert Dialog accepted model",
  );
  await assertEqual(
    await portalTarget.locator('[data-testid="alert-dialog-portal"]').count(),
    1,
    "Alert Dialog custom portal ownership",
  );
  await assertEqual(
    await portalTarget.locator('[data-testid="alert-dialog-popup"]').count(),
    1,
    "Alert Dialog custom portal popup ownership",
  );
  await page.getByTestId("alert-dialog-confirm").click();
  await waitForDialogClosed(page, "alert-dialog-popup");

  await page.getByTestId("alert-dialog-remount").click();
  await assertEqual(
    await page.getByTestId("primitive-alert-dialog").count(),
    0,
    "Alert Dialog unmount",
  );
  await assertEqual(
    await page.getByTestId("alert-dialog-portal").count(),
    0,
    "Alert Dialog portal cleanup",
  );

  await page.getByTestId("alert-dialog-default-toggle").click();
  await assertText(
    page.getByTestId("alert-dialog-default-state"),
    "mounted",
    "default-open Alert Dialog mount",
  );
  await assertEqual(
    await page.getByTestId("alert-dialog-default-popup").isVisible(),
    true,
    "default-open Alert Dialog opens on demand",
  );
  await assertEqual(
    await portalTarget.locator('[data-testid="alert-dialog-default-portal"]').count(),
    1,
    "default-open Alert Dialog custom portal ownership",
  );
  await page.getByTestId("alert-dialog-default-close").click();
  await waitForDialogClosed(page, "alert-dialog-default-popup");
  await page.getByTestId("alert-dialog-default-toggle").click();
  await assertText(
    page.getByTestId("alert-dialog-default-state"),
    "unmounted",
    "default-open Alert Dialog unmount",
  );

  await assertAlertDialogCleanup(page, "Primitive Alert Dialog cleanup");
}

async function verifyDrawer(page) {
  const trigger = page.getByTestId("drawer-trigger");
  const popup = page.getByTestId("drawer-popup");
  for (const side of ["top", "right", "bottom", "left"]) {
    await page.getByTestId("drawer-side").selectOption(side);
    await trigger.click();
    await assertEqual(await popup.getAttribute("data-side"), side, `Drawer ${side} side`);
    await assertEqual(await popup.isVisible(), true, `Drawer ${side} open`);
    await assertEqual(
      await page.locator("body").getAttribute("data-sw-scroll-locked"),
      "",
      `Drawer ${side} scroll lock`,
    );
    await page.getByTestId("drawer-close").click();
    await page.waitForFunction(
      () => !document.querySelector('[data-testid="drawer-popup"]')?.hasAttribute("open"),
    );
  }

  await page.getByTestId("drawer-portal-mode").selectOption("custom");
  await trigger.click();
  const customTarget = page.getByTestId("drawer-custom-target");
  await assertEqual(
    await customTarget.locator("[data-sw-drawer-viewport]").count(),
    1,
    "Drawer custom portal ownership",
  );
  await page.getByTestId("drawer-close").click();
  await page.waitForFunction(
    () => !document.querySelector('[data-testid="drawer-popup"]')?.hasAttribute("open"),
  );
  await assertEqual(
    await customTarget.locator("[data-sw-drawer-viewport]").count(),
    1,
    "Drawer custom portal owner retained while closed",
  );
  await page.getByTestId("drawer-portal-mode").selectOption("body");
  await page.waitForFunction(
    () =>
      document
        .querySelector('[data-testid="drawer-custom-target"]')
        ?.querySelector("[data-sw-drawer-viewport]") === null,
  );
  await assertEqual(
    await customTarget.locator("[data-sw-drawer-viewport]").count(),
    0,
    "Drawer custom portal cleanup after reparent",
  );
  await trigger.click();
  await assertEqual(
    await popup.evaluate(
      (element) => element.closest("[data-sw-drawer-portal]")?.parentElement === document.body,
    ),
    true,
    "Drawer body portal ownership",
  );
  await page.getByTestId("drawer-close").click();
  await page.waitForFunction(
    () => !document.querySelector('[data-testid="drawer-popup"]')?.hasAttribute("open"),
  );
  await page.getByTestId("drawer-portal-mode").selectOption("inline");
  await trigger.click();
  await assertEqual(
    await page.getByTestId("drawer-review").locator("[data-sw-drawer-viewport]").count(),
    1,
    "Drawer inline portal ownership",
  );
  await page.getByTestId("drawer-close").click();
  await page.waitForFunction(
    () => !document.querySelector('[data-testid="drawer-popup"]')?.hasAttribute("open"),
  );
  await page.getByTestId("drawer-portal-mode").selectOption("body");

  const nestedParentTrigger = page.getByTestId("drawer-nested-parent-trigger");
  await nestedParentTrigger.focus();
  await nestedParentTrigger.click();
  await page.getByTestId("drawer-nested-child-trigger").click();
  await assertEqual(
    await page.getByTestId("drawer-nested-parent-popup").isVisible(),
    true,
    "Nested Drawer parent open",
  );
  await assertEqual(
    await page.getByTestId("drawer-nested-child-popup").isVisible(),
    true,
    "Nested Drawer child open",
  );
  await page.keyboard.press("Escape");
  await page.waitForFunction(
    () =>
      !document.querySelector('[data-testid="drawer-nested-child-popup"]')?.hasAttribute("open"),
  );
  await assertEqual(
    await page.getByTestId("drawer-nested-parent-popup").getAttribute("open"),
    "",
    "Nested Drawer Escape keeps parent open",
  );
  await assertEqual(
    await page.locator("body").getAttribute("data-sw-scroll-locked"),
    "",
    "Nested Drawer lock retained for parent",
  );
  await assertEqual(
    await page.evaluate(() => document.activeElement?.getAttribute("data-testid")),
    "drawer-nested-child-trigger",
    "Nested Drawer child focus return",
  );
  await page.keyboard.press("Escape");
  await page.waitForFunction(
    () =>
      !document.querySelector('[data-testid="drawer-nested-parent-popup"]')?.hasAttribute("open"),
  );
  await assertEqual(
    await page.evaluate(() => document.activeElement?.getAttribute("data-testid")),
    "drawer-nested-parent-trigger",
    "Nested Drawer parent focus return",
  );
  await assertEqual(
    await page.locator("body").getAttribute("data-sw-scroll-locked"),
    null,
    "Nested Drawer scroll lock cleanup",
  );

  await page.getByTestId("drawer-remount").click();
  await assertEqual(await page.getByTestId("drawer-trigger").count(), 0, "Drawer unmount");
  await page.getByTestId("drawer-remount").click();
  await assertEqual(await page.getByTestId("drawer-trigger").count(), 1, "Drawer remount");
}

async function verifyStyledSheetEvidence(page, theme, evidence) {
  for (const side of ["top", "right", "bottom", "left"]) {
    await page.getByTestId(`styled-sheet-side-${side}`).click();
    await page.getByTestId("styled-sheet-trigger").click();
    const content = page.getByTestId("styled-sheet-content");
    await page.waitForFunction(() =>
      document.querySelector('[data-testid="styled-sheet-content"]')?.hasAttribute("open"),
    );
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    await assertEqual(await content.getAttribute("data-side"), side, `Styled Sheet ${side} side`);
    await assertEqual(await content.isVisible(), true, `Styled Sheet ${side} ${theme} open`);
    await content.evaluate(async (element) => {
      const animations = element.getAnimations({ subtree: true });
      await Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));
    });
    const geometry = await content.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        bottom: rect.bottom,
        height: rect.height,
        left: rect.left,
        right: rect.right,
        rootFontSize: Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
        top: rect.top,
        viewportHeight: document.documentElement.clientHeight,
        viewportWidth: document.body.clientWidth,
        width: rect.width,
      };
    });
    const anchored =
      side === "right"
        ? Math.abs(geometry.right - geometry.viewportWidth) <= 1
        : side === "left"
          ? Math.abs(geometry.left) <= 1
          : side === "top"
            ? Math.abs(geometry.top) <= 1
            : Math.abs(geometry.bottom - geometry.viewportHeight) <= 1;
    const lateral = side === "right" || side === "left";
    const expectedLateralWidth = Math.min(
      geometry.viewportWidth * 0.75,
      geometry.rootFontSize * 24,
    );
    const contractSized = lateral
      ? Math.abs(geometry.width - expectedLateralWidth) <= 1 &&
        Math.abs(geometry.height - geometry.viewportHeight) <= 1
      : Math.abs(geometry.width - geometry.viewportWidth) <= 1;
    styledSheetGeometries.push({ ...geometry, side, theme });
    if (
      !anchored ||
      !contractSized ||
      geometry.width < 150 ||
      geometry.height < 50 ||
      geometry.left < -1 ||
      geometry.top < -1 ||
      geometry.right > geometry.viewportWidth + 1 ||
      geometry.bottom > geometry.viewportHeight + 1
    ) {
      throw new Error(
        `Styled Sheet ${side} ${theme} final geometry is invalid: ${JSON.stringify(geometry)}`,
      );
    }
    await assertEqual(
      await page.getByTestId("styled-sheet-backdrop").isVisible(),
      true,
      `Styled Sheet ${side} ${theme} custom backdrop`,
    );
    await assertEqual(
      await content.locator('path[d="M18 6l-12 12"]').count(),
      1,
      `Styled Sheet ${side} ${theme} default X first stroke`,
    );
    await assertEqual(
      await content.locator('path[d="M6 6l12 12"]').count(),
      1,
      `Styled Sheet ${side} ${theme} default X second stroke`,
    );
    const evidencePath = evidence[`styledSheet${capitalize(side)}${capitalize(theme)}`];
    await page.screenshot({ fullPage: true, path: evidencePath });
    await content.locator('[data-slot="sheet-close"]').click();
    await page.waitForFunction(
      () => !document.querySelector('[data-testid="styled-sheet-content"]')?.hasAttribute("open"),
    );
  }
  await page.getByTestId("styled-custom-sheet-trigger").click();
  await assertEqual(
    await page.getByTestId("styled-custom-sheet-icon").isVisible(),
    true,
    `Styled Sheet ${theme} explicit custom icon`,
  );
  await page
    .getByTestId("styled-custom-sheet-content")
    .locator('[data-slot="sheet-close"]')
    .click();
}

async function verifyCheckboxGroup(page) {
  const group = page.getByTestId("checkbox-group-controlled");
  const alpha = group.locator('[data-value="alpha"]');
  const beta = group.locator('[data-value="beta"]');

  await assertEqual(await group.getAttribute("data-value"), '["alpha"]', "Checkbox Group default");
  await assertEqual(await alpha.getAttribute("aria-checked"), "true", "Checkbox Group alpha");
  await assertEqual(await beta.getAttribute("aria-checked"), "false", "Checkbox Group beta");
  await beta.dispatchEvent("click");
  await assertEqual(
    await group.getAttribute("data-value"),
    '["alpha","beta"]',
    "Checkbox Group multi-selection",
  );
  await assertText(
    page.getByTestId("checkbox-group-state"),
    '["alpha","beta"]',
    "Checkbox Group controlled model",
  );
  await alpha.click();
  await assertEqual(
    await group.getAttribute("data-value"),
    '["beta"]',
    "Checkbox Group independent deselection",
  );
}

async function verifyRadioGroup(page) {
  const review = page.getByTestId("radio-group-review");
  const group = page.getByTestId("primitive-radio-group");
  const alpha = page.getByTestId("primitive-radio-alpha");
  const beta = page.getByTestId("primitive-radio-beta");

  await assertEqual(await group.getAttribute("data-value"), "alpha", "Radio Group default");
  await beta.click();
  await assertEqual(await group.getAttribute("data-value"), "beta", "Radio Group selection");
  await assertText(
    page.getByTestId("radio-group-state"),
    "value: beta, changes: 1",
    "Radio Group controlled model",
  );
  await assertEqual(
    await page
      .locator("#radio-review-form")
      .evaluate((form) => JSON.stringify(Object.fromEntries(new FormData(form)))),
    '{"primitive-choice":"beta"}',
    "Radio Group form serialization",
  );

  await review.getByRole("button", { name: "Cancel next selection" }).click();
  await alpha.click();
  await assertEqual(
    await group.getAttribute("data-value"),
    "beta",
    "Radio Group canceled selection",
  );
  await assertText(
    page.getByTestId("radio-group-state"),
    "value: beta, changes: 2",
    "Radio Group canceled detail publication",
  );

  await review.getByRole("button", { name: "Add gamma" }).click();
  const gamma = page.getByTestId("primitive-radio-gamma");
  await assertEqual(await gamma.count(), 1, "Radio Group dynamic membership");
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  await beta.focus();
  await beta.press("ArrowRight");
  await assertEqual(
    await page.evaluate(() => document.activeElement?.getAttribute("data-testid")),
    "primitive-radio-gamma",
    "Radio Group keyboard navigation",
  );
  await assertEqual(await group.getAttribute("data-value"), "gamma", "Radio Group keyboard model");

  await review.getByRole("button", { name: "Reset" }).click();
  await assertEqual(
    await group.getAttribute("data-value"),
    "gamma",
    "Radio Group controlled native reset preservation",
  );
  await assertEqual(
    await page.locator("[data-sw-radio-group]").count(),
    2,
    "Radio Group instance isolation",
  );
  await assertEqual(
    await page.locator("[data-sw-checkbox-group]").count(),
    2,
    "Checkbox Group instance isolation",
  );
}

async function verifyForm(page) {
  const input = page.getByTestId("primitive-form-email");
  const summary = page.getByTestId("primitive-form-summary");
  const fieldset = page.getByTestId("primitive-fieldset");

  await page.getByTestId("primitive-form-submit").click();
  await assertEqual(await summary.isVisible(), true, "Form invalid summary");
  await page.waitForFunction(
    () => document.activeElement?.getAttribute("data-testid") === "primitive-form-email",
    undefined,
    { timeout: 1_000 },
  );
  await assertEqual(
    await input.evaluate((element) => element === document.activeElement),
    true,
    "Form invalid focus",
  );

  await input.fill("reader@example.com");
  await page.getByTestId("primitive-form-submit").click();
  await assertEqual(
    await page.getByTestId("form-submit-count").textContent(),
    "submits: 1",
    "Form valid submit",
  );

  await page.getByTestId("primitive-fieldset-toggle").click();
  await assertEqual(await fieldset.getAttribute("disabled"), "", "Fieldset native disabled");
  await page.getByTestId("primitive-form-company-toggle").click();
  await assertEqual(
    await fieldset.locator('[data-name="company"]').getAttribute("data-disabled"),
    "",
    "Fieldset dynamic disabled propagation",
  );
  await page.getByTestId("primitive-fieldset-toggle").click();
  await page.getByTestId("primitive-form-reset").click();
  await assertEqual(await input.inputValue(), "", "Form native reset");
}

async function verifyInput(page) {
  const controlled = page.getByTestId("input-controlled");
  await controlled.fill("Portable Vue");
  await assertText(
    page.getByTestId("input-controlled-state"),
    "value: Portable Vue",
    "Input default model",
  );

  const formControl = page.getByTestId("input-form-control");
  await formControl.fill("edited query");
  await page.getByTestId("input-form-submit").click();
  await assertText(
    page.getByTestId("input-form-result"),
    '{"query":"edited query"}',
    "Input form serialization",
  );
  await page.getByTestId("input-form-reset").click();
  await assertEqual(await formControl.inputValue(), "initial query", "Input form reset");

  await page.getByTestId("input-cleanup-toggle").click();
  await assertEqual(
    await page.getByTestId("input-cleanup-instance").count(),
    0,
    "Input cleanup DOM",
  );
  await page.getByTestId("input-cleanup-toggle").click();
  await assertEqual(await page.getByTestId("input-cleanup-instance").count(), 1, "Input remount");
}

async function verifySwitch(page) {
  const uncontrolled = page.getByTestId("switch-uncontrolled");
  await assertEqual(await uncontrolled.getAttribute("aria-checked"), "true", "Switch default");
  await uncontrolled.dispatchEvent("click");
  await assertEqual(await uncontrolled.getAttribute("aria-checked"), "false", "Switch click");

  const controlled = page.getByTestId("switch-controlled");
  await controlled.dispatchEvent("keydown", { key: " " });
  await assertEqual(await controlled.getAttribute("aria-checked"), "true", "Switch keyboard");
  await assertText(
    page.getByTestId("switch-controlled-state"),
    "checked: true",
    "Switch controlled model",
  );

  const canceled = page.getByTestId("switch-canceled");
  await canceled.dispatchEvent("click");
  await assertEqual(await canceled.getAttribute("aria-checked"), "false", "canceled Switch");
  await assertText(
    page.getByTestId("switch-cancel-state"),
    "attempts: 1, updates: 0",
    "canceled Switch events",
  );

  await page.getByTestId("switch-form-submit").click();
  await assertText(
    page.getByTestId("switch-form-result"),
    '{"notifications":"yes"}',
    "checked Switch form data",
  );
  await page.getByTestId("switch-form-control").dispatchEvent("click");
  await page.getByTestId("switch-form-submit").click();
  await assertText(
    page.getByTestId("switch-form-result"),
    '{"notifications":"no"}',
    "unchecked Switch form data",
  );

  await page.getByTestId("switch-cleanup-toggle").click();
  await assertEqual(
    await page.getByTestId("switch-cleanup-instance").count(),
    0,
    "Switch cleanup DOM",
  );
  await page.getByTestId("switch-cleanup-toggle").click();
  await assertEqual(await page.getByTestId("switch-cleanup-instance").count(), 1, "Switch remount");
}

async function verifyToggle(page) {
  const uncontrolled = page.getByTestId("toggle-uncontrolled");
  await assertEqual(await uncontrolled.getAttribute("aria-pressed"), "false", "Toggle default");
  await uncontrolled.click();
  await assertEqual(await uncontrolled.getAttribute("aria-pressed"), "true", "Toggle click");

  const controlled = page.getByTestId("toggle-controlled");
  await controlled.click();
  await assertEqual(await controlled.getAttribute("aria-pressed"), "true", "Toggle controlled");
  await assertText(
    page.getByTestId("toggle-controlled-state"),
    "pressed: true",
    "Toggle controlled model",
  );

  const canceled = page.getByTestId("toggle-canceled");
  await canceled.click();
  await assertEqual(await canceled.getAttribute("aria-pressed"), "false", "canceled Toggle");
  await assertText(page.getByTestId("toggle-cancel-state"), "canceled: 1", "Toggle cancel detail");

  const alpha = page.getByTestId("toggle-sync-alpha");
  const beta = page.getByTestId("toggle-sync-beta");
  await alpha.click();
  await assertEqual(await alpha.getAttribute("aria-pressed"), "true", "Toggle sync source");
  await assertEqual(await beta.getAttribute("aria-pressed"), "true", "Toggle sync peer");
  await beta.press(" ");
  await assertEqual(
    await alpha.getAttribute("aria-pressed"),
    "false",
    "Toggle keyboard sync source",
  );
  await assertEqual(await beta.getAttribute("aria-pressed"), "false", "Toggle keyboard sync peer");

  await page.getByTestId("toggle-cleanup-toggle").click();
  await assertEqual(
    await page.getByTestId("toggle-cleanup-instance").count(),
    0,
    "Toggle cleanup DOM",
  );
  await page.getByTestId("toggle-cleanup-toggle").click();
  await assertEqual(await page.getByTestId("toggle-cleanup-instance").count(), 1, "Toggle remount");
}

async function verifyToggleGroup(page) {
  const review = page.getByTestId("toggle-group-review");
  const group = page.getByTestId("toggle-group-single");
  const left = page.getByTestId("toggle-group-single-left");
  const center = page.getByTestId("toggle-group-single-center");
  const right = page.getByTestId("toggle-group-single-right");

  await assertEqual(await group.getAttribute("data-consumer"), "forwarded", "Toggle Group attr");
  await assertEqual(
    await group.getAttribute("title"),
    "Primitive Toggle Group",
    "Toggle Group title",
  );
  await assertText(center, "center", "Toggle Group slot");
  await page.waitForFunction(
    () =>
      document
        .querySelector('[data-testid="toggle-group-public-state"]')
        ?.textContent?.replace(/\s+/g, " ")
        .includes("refs=DIV/BUTTON") === true,
  );

  await left.focus();
  await left.press("ArrowLeft");
  await assertEqual(
    await page.evaluate(() => document.activeElement?.getAttribute("data-testid")),
    "toggle-group-single-left",
    "Toggle Group non-looping start boundary",
  );
  await page.getByTestId("toggle-group-loop").click();
  await left.focus();
  await left.press("ArrowLeft");
  await assertEqual(
    await page.evaluate(() => document.activeElement?.getAttribute("data-testid")),
    "toggle-group-single-right",
    "Toggle Group looping start boundary",
  );

  await center.click();
  await assertEqual(await group.getAttribute("data-value"), '["center"]', "Toggle Group model");
  await assertText(
    page.getByTestId("toggle-group-detail-state"),
    'previous=["left"], current=["center"]',
    "Toggle Group detail publication",
  );
  await assertText(
    page.getByTestId("toggle-group-public-state"),
    "clicks=1, refs=DIV/BUTTON",
    "Toggle Group listener and refs",
  );

  await review.getByRole("button", { name: "Cancel next selection" }).click();
  await right.click();
  await assertEqual(
    await group.getAttribute("data-value"),
    '["center"]',
    "canceled Toggle Group selection",
  );
  await assertText(
    page.getByTestId("toggle-group-detail-state"),
    'previous=["center"], current=["right"]',
    "canceled Toggle Group detail publication",
  );

  await page.getByTestId("toggle-group-reorder").click();
  const reordered = await group
    .locator("[data-sw-toggle]")
    .evaluateAll((elements) => elements.map((element) => element.getAttribute("data-testid")));
  await assertEqual(
    JSON.stringify(reordered),
    JSON.stringify([
      "toggle-group-single-right",
      "toggle-group-single-center",
      "toggle-group-single-left",
    ]),
    "Toggle Group actual reorder",
  );

  const multiple = page.getByTestId("toggle-group-multiple");
  await review.getByRole("button", { name: "Add underline" }).click();
  await assertEqual(
    await multiple.locator('[data-value="underline"]').count(),
    1,
    "Toggle Group dynamic membership",
  );
  await multiple.locator('[data-value="underline"]').click();
  await assertText(
    page.getByTestId("toggle-group-multiple-state"),
    'multiple: ["bold","underline"]',
    "Toggle Group multiple model",
  );
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

async function verifyStyledMenusFloating(page) {
  const tooltipSection = page.getByTestId("styled-tooltip-review");
  await assertEqual(
    await tooltipSection.locator("[data-sw-tooltip]").count(),
    3,
    "Styled Tooltip multiple instances",
  );
  const tooltipTrigger = page.getByTestId("styled-tooltip-controlled-trigger");
  await tooltipTrigger.hover();
  const tooltipContent = page.getByTestId("styled-tooltip-controlled-content");
  await tooltipContent.waitFor({ state: "visible" });
  await assertTextIncludes(
    page.getByTestId("styled-tooltip-state"),
    "open: true",
    "Styled Tooltip model",
  );
  await assertResolvedGeometry(tooltipContent, "Styled Tooltip content");
  await page.getByTestId("styled-tooltip-cleanup-toggle").click();
  await assertEqual(await tooltipTrigger.count(), 0, "Styled Tooltip unmount");
  await assertEqual(await tooltipContent.count(), 0, "Styled Tooltip portal cleanup");
  await page.getByTestId("styled-tooltip-cleanup-toggle").click();
  await page.getByTestId("styled-tooltip-controlled-trigger").waitFor();

  const hoverSection = page.getByTestId("styled-hover-card-review");
  await assertEqual(
    await hoverSection.locator("[data-sw-preview-card]").count(),
    2,
    "Styled Hover Card multiple instances",
  );
  await page.getByTestId("styled-hover-card-controlled-trigger").hover();
  const hoverContent = page.getByTestId("styled-hover-card-controlled-content");
  await hoverContent.waitFor({ state: "visible" });
  await assertTextIncludes(
    page.getByTestId("styled-hover-card-state"),
    "open: true",
    "Styled Hover Card model",
  );
  await assertResolvedGeometry(hoverContent, "Styled Hover Card content");
  await page.mouse.move(0, 0);
  await hoverContent.waitFor({ state: "hidden" });

  const dropdownTrigger = page.getByTestId("styled-dropdown-trigger");
  await dropdownTrigger.click();
  const dropdownContent = page.getByTestId("styled-dropdown-content");
  await dropdownContent.waitFor({ state: "visible" });
  await assertTextIncludes(
    page.getByTestId("styled-dropdown-state"),
    "open: true",
    "Styled Dropdown model",
  );
  await assertResolvedGeometry(dropdownContent, "Styled Dropdown content");
  await page.getByTestId("styled-dropdown-sub-trigger").hover();
  const dropdownSubContent = page.getByTestId("styled-dropdown-sub-content");
  await dropdownSubContent.waitFor({ state: "visible" });
  await assertResolvedGeometry(dropdownSubContent, "Styled Dropdown nested content");
  await page.getByTestId("styled-dropdown-archive").click();
  await dropdownContent.waitFor({ state: "hidden" });

  const contextTrigger = page.getByTestId("styled-context-menu-trigger");
  await contextTrigger.click({ button: "right" });
  const contextContent = page.getByTestId("styled-context-menu-content");
  await contextContent.waitFor({ state: "visible" });
  await assertTextIncludes(
    page.getByTestId("styled-context-menu-state"),
    "open: true",
    "Styled Context Menu model",
  );
  await assertResolvedGeometry(contextContent, "Styled Context Menu content");
  await page.getByTestId("styled-context-menu-sub-trigger").hover();
  const contextSubContent = page.getByTestId("styled-context-menu-sub-content");
  await contextSubContent.waitFor({ state: "visible" });
  await assertResolvedGeometry(contextSubContent, "Styled Context Menu nested content");
  await page.getByTestId("styled-context-menu-frame").click();
  await contextContent.waitFor({ state: "hidden" });

  const navigationTrigger = page.getByTestId("styled-navigation-trigger-guides");
  await navigationTrigger.click();
  const navigationContent = page.getByTestId("styled-navigation-content-guides");
  await navigationContent.waitFor({ state: "visible" });
  await assertTextIncludes(
    page.getByTestId("styled-navigation-state"),
    "guides",
    "Styled Navigation Menu model",
  );
  await assertResolvedGeometry(navigationContent, "Styled Navigation Menu content");
  await page.getByTestId("styled-navigation-add-item").click();
  await page.getByTestId("styled-navigation-trigger-patterns").waitFor();
  await assertEqual(
    await page
      .getByTestId("styled-navigation-menu-review")
      .locator("[data-sw-nav-menu-item]")
      .count(),
    3,
    "Styled Navigation Menu dynamic collection",
  );
  await page.getByTestId("styled-navigation-trigger-patterns").click();
  await page.getByTestId("styled-navigation-content-patterns").waitFor({ state: "visible" });
  await page.keyboard.press("Escape");

  await page.getByTestId("styled-combobox-add-item").click();
  const comboboxSection = page.getByTestId("styled-combobox-review");
  const comboboxInput = page.getByTestId("styled-combobox-input");
  await comboboxInput.click();
  await comboboxInput.fill("cher");
  const comboboxContent = page.getByTestId("styled-combobox-content");
  await comboboxContent.waitFor({ state: "visible" });
  await assertResolvedGeometry(comboboxContent, "Styled Combobox content");
  await page.getByTestId("styled-combobox-item-cherry").click();
  await assertTextIncludes(
    page.getByTestId("styled-combobox-state"),
    "value: cherry",
    "Styled Combobox model",
  );
  await page.getByTestId("styled-combobox-submit").click();
  await assertTextIncludes(
    page.getByTestId("styled-combobox-form-result"),
    '"fruit":"cherry"',
    "Styled Combobox form value",
  );
  await page.getByTestId("styled-combobox-cleanup-toggle").click();
  await assertEqual(
    await comboboxSection.locator("[data-sw-combobox]").count(),
    0,
    "Styled Combobox unmount",
  );
  await assertEqual(
    await page.locator("[data-sw-combobox-portal]").count(),
    0,
    "Styled Combobox portal cleanup",
  );
  await page.getByTestId("styled-combobox-cleanup-toggle").click();
  await comboboxSection.locator("[data-sw-combobox]").waitFor();
}

async function verifyStyledComplexServices(page) {
  const section = page.getByTestId("styled-complex-services-review");
  await assertEqual(
    await section.locator("[data-sw-carousel]").count(),
    2,
    "Styled Carousel multiple instances",
  );
  await assertTextIncludes(
    page.getByTestId("styled-carousel-state"),
    "api: ready",
    "Styled Carousel API delivery",
  );
  await page.getByTestId("styled-carousel-next").click();
  await page.getByTestId("styled-carousel-add").click();
  await assertTextIncludes(
    page.getByTestId("styled-carousel-state"),
    "items: 4",
    "Styled Carousel dynamic item",
  );
  await page.getByTestId("styled-carousel-cleanup-toggle").click();
  await assertEqual(
    await page.getByTestId("styled-carousel-controlled").count(),
    0,
    "Styled Carousel cleanup",
  );
  await page.getByTestId("styled-carousel-cleanup-toggle").click();
  await page.getByTestId("styled-carousel-controlled").waitFor();

  await assertTextIncludes(
    page.getByTestId("styled-sidebar-state"),
    "ref: DIV",
    "Styled Sidebar exposed ref",
  );
  const desktopViewport = page.viewportSize();
  await page.setViewportSize({ height: desktopViewport?.height ?? 900, width: 600 });
  await assertEqual(
    await page.getByTestId("styled-sidebar-trigger").getAttribute("aria-expanded"),
    "false",
    "Styled Sidebar mobile media presentation",
  );
  await page.getByTestId("styled-sidebar-trigger").click();
  await assertTextIncludes(
    page.getByTestId("styled-sidebar-state"),
    "mobile: true",
    "Styled Sidebar mobile public trigger",
  );
  await assertEqual(
    await page.getByTestId("styled-sidebar-trigger").getAttribute("aria-expanded"),
    "true",
    "Styled Sidebar mobile expanded presentation",
  );
  await page.setViewportSize({
    height: desktopViewport?.height ?? 900,
    width: desktopViewport?.width ?? 1440,
  });
  await page.getByTestId("styled-sidebar-trigger").click();
  await assertTextIncludes(
    page.getByTestId("styled-sidebar-state"),
    "open: false",
    "Styled Sidebar desktop public trigger",
  );
  await page.getByTestId("styled-sidebar-cleanup-toggle").click();
  await assertEqual(
    await page.getByTestId("styled-sidebar-controlled").count(),
    0,
    "Styled Sidebar cleanup",
  );
  await page.getByTestId("styled-sidebar-cleanup-toggle").click();
  await page.getByTestId("styled-sidebar-controlled").waitFor();

  await assertTextIncludes(
    page.getByTestId("styled-color-picker-state"),
    "ref: DIV",
    "Styled Color Picker exposed ref",
  );
  const controlledColorTrigger = page
    .getByTestId("styled-color-picker-controlled")
    .locator('[data-slot="popover-trigger"]');
  const controlledColorPopupId = await controlledColorTrigger.getAttribute("aria-controls");
  if (!controlledColorPopupId) {
    throw new Error("Styled Color Picker trigger did not identify its popup.");
  }
  await controlledColorTrigger.click();
  await assertTextIncludes(
    page.getByTestId("styled-color-picker-state"),
    "open: true",
    "Styled Color Picker open model",
  );
  await page
    .locator(`[id="${controlledColorPopupId}"]`)
    .locator("[data-sw-color-picker-format-select]")
    .selectOption("rgb");
  await assertTextIncludes(
    page.getByTestId("styled-color-picker-state"),
    "format: rgb",
    "Styled Color Picker format model interaction",
  );
  await assertTextIncludes(
    page.getByTestId("styled-color-picker-state"),
    "format:rgb:rgb",
    "Styled Color Picker detailed format event",
  );
  await page.locator("[data-sw-color-picker-swatch]:visible").nth(1).click();
  await assertTextIncludes(
    page.getByTestId("styled-color-picker-state"),
    "value: #16a34a",
    "Styled Color Picker value model interaction",
  );
  await assertTextIncludes(
    page.getByTestId("styled-color-picker-state"),
    "detail:#16a34a",
    "Styled Color Picker detailed value event",
  );
  const uncontrolledFormat = page
    .getByTestId("styled-color-picker-inline")
    .locator('[data-slot="color-picker-native-format-select"]');
  await uncontrolledFormat.selectOption("hsl");
  await page.getByTestId("styled-color-picker-unrelated-update").click();
  await assertEqual(
    await uncontrolledFormat.inputValue(),
    "hsl",
    "Styled Color Picker uncontrolled format survives unrelated render",
  );
  await page.getByTestId("styled-color-picker-submit").click();
  await assertTextIncludes(
    page.getByTestId("styled-color-picker-state"),
    "reviewColor",
    "Styled Color Picker form value",
  );
  await page.getByTestId("styled-color-picker-cleanup-toggle").click();
  await assertEqual(
    await page.getByTestId("styled-color-picker-controlled").count(),
    0,
    "Styled Color Picker cleanup",
  );
  await page.getByTestId("styled-color-picker-cleanup-toggle").click();
  await page.getByTestId("styled-color-picker-controlled").waitFor();

  await assertTextIncludes(
    page.getByTestId("styled-toast-state"),
    "ref: DIV",
    "Styled Toast exposed ref",
  );
  await assertEqual(
    await section.locator('[data-slot="toast-viewport"]').count(),
    2,
    "Styled Toast multiple instances",
  );
  await page.getByTestId("styled-toast-success").click();
  await page.getByTestId("styled-toaster-secondary").locator('[data-slot="toast"]').waitFor();
  await assertEqual(
    await page.getByTestId("styled-toaster").locator('[data-slot="toast"]').count(),
    0,
    "Styled Toast routes to newest instance",
  );
  await assertTextIncludes(
    page.getByTestId("styled-toast-state"),
    "sent: 1",
    "Styled Toast service",
  );
  await page.getByTestId("styled-toast-secondary-cleanup-toggle").click();
  await assertEqual(
    await page.getByTestId("styled-toaster-secondary").count(),
    0,
    "Styled secondary Toaster cleanup",
  );
  await page.getByTestId("styled-toast-info").click();
  await page.getByTestId("styled-toaster").locator('[data-slot="toast"]').waitFor();
  await page.getByTestId("styled-toast-secondary-cleanup-toggle").click();
  await page.getByTestId("styled-toaster-secondary").waitFor({ state: "attached" });
  await page.getByTestId("styled-toast-promise").click();
  await page.getByTestId("styled-toast-dismiss").click();
  await page.getByTestId("styled-toast-cleanup-toggle").click();
  await assertEqual(await page.getByTestId("styled-toaster").count(), 0, "Styled Toast cleanup");
  await page.getByTestId("styled-toast-cleanup-toggle").click();
  await page.getByTestId("styled-toaster").waitFor({ state: "attached" });
}

async function captureStyledMenusFloatingEvidence(page, evidencePath, theme) {
  const trigger = page.getByTestId("styled-dropdown-trigger");
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  const content = page.getByTestId("styled-dropdown-content");
  await content.waitFor({ state: "visible" });
  await assertResolvedGeometry(content, `${theme} Styled Dropdown evidence`);
  await page.getByTestId("styled-dropdown-sub-trigger").hover();
  const subContent = page.getByTestId("styled-dropdown-sub-content");
  await subContent.waitFor({ state: "visible" });
  await assertResolvedGeometry(subContent, `${theme} Styled Dropdown nested evidence`);
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  await page.screenshot({ path: evidencePath });
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
}

async function assertResolvedGeometry(locator, label) {
  await locator.evaluate(async (element) => {
    const animations = element.getAnimations({ subtree: true });
    await Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));
  });
  const geometry = await locator.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      height: bounds.height,
      opacity: Number.parseFloat(style.opacity),
      width: bounds.width,
    };
  });
  if (
    !Number.isFinite(geometry.height) ||
    !Number.isFinite(geometry.width) ||
    geometry.height <= 0 ||
    geometry.width <= 0 ||
    geometry.opacity <= 0
  ) {
    throw new Error(`${label} geometry was unresolved: ${JSON.stringify(geometry)}`);
  }
}

async function verifyPopover(page) {
  const trigger = page.getByTestId("popover-trigger");
  const popup = page.getByTestId("popover-popup");

  await page.getByTestId("popover-side").selectOption("right");
  await page.getByTestId("popover-align").selectOption("end");
  await trigger.click();
  await assertEqual(await popup.isVisible(), true, "Popover open");
  await assertEqual(await popup.getAttribute("data-side"), "right", "Popover side");
  await assertEqual(await popup.getAttribute("data-align"), "end", "Popover align");
  await assertEqual(
    await popup
      .locator("xpath=ancestor::*[@data-sw-popover-positioner]")
      .evaluate((element) => getComputedStyle(element).position),
    "fixed",
    "Popover fixed positioning",
  );
  await assertEqual(
    await page.locator("body").getAttribute("data-sw-scroll-locked"),
    null,
    "non-modal Popover does not lock scrolling",
  );
  await page.getByTestId("popover-close").click();
  await page.waitForFunction(() =>
    document.querySelector('[data-testid="popover-popup"]')?.hasAttribute("hidden"),
  );

  await page.getByTestId("popover-modal").check();
  await trigger.click();
  await assertEqual(
    await page.locator("body").getAttribute("data-sw-scroll-locked"),
    "",
    "modal Popover scroll lock",
  );
  await page.keyboard.press("Escape");
  await page.waitForFunction(() =>
    document.querySelector('[data-testid="popover-popup"]')?.hasAttribute("hidden"),
  );

  await page.getByTestId("popover-portal-mode").selectOption("custom");
  await trigger.click();
  await assertEqual(
    await page.getByTestId("popover-custom-target").locator("[data-sw-popover-portal]").count(),
    1,
    "Popover custom portal ownership",
  );
  await page.getByTestId("popover-close").click();
  await page.getByTestId("popover-portal-mode").selectOption("inline");
  await trigger.click();
  await assertEqual(
    await page.getByTestId("popover-review").locator("[data-sw-popover-portal]").count(),
    1,
    "Popover inline portal ownership",
  );
  await page.getByTestId("popover-close").click();

  await page.getByTestId("popover-remount").click();
  await assertEqual(
    await page.getByTestId("popover-popup").count(),
    0,
    "Popover popup cleanup after unmount",
  );
  await page.getByTestId("popover-remount").click();

  await page.getByTestId("popover-dialog-trigger").click();
  await page.getByTestId("popover-nested-trigger").click();
  await assertEqual(
    await page.getByTestId("popover-dialog-popup").isVisible(),
    true,
    "parent Dialog",
  );
  await assertEqual(
    await page.getByTestId("popover-nested-popup").isVisible(),
    true,
    "nested Popover",
  );
  await page.keyboard.press("Escape");
  await page.waitForFunction(() =>
    document.querySelector('[data-testid="popover-nested-popup"]')?.hasAttribute("hidden"),
  );
  await assertEqual(
    await page.getByTestId("popover-dialog-popup").getAttribute("open"),
    "",
    "nested Popover Escape keeps Dialog open",
  );
  await page.keyboard.press("Escape");
  await page.waitForFunction(
    () => !document.querySelector('[data-testid="popover-dialog-popup"]')?.hasAttribute("open"),
  );
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

  const checkboxGroup = page
    .getByTestId("styled-checkbox-group")
    .locator("[data-sw-checkbox-group]");
  await checkboxGroup.locator('[data-value="styled-beta"]').click();
  await assertText(
    page.getByTestId("styled-checkbox-group-state"),
    '["styled-alpha","styled-beta"]',
    "Styled Checkbox Group model",
  );

  const styledCollapsible = page.getByTestId("styled-collapsible");
  const styledCollapsibleTrigger = page.getByTestId("styled-collapsible-trigger");
  await assertEqual(
    await styledCollapsible.getAttribute("data-slot"),
    "collapsible",
    "Styled Collapsible slot",
  );
  await styledCollapsibleTrigger.click();
  await assertText(
    page.getByTestId("styled-collapsible-state"),
    "open: true, changes: 1",
    "Styled Collapsible model",
  );
  await assertEqual(
    await page.getByTestId("styled-collapsible-content").isVisible(),
    true,
    "Styled Collapsible content",
  );

  const styledDialogTrigger = page.getByTestId("styled-dialog-trigger");
  await styledDialogTrigger.click();
  await assertText(page.getByTestId("styled-dialog-state"), "open: true", "Styled Dialog model");
  await assertEqual(
    await page.getByTestId("styled-dialog-custom-backdrop").isVisible(),
    true,
    "Styled Dialog custom backdrop",
  );
  await page.keyboard.press("Escape");
  await page.waitForFunction(
    () => !document.querySelector('[data-testid="styled-dialog-content"]')?.hasAttribute("open"),
  );

  const input = page.getByTestId("styled-input-small");
  await input.fill("Styled accepted input");
  await assertText(
    page.getByTestId("styled-input-state"),
    "value: Styled accepted input",
    "Styled Input model",
  );

  const radioGroup = page.getByTestId("styled-radio-group").locator("[data-sw-radio-group]");
  await radioGroup.locator('[data-value="styled-beta"]').click();
  await assertText(
    page.getByTestId("styled-radio-group-state"),
    "value: styled-beta",
    "Styled Radio Group model",
  );

  const styledForm = page.getByTestId("styled-form");
  await styledForm.getByRole("button", { name: "Validate styled form" }).click();
  await assertEqual(
    await page.getByTestId("styled-form-summary").isVisible(),
    true,
    "Styled Form validation",
  );

  const toggle = page.getByTestId("styled-toggle");
  await assertEqual(await toggle.getAttribute("data-slot"), "toggle", "Styled Toggle slot");
  await toggle.click();
  await assertEqual(await toggle.getAttribute("aria-pressed"), "true", "Styled Toggle model");
  await assertText(
    page.getByTestId("styled-toggle-state"),
    "pressed: true, changes: 1",
    "Styled Toggle parent state",
  );

  const styledToggleGroup = page.getByTestId("styled-toggle-group-control");
  const toggleGroupGeometryBefore = await readStyledToggleGroupGeometry(styledToggleGroup);
  if (
    toggleGroupGeometryBefore.gap <= 0 ||
    toggleGroupGeometryBefore.itemHeight <= 0 ||
    toggleGroupGeometryBefore.itemWidth <= 0 ||
    toggleGroupGeometryBefore.spacingToken !== "1"
  ) {
    throw new Error(
      `Styled Toggle Group unresolved light geometry: ${JSON.stringify(toggleGroupGeometryBefore)}`,
    );
  }
  await assertEqual(
    toggleGroupGeometryBefore.outlineColor,
    "rgb(14, 165, 233)",
    "Styled Toggle Group consumer style",
  );
  await page.getByTestId("styled-toggle-group-spacing").click();
  await page.waitForFunction((initialGap) => {
    const root = document.querySelector('[data-testid="styled-toggle-group-control"]');
    return (
      root instanceof HTMLElement &&
      Number.parseFloat(getComputedStyle(root).gap) > Number(initialGap)
    );
  }, toggleGroupGeometryBefore.gap);
  const toggleGroupGeometryAfter = await readStyledToggleGroupGeometry(styledToggleGroup);
  if (
    toggleGroupGeometryAfter.gap <= toggleGroupGeometryBefore.gap ||
    toggleGroupGeometryAfter.spacingToken !== "4" ||
    toggleGroupGeometryAfter.rootWidth <= toggleGroupGeometryBefore.rootWidth
  ) {
    throw new Error(
      `Styled Toggle Group spacing did not change geometry: before=${JSON.stringify(toggleGroupGeometryBefore)}, after=${JSON.stringify(toggleGroupGeometryAfter)}`,
    );
  }
  await assertText(
    page.getByTestId("styled-toggle-group-state"),
    'value: ["styled-left"], spacing: 4',
    "Styled Toggle Group spacing state",
  );

  const switchControl = page.getByTestId("styled-switch");
  const switchGeometryBefore = await readStyledSwitchGeometry(switchControl);
  if (
    switchGeometryBefore.rootWidth <= 0 ||
    switchGeometryBefore.rootHeight <= 0 ||
    switchGeometryBefore.thumbWidth <= 0 ||
    !switchGeometryBefore.heightToken ||
    !switchGeometryBefore.widthToken ||
    !switchGeometryBefore.paddingToken ||
    !switchGeometryBefore.translationToken
  ) {
    throw new Error(
      `Styled Switch unresolved geometry before activation: ${JSON.stringify(switchGeometryBefore)}`,
    );
  }
  await page.getByTestId("styled-switch-variants").locator('[data-slot="switch-label"]').click();
  await assertEqual(
    await switchControl.getAttribute("aria-checked"),
    "true",
    "Styled Switch label activation",
  );
  await assertText(
    page.getByTestId("styled-switch-state"),
    "checked: true, changes: 1",
    "Styled Switch single accepted activation",
  );
  await page.waitForFunction(
    (initialThumbLeft) => {
      const root = document.querySelector('[data-testid="styled-switch"]');
      const thumb = root?.querySelector('[data-slot="switch-toggle"]');
      return (
        thumb instanceof HTMLElement &&
        thumb.getBoundingClientRect().left > Number(initialThumbLeft) + 1
      );
    },
    switchGeometryBefore.thumbLeft,
    { timeout: 2_000 },
  );
  const switchGeometryAfter = await readStyledSwitchGeometry(switchControl);
  if (switchGeometryAfter.thumbLeft <= switchGeometryBefore.thumbLeft + 1) {
    throw new Error(
      `Styled Switch thumb did not translate after label activation: before=${switchGeometryBefore.thumbLeft}, after=${switchGeometryAfter.thumbLeft}`,
    );
  }

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
  return {
    forms: await readStyledFormsVisuals(page, "light"),
    specialized: await readSpecializedCohortVisuals(page, "light"),
    toggleGroup: toggleGroupGeometryAfter,
  };
}

async function verifyStyledPopover(page, evidencePath, theme) {
  const trigger = page.getByTestId("styled-popover-trigger");
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  const content = page.getByTestId("styled-popover-content");
  await page.waitForFunction(
    () =>
      document
        .querySelector('[data-testid="styled-popover-content"]')
        ?.getAttribute("data-state") === "open",
  );
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  await assertEqual(await content.isVisible(), true, `Styled Popover open in ${theme} mode`);
  await content.evaluate(async (element) => {
    const animations = element.getAnimations({ subtree: true });
    await Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));
  });
  await assertText(
    page.getByTestId("styled-popover-state"),
    "open: true",
    `Styled Popover model in ${theme} mode`,
  );
  await assertEqual(await content.getAttribute("data-side"), "right", "Styled Popover side");
  await assertEqual(await content.getAttribute("data-align"), "start", "Styled Popover align");
  const visual = await content.evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas was unavailable for Popover contrast verification.");

    const readColor = (color, background) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = background;
      context.fillRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data];
    };
    const luminance = ([red, green, blue]) => {
      const channels = [red, green, blue].map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    const foregroundLuminance = luminance(readColor(style.color, style.backgroundColor));
    const backgroundLuminance = luminance(readColor(style.backgroundColor, style.backgroundColor));
    return {
      backgroundColor: style.backgroundColor,
      color: style.color,
      contrast:
        (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
        (Math.min(foregroundLuminance, backgroundLuminance) + 0.05),
      height: rect.height,
      opacity: Number.parseFloat(style.opacity),
      width: rect.width,
    };
  });
  if (
    visual.height <= 0 ||
    visual.width <= 0 ||
    visual.opacity < 0.99 ||
    visual.backgroundColor === "rgba(0, 0, 0, 0)" ||
    visual.contrast < 3
  ) {
    throw new Error(`Styled Popover visual failed in ${theme} mode: ${JSON.stringify(visual)}`);
  }
  await page.screenshot({ path: evidencePath });
  await page.keyboard.press("Escape");
  await page.waitForFunction(() =>
    document.querySelector('[data-testid="styled-popover-content"]')?.hasAttribute("hidden"),
  );
}

async function verifyStyledAlertDialog(page, closeWith, evidencePath, mode) {
  const trigger = page.getByTestId("styled-alert-dialog-trigger");
  const popup = page.getByTestId("styled-alert-dialog-content");
  await trigger.click();
  await assertText(
    page.getByTestId("styled-alert-dialog-state"),
    "open: true",
    `${mode} Styled Alert Dialog model`,
  );
  await assertEqual(await popup.isVisible(), true, `${mode} Styled Alert Dialog popup`);
  await assertEqual(
    await page.getByTestId("styled-alert-dialog-backdrop").isVisible(),
    true,
    `${mode} Styled Alert Dialog custom backdrop`,
  );
  const dimensions = await captureStyledAlertDialogEvidence(page, evidencePath);

  await page
    .getByTestId(
      closeWith === "cancel" ? "styled-alert-dialog-cancel" : "styled-alert-dialog-action",
    )
    .click();
  await waitForDialogClosed(page, "styled-alert-dialog-content");
  await assertText(
    page.getByTestId("styled-alert-dialog-state"),
    "open: false",
    `${mode} Styled Alert Dialog ${closeWith} model`,
  );
  await assertAlertDialogCleanup(page, `${mode} Styled Alert Dialog ${closeWith} cleanup`);
  return dimensions;
}

async function waitForDialogClosed(page, testId) {
  await page.waitForFunction(
    (id) => !document.querySelector(`[data-testid="${id}"]`)?.hasAttribute("open"),
    testId,
  );
}

async function assertAlertDialogCleanup(page, label) {
  const cleanup = await page.evaluate(() => ({
    bodyLocked: document.body.hasAttribute("data-sw-scroll-locked"),
    inertCount: document.querySelectorAll("[inert]").length,
    openPopupCount: document.querySelectorAll("[data-sw-alert-dialog-popup][open]").length,
    visiblePopupCount: Array.from(document.querySelectorAll("[data-sw-alert-dialog-popup]")).filter(
      (element) =>
        element instanceof HTMLElement &&
        getComputedStyle(element).display !== "none" &&
        element.getClientRects().length > 0,
    ).length,
  }));
  await assertEqual(cleanup.bodyLocked, false, `${label} body lock`);
  await assertEqual(cleanup.inertCount, 0, `${label} inert state`);
  await assertEqual(cleanup.openPopupCount, 0, `${label} native popup`);
  await assertEqual(cleanup.visiblePopupCount, 0, `${label} visible popup`);
  await assertEqual(
    await page.locator("[data-sw-alert-dialog-portal]").count(),
    0,
    `${label} portal`,
  );
}

async function verifyStyledFormsDark(page, lightProof) {
  await assertEqual(
    await page.evaluate(() => document.documentElement.classList.contains("dark")),
    true,
    "Styled forms dark document",
  );
  const darkForms = await readStyledFormsVisuals(page, "dark");
  for (const [name, lightVisual] of Object.entries(lightProof.forms)) {
    const darkVisual = darkForms[name];
    if (
      Math.abs(darkVisual.width - lightVisual.width) > 1 ||
      Math.abs(darkVisual.height - lightVisual.height) > 1
    ) {
      throw new Error(
        `Styled ${name} geometry drifted between themes: light=${JSON.stringify(lightVisual)}, dark=${JSON.stringify(darkVisual)}`,
      );
    }
  }
  const darkSpecialized = await readSpecializedCohortVisuals(page, "dark");
  for (const [name, lightVisual] of Object.entries(lightProof.specialized)) {
    const darkVisual = darkSpecialized[name];
    if (
      Math.abs(darkVisual.width - lightVisual.width) > 1 ||
      Math.abs(darkVisual.height - lightVisual.height) > 1
    ) {
      throw new Error(
        `Styled ${name} geometry drifted between themes: light=${JSON.stringify(lightVisual)}, dark=${JSON.stringify(darkVisual)}`,
      );
    }
    if (
      darkVisual.backgroundColor === lightVisual.backgroundColor &&
      darkVisual.borderColor === lightVisual.borderColor &&
      darkVisual.color === lightVisual.color
    ) {
      throw new Error(
        `Styled ${name} dark theme did not change visible styling: light=${JSON.stringify(lightVisual)}, dark=${JSON.stringify(darkVisual)}`,
      );
    }
  }

  const lightGeometry = lightProof.toggleGroup;
  const darkGeometry = await readStyledToggleGroupGeometry(
    page.getByTestId("styled-toggle-group-control"),
  );
  await assertEqual(
    darkGeometry.spacingToken,
    lightGeometry.spacingToken,
    "Styled Toggle Group dark spacing token",
  );
  await assertEqual(
    darkGeometry.outlineColor,
    "rgb(14, 165, 233)",
    "Styled Toggle Group dark consumer style",
  );
  if (
    Math.abs(darkGeometry.gap - lightGeometry.gap) > 0.5 ||
    Math.abs(darkGeometry.itemWidth - lightGeometry.itemWidth) > 0.5 ||
    Math.abs(darkGeometry.itemHeight - lightGeometry.itemHeight) > 0.5
  ) {
    throw new Error(
      `Styled Toggle Group dark geometry drifted: light=${JSON.stringify(lightGeometry)}, dark=${JSON.stringify(darkGeometry)}`,
    );
  }
  if (
    darkGeometry.itemColor === lightGeometry.itemColor &&
    darkGeometry.itemBorderColor === lightGeometry.itemBorderColor
  ) {
    throw new Error(
      `Styled Toggle Group dark theme did not change item styling: light=${JSON.stringify(lightGeometry)}, dark=${JSON.stringify(darkGeometry)}`,
    );
  }
}

async function readStyledFormsVisuals(page, mode) {
  const controls = {
    "Checkbox Group": page.getByTestId("styled-checkbox-group").locator("[data-sw-checkbox-group]"),
    Collapsible: page.getByTestId("styled-collapsible"),
    Form: page.getByTestId("styled-form"),
    Input: page.getByTestId("styled-input-small"),
    "Radio Group": page.getByTestId("styled-radio-group").locator("[data-sw-radio-group]"),
    Switch: page.getByTestId("styled-switch"),
    Toggle: page.getByTestId("styled-toggle"),
    "Toggle Group": page.getByTestId("styled-toggle-group-control"),
  };
  const visuals = {};
  for (const [name, control] of Object.entries(controls)) {
    await assertEqual(await control.count(), 1, `${mode} Styled ${name} inventory`);
    await assertEqual(await control.isVisible(), true, `${mode} Styled ${name} visibility`);
    const visual = await control.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        backgroundColor: style.backgroundColor,
        borderColor: style.borderColor,
        color: style.color,
        display: style.display,
        height: rect.height,
        width: rect.width,
      };
    });
    if (
      visual.display === "none" ||
      !Number.isFinite(visual.height) ||
      !Number.isFinite(visual.width) ||
      visual.height <= 0 ||
      visual.width <= 0
    ) {
      throw new Error(`Styled ${name} unresolved in ${mode} mode: ${JSON.stringify(visual)}`);
    }
    visuals[name] = visual;
  }
  return visuals;
}

async function readSpecializedCohortVisuals(page, mode) {
  const controls = {
    Accordion: page.getByTestId("accordion-review").getByTestId("styled-accordion-trigger"),
    Dropzone: page.getByTestId("dropzone-review").locator("[data-sw-dropzone]").nth(1),
    Field: page.getByTestId("field-review").getByTestId("field-email-control"),
    "Input OTP": page
      .getByTestId("input-otp-review")
      .locator('[data-slot="input-otp-slot"]')
      .first(),
    Slider: page.getByTestId("slider-review").getByTestId("styled-slider"),
    Tabs: page.getByTestId("tabs-review").getByTestId("styled-tabs-trigger"),
    Tooltip: page.getByTestId("styled-tooltip-controlled-trigger"),
    "Hover Card": page.getByTestId("styled-hover-card-controlled-trigger"),
    Dropdown: page.getByTestId("styled-dropdown-trigger"),
    "Context Menu": page.getByTestId("styled-context-menu-trigger"),
    "Navigation Menu": page.getByTestId("styled-navigation-trigger-guides"),
    Combobox: page.getByTestId("styled-combobox-input"),
  };
  const visuals = {};
  for (const [name, control] of Object.entries(controls)) {
    await assertEqual(await control.count(), 1, `${mode} Styled ${name} cohort inventory`);
    await assertEqual(await control.isVisible(), true, `${mode} Styled ${name} cohort visibility`);
    const visual = await control.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        backgroundColor: style.backgroundColor,
        borderColor: style.borderColor,
        color: style.color,
        display: style.display,
        height: rect.height,
        width: rect.width,
      };
    });
    if (
      visual.display === "none" ||
      !Number.isFinite(visual.height) ||
      !Number.isFinite(visual.width) ||
      visual.height <= 0 ||
      visual.width <= 0
    ) {
      throw new Error(
        `Styled ${name} cohort unresolved in ${mode} mode: ${JSON.stringify(visual)}`,
      );
    }
    visuals[name] = visual;
  }
  return visuals;
}

async function assertText(locator, expected, label) {
  const actual = (await locator.textContent())?.trim().replace(/\s+/g, " ") ?? "";
  await assertEqual(actual, expected, label);
}

async function readStyledSwitchGeometry(root) {
  return root.evaluate((element) => {
    const thumb = element.querySelector('[data-slot="switch-toggle"]');
    if (!(element instanceof HTMLElement) || !(thumb instanceof HTMLElement)) {
      throw new Error("Styled Switch geometry requires root and thumb elements.");
    }
    const rootRect = element.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();
    const rootStyle = getComputedStyle(element);
    const thumbStyle = getComputedStyle(thumb);
    return {
      heightToken: rootStyle.getPropertyValue("--height").trim(),
      paddingToken: rootStyle.getPropertyValue("--padding").trim(),
      rootHeight: rootRect.height,
      rootWidth: rootRect.width,
      thumbLeft: thumbRect.left,
      thumbWidth: thumbRect.width,
      translationToken: thumbStyle.getPropertyValue("--translation").trim(),
      widthToken: rootStyle.getPropertyValue("--width").trim(),
    };
  });
}

async function readStyledToggleGroupGeometry(root) {
  return root.evaluate((element) => {
    const items = element.querySelectorAll('[data-slot="toggle-group-item"]');
    const first = items[0];
    const second = items[1];
    if (
      !(element instanceof HTMLElement) ||
      !(first instanceof HTMLElement) ||
      !(second instanceof HTMLElement)
    ) {
      throw new Error("Styled Toggle Group geometry requires a root and at least two items.");
    }

    const rootRect = element.getBoundingClientRect();
    const firstRect = first.getBoundingClientRect();
    const secondRect = second.getBoundingClientRect();
    const rootStyle = getComputedStyle(element);
    const itemStyle = getComputedStyle(first);
    return {
      gap: Number.parseFloat(rootStyle.gap),
      itemBorderColor: itemStyle.borderColor,
      itemColor: itemStyle.color,
      itemHeight: firstRect.height,
      itemWidth: firstRect.width,
      measuredGap: secondRect.left - firstRect.right,
      outlineColor: rootStyle.outlineColor,
      rootWidth: rootRect.width,
      spacingToken: rootStyle.getPropertyValue("--gap").trim(),
    };
  });
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

async function captureStyledAlertDialogEvidence(page, evidencePath) {
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  const dimensions = await page.evaluate(() => ({
    height: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
    width: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
  }));
  await page.screenshot({ fullPage: true, path: evidencePath });
  return dimensions;
}

function formatDimensions(dimensions) {
  return `${dimensions.width}x${dimensions.height}`;
}

function capitalize(value) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
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
