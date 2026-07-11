import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifyAstroCarouselCases } from "./astro/carousel-cases.mjs";
import { verifyAstroFormControlCases } from "./astro/form-control-cases.mjs";
import { verifyAstroFoundationCases } from "./astro/foundation-cases.mjs";
import { verifyAstroMediaOverlayCases } from "./astro/media-overlay-cases.mjs";
import { verifyAstroSheetMenuCases } from "./astro/sheet-menu-cases.mjs";
import { waitForAstroSmokePage } from "./astro-smoke-readiness.mjs";
import { verifyNestedSidebarPageCases, verifySidebarCases } from "./shared/sidebar.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../../..");
const DEMO_ROOT = path.join(REPO_ROOT, "apps/demo");
const REACT_DEMO_ROOT = path.join(REPO_ROOT, "apps/react-demo");
const HOST = "127.0.0.1";
const PORT = Number(process.env.STARWIND_ASTRO_SMOKE_PORT ?? "4325");
const RUNTIME_PROTOTYPE_PATH = "/runtime-prototype/";
const SERVER_MODE = process.env.STARWIND_ASTRO_SMOKE_SERVER_MODE ?? "preview";
const SERVER_COMMAND = SERVER_MODE === "dev" ? "dev" : "preview";
const SHOULD_SPAWN_SERVER = SERVER_MODE !== "external";

const demoRequire = createRequire(path.join(DEMO_ROOT, "package.json"));
const reactDemoRequire = createRequire(path.join(REACT_DEMO_ROOT, "package.json"));
const astroPackagePath = demoRequire.resolve("astro/package.json");
const astroBinPath = path.join(path.dirname(astroPackagePath), "bin/astro.mjs");
const { chromium } = reactDemoRequire("playwright");

const preview = SHOULD_SPAWN_SERVER
  ? spawn(
      process.execPath,
      [astroBinPath, SERVER_COMMAND, "--host", HOST, "--port", String(PORT)],
      {
        cwd: DEMO_ROOT,
        env: {
          ...process.env,
          ASTRO_TELEMETRY_DISABLED: "1",
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    )
  : null;

let browser;
let page;
const messages = [];
let previewOutput = "";

preview?.stdout?.on("data", (chunk) => {
  previewOutput += chunk.toString();
});
preview?.stderr?.on("data", (chunk) => {
  previewOutput += chunk.toString();
});

try {
  const url = `http://${HOST}:${PORT}${RUNTIME_PROTOTYPE_PATH}`;
  browser = await chromium.launch({ headless: true });

  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.addInitScript(() => {
    try {
      localStorage.removeItem("starwind-tabs-runtime-tabs-sync-demo");
      localStorage.removeItem("starwind-runtime-sidebar-demo-open");
      localStorage.removeItem("starwind-runtime-sidebar-prototype-open");
      localStorage.setItem("colorTheme", "light");
      document.cookie = "starwind-runtime-sidebar-demo-open=; Max-Age=0; path=/";
    } catch {
      // Storage can be unavailable on the initial about:blank document.
    }
  });
  page.on("console", (message) => {
    const text = message.text();
    if (message.type() === "error" || text.includes("Toast: No Toaster found")) {
      messages.push(`console ${message.type()}: ${text}`);
    }
  });
  page.on("pageerror", (error) => {
    messages.push(`page error: ${error.message}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      messages.push(`response ${response.status()}: ${response.url()}`);
    }
  });
  page.on("requestfailed", (request) => {
    const errorText = request.failure()?.errorText ?? "";

    if (errorText === "net::ERR_ABORTED" || errorText === "net::ERR_CONNECTION_REFUSED") {
      return;
    }

    messages.push(`request failed: ${request.url()} ${errorText}`);
  });
  await installExternalVideoRequestGuard(page, messages);

  await waitForAstroSmokePage(page, url, {
    getServerExitCode: () => preview?.exitCode ?? null,
    getServerOutput: () => previewOutput,
    serverCommand: SERVER_COMMAND,
    serverMode: SERVER_MODE,
  });

  if (messages.length > 0) {
    throw new Error(messages.join("\n"));
  }

  await page.getByRole("heading", { name: "Portable runtime prototype" }).waitFor();
  await verifyAstroAppNav({ page });

  await verifyAstroFoundationCases({ page });
  await verifyAstroCarouselCases({ page });
  await page.goto(`http://${HOST}:${PORT}/pages/runtime-sidebar-demo`, {
    waitUntil: SERVER_MODE === "dev" ? "domcontentloaded" : "networkidle",
  });
  await page.getByRole("heading", { name: "Runtime Sidebar Demo" }).waitFor();
  await verifyAstroSidebarInsetNav({
    page,
    expectedLinks: [
      { href: "/runtime-prototype/", label: "Prototype" },
      { href: "/pages/runtime-nested-sidebar", label: "Nested" },
    ],
  });
  await verifySidebarCases({
    page,
    ids: {
      demo: "runtime-sidebar-demo",
      trigger: "runtime-sidebar-trigger",
    },
    label: "Astro",
    expectations: {
      badgeText: null,
      containerPosition: "fixed",
      minMenuActionCount: 0,
      minMenuButtonCount: 9,
      minSkeletonCount: 0,
      minSubButtonCount: 0,
      minTooltipButtonCount: 8,
    },
  });
  await page.goto(`http://${HOST}:${PORT}/pages/runtime-nested-sidebar`, {
    waitUntil: SERVER_MODE === "dev" ? "domcontentloaded" : "networkidle",
  });
  await page.getByRole("heading", { name: "Runtime Nested Menus Demo" }).waitFor();
  await verifyAstroSidebarInsetNav({
    page,
    expectedLinks: [
      { href: "/runtime-prototype/", label: "Prototype" },
      { href: "/pages/runtime-sidebar-demo", label: "Basic" },
    ],
  });
  await verifyNestedSidebarPageCases({
    page,
    dialogTriggerSlots: {
      "runtime-nested-dialog-level-one-trigger": "button",
      "runtime-nested-dialog-level-two-trigger": "button",
      "runtime-nested-dialog-parent-trigger": "dialog-trigger",
    },
    ids: {
      demo: "runtime-nested-sidebar-demo",
      trigger: "runtime-nested-sidebar-trigger",
    },
    label: "Astro",
  });
  await page.goto(url, { waitUntil: SERVER_MODE === "dev" ? "domcontentloaded" : "networkidle" });
  await verifyAstroAppNav({ page });
  await verifyAstroFormControlCases({ page });
  await verifyAstroMediaOverlayCases({ page, serverMode: SERVER_MODE });
  await verifyAstroSheetMenuCases({ page });

  if (messages.length > 0) {
    throw new Error(messages.join("\n"));
  }

  console.log(`Astro demo smoke passed at ${url}`);
} catch (error) {
  throw new Error(`${error instanceof Error ? error.message : String(error)}

${await describeFailure(page, messages, previewOutput)}`);
} finally {
  await browser?.close();
  preview?.kill();
}

async function describeFailure(page, messages, previewOutput) {
  let snapshot = null;
  if (page) {
    try {
      snapshot = await page.evaluate(() => {
        const getAttribute = (selector, name) =>
          document.querySelector(selector)?.getAttribute(name);
        const hasAttribute = (selector, name) =>
          document.querySelector(selector)?.hasAttribute(name) ?? null;

        return {
          badgeCount: document.querySelectorAll('[data-slot="badge"]').length,
          bodyStart: document.body?.innerText?.slice(0, 1000) ?? "",
          checkboxAriaChecked: getAttribute("#runtime-checkbox-default", "aria-checked"),
          checkboxHasChecked: hasAttribute("#runtime-checkbox-default", "data-checked"),
          componentHeadings: Array.from(document.querySelectorAll("h2"))
            .map((heading) => heading.textContent?.trim())
            .slice(0, 24),
          dialogOpenCount: document.querySelectorAll("dialog[open]").length,
          sidebarProviderMobileOpen: getAttribute(
            "#runtime-sidebar-demo [data-slot='sidebar-provider']",
            "data-mobile-open",
          ),
          sidebarProviderState: getAttribute(
            "#runtime-sidebar-demo [data-slot='sidebar-provider']",
            "data-state",
          ),
          sidebarTriggerAriaExpanded: getAttribute("#runtime-sidebar-trigger", "aria-expanded"),
          sidebarTriggerState: getAttribute("#runtime-sidebar-trigger", "data-state"),
          inputOtpValue: getAttribute("#runtime-input-otp-default", "data-value"),
          radioGroupValue: getAttribute("[data-runtime-radio-group-default]", "data-value"),
          scriptSources: Array.from(document.scripts)
            .map((script) => script.src || script.textContent?.slice(0, 100) || "")
            .filter(Boolean)
            .slice(0, 24),
          switchAriaChecked: getAttribute("#runtime-switch-default", "aria-checked"),
          tabsValue: getAttribute("#runtime-tabs-default", "data-value"),
          title: document.title,
          url: window.location.href,
        };
      });
    } catch (error) {
      snapshot = {
        error: error instanceof Error ? error.message : String(error),
        url: page.url(),
      };
    }
  }

  return `Astro ${SERVER_MODE} smoke failure context:
messages=${JSON.stringify(messages, null, 2)}
snapshot=${JSON.stringify(snapshot, null, 2)}
serverTail=${previewOutput.slice(-4000)}`;
}

async function installExternalVideoRequestGuard(page, messages) {
  await page.route("**/*", (route) => {
    const url = route.request().url();
    if (isExternalVideoUrl(url)) {
      messages.push(`blocked external video request: ${url}`);
      return route.abort();
    }

    return route.continue();
  });
}

function isExternalVideoUrl(url) {
  try {
    const { hostname } = new URL(url);

    return ["googlevideo.com", "youtube.com", "youtube-nocookie.com", "youtu.be", "ytimg.com"].some(
      (host) => hostname === host || hostname.endsWith(`.${host}`),
    );
  } catch {
    return false;
  }
}

async function verifyAstroAppNav({ page }) {
  await page.waitForFunction(() => {
    const nav = document.querySelector("body > nav");
    const themeInitScript = document.querySelector("script[data-starwind-theme-init]");
    const links = Array.from(nav?.querySelectorAll("a") ?? []).map((link) => ({
      href: link.getAttribute("href"),
      label: link.textContent?.trim(),
    }));
    const themeToggle = nav?.querySelector('[data-slot="theme-toggle"]');

    return (
      nav instanceof HTMLElement &&
      themeInitScript instanceof HTMLScriptElement &&
      themeToggle instanceof HTMLElement &&
      links.some(
        (link) => link.label === "Runtime Sidebar" && link.href === "/pages/runtime-sidebar-demo",
      ) &&
      links.some(
        (link) =>
          link.label === "Runtime Nested Sidebar" && link.href === "/pages/runtime-nested-sidebar",
      )
    );
  });
}

async function verifyAstroSidebarInsetNav({ page, expectedLinks }) {
  await page.waitForFunction((links) => {
    const appNav = document.querySelector("body > nav");
    const insetNav = document.querySelector('nav[aria-label="Runtime sidebar page navigation"]');
    const themeInitScript = document.querySelector("script[data-starwind-theme-init]");
    const insetThemeToggle = document.querySelector(
      '[data-slot="sidebar-inset"] [data-slot="theme-toggle"]',
    );
    const actualLinks = Array.from(insetNav?.querySelectorAll("a") ?? []).map((link) => ({
      href: link.getAttribute("href"),
      label: link.textContent?.trim(),
    }));

    return (
      appNav === null &&
      insetNav instanceof HTMLElement &&
      themeInitScript instanceof HTMLScriptElement &&
      insetThemeToggle instanceof HTMLElement &&
      links.every((expected) =>
        actualLinks.some((link) => link.href === expected.href && link.label === expected.label),
      )
    );
  }, expectedLinks);
}
