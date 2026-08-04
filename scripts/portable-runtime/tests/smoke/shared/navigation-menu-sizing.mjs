const SIZE_CASES = [
  {
    suffix: "size-sm",
    expectedSize: "sm",
    height: 36,
    fontSize: 14,
    gap: 0,
    chevronSize: 12,
    chevronMarginLeft: 4,
  },
  {
    suffix: "size-default",
    expectedSize: "md",
    height: 44,
    fontSize: 16,
    gap: 4,
    chevronSize: 16,
    chevronMarginLeft: 6,
  },
];

const CONTENT_CASES = [
  { suffix: "size-sm", expectedSize: "sm", fontSize: 14, gap: 8, paddingX: 8, paddingY: 6 },
  {
    suffix: "size-default",
    expectedSize: "md",
    fontSize: 16,
    gap: 10,
    paddingX: 12,
    paddingY: 8,
  },
];

export async function verifyNavigationMenuSizingCases({ page, prefix, label, composedDataSlot }) {
  await page.locator(`#${prefix}-sizing-showcase`).scrollIntoViewIfNeeded();

  for (const sizingCase of SIZE_CASES) {
    const rootId = `${prefix}-${sizingCase.suffix}`;
    const triggerId = `${rootId}-trigger`;
    const state = await page.evaluate(readNativeSizing, { rootId, triggerId });

    assertApprox(
      state.height,
      sizingCase.height,
      `${label} ${sizingCase.expectedSize} trigger height`,
    );
    assertApprox(
      state.fontSize,
      sizingCase.fontSize,
      `${label} ${sizingCase.expectedSize} trigger typography`,
    );
    assertApprox(state.gap, sizingCase.gap, `${label} ${sizingCase.expectedSize} List gap`);
    assertApprox(
      state.chevronHeight,
      sizingCase.chevronSize,
      `${label} ${sizingCase.expectedSize} chevron height`,
    );
    assertApprox(
      state.chevronWidth,
      sizingCase.chevronSize,
      `${label} ${sizingCase.expectedSize} chevron width`,
    );
    assertApprox(
      state.chevronMarginLeft,
      sizingCase.chevronMarginLeft,
      `${label} ${sizingCase.expectedSize} chevron margin`,
    );

    if (state.rootSize !== sizingCase.expectedSize) {
      throw new Error(
        `Expected ${label} ${sizingCase.expectedSize} root metadata, got ${JSON.stringify(state)}.`,
      );
    }
  }

  for (const contentCase of CONTENT_CASES) {
    await verifyContentCase({ page, prefix, label, ...contentCase });
  }

  const triggerStyleLink = page.locator(`#${prefix}-size-default-trigger-link`);
  const triggerStyleState = await triggerStyleLink.evaluate((element) => ({
    className: element.getAttribute("class") ?? "",
    fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
    height: element.getBoundingClientRect().height,
  }));
  assertApprox(triggerStyleState.height, 44, `${label} trigger-style Link height`);
  assertApprox(triggerStyleState.fontSize, 16, `${label} trigger-style Link typography`);

  const customizedTriggerClass =
    (await page.locator(`#${prefix}-size-default-trigger`).getAttribute("class")) ?? "";
  if (
    !customizedTriggerClass.includes("underline") ||
    !customizedTriggerClass.includes("decoration-dotted")
  ) {
    throw new Error(
      `Expected ${label} native Trigger class customization to merge through its recipe, got ${customizedTriggerClass}.`,
    );
  }

  await verifyMismatchedContentCase({ page, prefix, label });
  await verifyAsChildOwnershipCase({ page, prefix, label, composedDataSlot });
}

async function verifyContentCase({
  page,
  prefix,
  label,
  suffix,
  expectedSize,
  fontSize,
  gap,
  paddingX,
  paddingY,
}) {
  const rootId = `${prefix}-${suffix}`;
  const trigger = page.locator(`#${rootId}-trigger`);
  const link = page.locator(`#${rootId}-link`);

  await trigger.click();
  await link.waitFor({ state: "visible" });
  await waitForPopupTransition(page, `${rootId}-link`);
  const state = await link.evaluate(readOpenContentSizing);

  if (state.positionerSize !== expectedSize) {
    throw new Error(
      `Expected ${label} ${expectedSize} Positioner metadata, got ${JSON.stringify(state)}.`,
    );
  }
  assertApprox(state.contentPadding, 4, `${label} ${expectedSize} Content padding`);
  assertApprox(state.fontSize, fontSize, `${label} ${expectedSize} popup-link typography`);
  assertApprox(state.gap, gap, `${label} ${expectedSize} popup-link gap`);
  assertApprox(
    state.paddingLeft,
    paddingX,
    `${label} ${expectedSize} popup-link horizontal padding`,
  );
  assertApprox(state.paddingTop, paddingY, `${label} ${expectedSize} popup-link vertical padding`);

  if (expectedSize === "sm") {
    assertApprox(state.defaultIconHeight, 16, `${label} default link icon height`);
    assertApprox(state.defaultIconWidth, 16, `${label} default link icon width`);
    assertApprox(state.explicitIconHeight, 24, `${label} explicit link icon height`);
    assertApprox(state.explicitIconWidth, 24, `${label} explicit link icon width`);
  }

  await page.keyboard.press("Escape");
  await page.waitForFunction(
    ({ triggerId }) => document.getElementById(triggerId)?.getAttribute("data-state") === "closed",
    { triggerId: `${rootId}-trigger` },
  );
}

async function verifyMismatchedContentCase({ page, prefix, label }) {
  const rootId = `${prefix}-size-mismatch`;
  const trigger = page.locator(`#${rootId}-trigger`);
  const link = page.locator(`#${rootId}-link`);

  await trigger.click();
  await link.waitFor({ state: "visible" });
  await waitForPopupTransition(page, `${rootId}-link`);
  const state = await link.evaluate(readOpenContentSizing);
  const rootSize = await page.locator(`#${rootId}`).getAttribute("data-size");

  if (rootSize !== "sm" || state.positionerSize !== "md") {
    throw new Error(
      `Expected ${label} mismatched root/content scopes to remain sm/md, got ${JSON.stringify({ rootSize, state })}.`,
    );
  }
  assertApprox(state.fontSize, 16, `${label} mismatched popup typography`);
  assertApprox(state.gap, 10, `${label} mismatched popup gap`);
  assertApprox(state.paddingLeft, 12, `${label} mismatched popup horizontal padding`);
  assertApprox(state.paddingTop, 8, `${label} mismatched popup vertical padding`);

  await page.keyboard.press("Escape");
}

async function verifyAsChildOwnershipCase({ page, prefix, label, composedDataSlot }) {
  const rootId = `${prefix}-composition`;
  const triggerId = `${prefix}-composed-trigger`;
  const trigger = page.locator(`#${triggerId}`);
  const initial = await trigger.evaluate((element) => ({
    ariaExpanded: element.getAttribute("aria-expanded"),
    ariaHaspopup: element.getAttribute("aria-haspopup"),
    className: element.getAttribute("class") ?? "",
    dataSlot: element.getAttribute("data-slot"),
    hasRuntimeHook: element.hasAttribute("data-sw-nav-menu-trigger"),
    height: element.getBoundingClientRect().height,
    indicatorCount: element.querySelectorAll('[data-slot="navigation-menu-indicator"]').length,
    state: element.getAttribute("data-state"),
    tagName: element.tagName,
  }));
  const rootSize = await page.locator(`#${rootId}`).getAttribute("data-size");

  if (
    rootSize !== "md" ||
    initial.tagName !== "BUTTON" ||
    initial.ariaExpanded !== "false" ||
    initial.ariaHaspopup !== "menu" ||
    initial.state !== "closed" ||
    initial.dataSlot !== composedDataSlot ||
    initial.hasRuntimeHook !== true ||
    initial.indicatorCount !== 0 ||
    !initial.className.includes("tracking-wide") ||
    !initial.className.includes("uppercase") ||
    !initial.className.includes("h-9") ||
    !initial.className.includes("border")
  ) {
    throw new Error(
      `Expected ${label} asChild Trigger to delegate markup and visuals to the small outline Button while transferring Navigation Menu behavior, got ${JSON.stringify({ rootSize, initial })}.`,
    );
  }
  assertApprox(initial.height, 36, `${label} delegated Button height`);

  await trigger.click();
  await page.waitForFunction(
    ({ triggerId }) =>
      document.getElementById(triggerId)?.getAttribute("aria-expanded") === "true" &&
      document.getElementById(triggerId)?.getAttribute("data-state") === "open",
    { triggerId },
  );

  if ((await trigger.locator('[data-slot="navigation-menu-indicator"]').count()) !== 0) {
    throw new Error(
      `Expected ${label} asChild Trigger to omit the built-in Navigation Menu chevron.`,
    );
  }

  await page.keyboard.press("Escape");
}

function readNativeSizing({ rootId, triggerId }) {
  const root = document.getElementById(rootId);
  const trigger = document.getElementById(triggerId);
  const list = root?.querySelector('[data-slot="navigation-menu-list"]');
  const chevron = trigger?.querySelector('[data-slot="navigation-menu-indicator"] svg');
  const triggerStyle = trigger instanceof HTMLElement ? getComputedStyle(trigger) : null;
  const listStyle = list instanceof HTMLElement ? getComputedStyle(list) : null;
  const chevronRect = chevron instanceof SVGElement ? chevron.getBoundingClientRect() : null;
  const chevronStyle =
    chevron?.parentElement instanceof HTMLElement ? getComputedStyle(chevron.parentElement) : null;

  return {
    chevronHeight: chevronRect?.height ?? 0,
    chevronMarginLeft: Number.parseFloat(chevronStyle?.marginLeft ?? "0"),
    chevronWidth: chevronRect?.width ?? 0,
    fontSize: Number.parseFloat(triggerStyle?.fontSize ?? "0"),
    gap: Number.parseFloat(listStyle?.gap ?? "0"),
    height: trigger instanceof HTMLElement ? trigger.getBoundingClientRect().height : 0,
    rootSize: root?.getAttribute("data-size") ?? null,
  };
}

function readOpenContentSizing(link) {
  const linkStyle = getComputedStyle(link);
  const content = link.closest('[data-slot="navigation-menu-content"]');
  const positioner = link.closest('[data-slot="navigation-menu-positioner"]');
  const icon = link.querySelector("svg");
  const iconRect = icon instanceof SVGElement ? icon.getBoundingClientRect() : null;
  const explicitIcon = content?.querySelector('a[href="#small-explicit-icon"] svg');
  const explicitIconRect =
    explicitIcon instanceof SVGElement ? explicitIcon.getBoundingClientRect() : null;

  return {
    contentPadding:
      content instanceof HTMLElement ? Number.parseFloat(getComputedStyle(content).paddingTop) : 0,
    defaultIconHeight: iconRect?.height ?? 0,
    defaultIconWidth: iconRect?.width ?? 0,
    explicitIconHeight: explicitIconRect?.height ?? 0,
    explicitIconWidth: explicitIconRect?.width ?? 0,
    fontSize: Number.parseFloat(linkStyle.fontSize),
    gap: Number.parseFloat(linkStyle.gap),
    paddingLeft: Number.parseFloat(linkStyle.paddingLeft),
    paddingTop: Number.parseFloat(linkStyle.paddingTop),
    positionerSize: positioner?.getAttribute("data-size") ?? null,
  };
}

async function waitForPopupTransition(page, linkId) {
  await page.waitForFunction((id) => {
    const link = document.getElementById(id);
    const popup = link?.closest('[data-slot="navigation-menu-popup"]');

    if (!(popup instanceof HTMLElement)) return false;

    const style = getComputedStyle(popup);
    return (
      style.transform === "none" &&
      (style.scale === "none" || style.scale === "1") &&
      style.opacity === "1"
    );
  }, linkId);
}

function assertApprox(actual, expected, label) {
  if (!Number.isFinite(actual) || Math.abs(actual - expected) > 0.75) {
    throw new Error(`Expected ${label} to be ${expected}px, got ${actual}px.`);
  }
}
