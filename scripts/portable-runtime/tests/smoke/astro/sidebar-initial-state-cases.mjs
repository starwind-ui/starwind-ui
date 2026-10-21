const SIDEBAR_TAG_PATTERN = /<div\b[^>]*\sdata-sw-sidebar(?:-provider)?(?=[\s>=])[^>]*>/g;
const ATTRIBUTE_PATTERN = /\s([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

function parseOpeningTag(tag) {
  const attributes = [];
  const body = tag.replace(/^<div\b/, "").replace(/\/?>$/, "");
  for (const match of body.matchAll(ATTRIBUTE_PATTERN)) {
    attributes.push({
      name: match[1].toLowerCase(),
      value: match[2] ?? match[3] ?? match[4] ?? "",
    });
  }
  return attributes;
}

/**
 * Reads the provider and Sidebar opening tags from server HTML. The Runtime has not started, so
 * this is the markup that the browser paints first.
 */
export function readSidebarServerMarkup(html) {
  return [...html.matchAll(SIDEBAR_TAG_PATTERN)].map((match) => {
    const attributes = parseOpeningTag(match[0]);
    const names = attributes.map((attribute) => attribute.name);
    return {
      kind: names.includes("data-sw-sidebar-provider") ? "provider" : "sidebar",
      duplicateAttributes: names.filter((name, index) => names.indexOf(name) !== index),
      attribute: (name) => attributes.find((attribute) => attribute.name === name)?.value,
      tag: match[0],
    };
  });
}

async function verifySidebarServerMarkup({ baseUrl, path, expectedState }) {
  const response = await fetch(new URL(path, baseUrl));
  if (!response.ok) {
    throw new Error(`Sidebar server markup request failed for ${path}: ${response.status}.`);
  }
  const elements = readSidebarServerMarkup(await response.text());
  const provider = elements.find((element) => element.kind === "provider");
  const sidebar = elements.find((element) => element.kind === "sidebar");
  if (!provider || !sidebar) {
    throw new Error(`Sidebar server markup for ${path} has no provider or Sidebar element.`);
  }

  for (const element of elements) {
    if (element.duplicateAttributes.length > 0) {
      throw new Error(
        `Sidebar server markup for ${path} repeats ${element.duplicateAttributes.join(", ")}: ${element.tag}`,
      );
    }
  }

  const collapsibleMode = sidebar.attribute("data-collapsible-mode");
  const markup = {
    providerState: provider.attribute("data-state"),
    sidebarState: sidebar.attribute("data-state"),
    sidebarCollapsible: sidebar.attribute("data-collapsible"),
  };
  const expected = {
    providerState: expectedState,
    sidebarState: expectedState,
    sidebarCollapsible: expectedState === "collapsed" ? collapsibleMode : "",
  };
  if (JSON.stringify(markup) !== JSON.stringify(expected)) {
    throw new Error(
      `Sidebar server markup for ${path} does not match its provider: ${JSON.stringify({ markup, expected })}.`,
    );
  }
}

export async function verifyAstroSidebarInitialStateCases({ browser, baseUrl, serverMode }) {
  await verifySidebarServerMarkup({
    baseUrl,
    path: "/smoke/sidebar-initial-state/",
    expectedState: "collapsed",
  });
  await verifySidebarServerMarkup({
    baseUrl,
    path: "/pages/runtime-sidebar-demo",
    expectedState: "expanded",
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  try {
    await verifySidebarFirstPaint({ page, baseUrl, serverMode });
  } finally {
    await page.close();
  }
}

async function verifySidebarFirstPaint({ page, baseUrl, serverMode }) {
  await page.addInitScript(() => {
    window.__sidebarInitialStateShift = 0;
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) window.__sidebarInitialStateShift += entry.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    } catch {
      // Layout Instability API is unavailable outside Chromium.
    }
  });
  await page.goto(new URL("/smoke/sidebar-initial-state/", baseUrl).toString(), {
    waitUntil: serverMode === "dev" ? "domcontentloaded" : "networkidle",
  });
  await page.getByRole("heading", { name: "Sidebar initial state smoke fixture" }).waitFor();
  // Wait longer than the 200ms sidebar width transition, so a wrong first paint would shift.
  await page.waitForTimeout(500);

  const loaded = await page.evaluate(() => ({
    layoutShift: window.__sidebarInitialStateShift,
    sidebarState: document.querySelector("[data-sw-sidebar]")?.getAttribute("data-state"),
  }));
  if (loaded.sidebarState !== "collapsed" || loaded.layoutShift > 0.001) {
    throw new Error(
      `Astro Sidebar with defaultOpen={false} did not paint collapsed: ${JSON.stringify(loaded)}.`,
    );
  }

  await page.locator("#sidebar-initial-state-trigger").click();
  await page.waitForFunction(
    () => document.querySelector("[data-sw-sidebar]")?.getAttribute("data-state") === "expanded",
  );
}
