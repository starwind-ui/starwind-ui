import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { verifyReactCarouselCases } from "./react/carousel-cases.mjs";
import { verifyReactFormControlCases } from "./react/form-control-cases.mjs";
import { verifyReactFoundationCases } from "./react/foundation-cases.mjs";
import { verifyReactMediaOverlayCases } from "./react/media-overlay-cases.mjs";
import { verifyReactSheetMenuCases } from "./react/sheet-menu-cases.mjs";
import { verifyNestedSidebarPageCases, verifySidebarCases } from "./shared/sidebar.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../../..");
const REACT_DEMO_ROOT = path.join(REPO_ROOT, "apps/react-demo");
const HOST = "127.0.0.1";
const PORT = 5174;
const reactDemoRequire = createRequire(path.join(REACT_DEMO_ROOT, "package.json"));
const { chromium } = reactDemoRequire("playwright");
const { createServer } = await import(pathToFileURL(reactDemoRequire.resolve("vite")).href);

const server = await createServer({
  root: REACT_DEMO_ROOT,
  optimizeDeps: { force: true },
  server: { host: HOST, port: PORT, strictPort: false },
  logLevel: "silent",
});

let browser;

try {
  await server.listen();
  const url = server.resolvedUrls?.local[0] ?? `http://${HOST}:${PORT}/`;
  await verifyReactThemeInitScript(url);
  browser = await chromium.launch({ headless: true });

  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.addInitScript(() => {
    try {
      localStorage.removeItem("starwind-tabs-react-runtime-tabs-sync-demo");
      localStorage.removeItem("starwind-react-runtime-sidebar-demo-open");
      localStorage.removeItem("starwind-react-runtime-sidebar-prototype-open");
      localStorage.setItem("colorTheme", "light");
    } catch {
      // Storage can be unavailable on the initial about:blank document.
    }
  });
  const messages = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      messages.push(`console error: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    messages.push(`page error: ${error.message}`);
  });
  await installExternalVideoRequestGuard(page, messages);

  await page.goto(url, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Starwind portable components" }).waitFor();
  await verifyReactAppNav({ page, activeLabel: "Runtime Prototype" });

  await verifyReactFoundationCases({ page });
  await verifyReactCarouselCases({ page });
  await page.goto(new URL("/pages/runtime-sidebar-demo", url).toString(), {
    waitUntil: "networkidle",
  });
  await page.getByRole("heading", { name: "Runtime Sidebar Demo" }).waitFor();
  await verifyReactSidebarInsetNav({
    page,
    expectedLinks: [
      { href: "/", label: "Prototype" },
      { href: "/pages/runtime-nested-sidebar", label: "Nested" },
    ],
  });
  await verifySidebarCases({
    page,
    ids: {
      demo: "react-runtime-sidebar-demo",
      trigger: "react-runtime-sidebar-trigger",
    },
    label: "React",
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
  await page.goto(new URL("/pages/runtime-nested-sidebar", url).toString(), {
    waitUntil: "networkidle",
  });
  await page.getByRole("heading", { name: "Runtime Nested Menus Demo" }).waitFor();
  await verifyReactSidebarInsetNav({
    page,
    expectedLinks: [
      { href: "/", label: "Prototype" },
      { href: "/pages/runtime-sidebar-demo", label: "Basic" },
    ],
  });
  await verifyNestedSidebarPageCases({
    page,
    ids: {
      demo: "react-runtime-nested-sidebar-demo",
      trigger: "react-runtime-nested-sidebar-trigger",
    },
    label: "React",
  });
  await page.goto(url, { waitUntil: "networkidle" });
  await verifyReactAppNav({ page, activeLabel: "Runtime Prototype" });
  await verifyReactFormControlCases({ page, messages });
  await verifyReactMediaOverlayCases({ page, messages });
  await verifyReactSheetMenuCases({ page });

  if (messages.length > 0) {
    throw new Error(messages.join("\n"));
  }

  console.log(`React demo smoke passed at ${url}`);
} finally {
  await browser?.close();
  await server.close();
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

async function verifyReactAppNav({ page, activeLabel }) {
  await page.waitForFunction((label) => {
    const nav = document.querySelector('nav[aria-label="React demo pages"]');
    const themeInitScript = document.querySelector("script[data-starwind-theme-init]");
    const toggle = document.getElementById("react-demo-app-theme-toggle");
    const links = Array.from(nav?.querySelectorAll("a") ?? []).map((link) => ({
      current: link.getAttribute("aria-current"),
      href: link.getAttribute("href"),
      label: link.textContent?.trim(),
    }));

    return (
      nav instanceof HTMLElement &&
      themeInitScript instanceof HTMLScriptElement &&
      toggle instanceof HTMLElement &&
      toggle.hasAttribute("data-sw-theme-toggle") &&
      toggle.querySelectorAll("[data-theme-icon][data-ready]").length >= 2 &&
      links.some(
        (link) =>
          link.label === "Runtime Prototype" && (link.href === "/" || link.href?.endsWith("/")),
      ) &&
      links.some(
        (link) => link.label === "Runtime Sidebar" && link.href === "/pages/runtime-sidebar-demo",
      ) &&
      links.some(
        (link) =>
          link.label === "Runtime Nested Sidebar" && link.href === "/pages/runtime-nested-sidebar",
      ) &&
      links.some((link) => link.label === label && link.current === "page")
    );
  }, activeLabel);
}

async function verifyReactThemeInitScript(url) {
  const response = await fetch(url);
  const html = await response.text();
  const themeScriptIndex = html.indexOf("data-starwind-theme-init");
  const mainModuleIndex = html.indexOf("/src/main.tsx");

  if (
    !response.ok ||
    themeScriptIndex === -1 ||
    mainModuleIndex === -1 ||
    themeScriptIndex > mainModuleIndex ||
    !html.includes("localStorage.setItem(storageKey, theme)")
  ) {
    throw new Error(
      "React demo HTML did not include the Starwind theme init script before main.tsx",
    );
  }
}

async function verifyReactSidebarInsetNav({ page, expectedLinks }) {
  await page.waitForFunction((links) => {
    const appNav = document.querySelector('nav[aria-label="React demo pages"]');
    const insetNav = document.querySelector('nav[aria-label="Runtime sidebar page navigation"]');
    const appThemeToggle = document.querySelector("#react-demo-app-theme-toggle");
    const insetThemeToggle = document.querySelector(
      '[data-slot="sidebar-inset"] [data-sw-theme-toggle]',
    );
    const actualLinks = Array.from(insetNav?.querySelectorAll("a") ?? []).map((link) => ({
      href: link.getAttribute("href"),
      label: link.textContent?.trim(),
    }));

    return (
      appNav === null &&
      insetNav instanceof HTMLElement &&
      appThemeToggle === null &&
      insetThemeToggle instanceof HTMLElement &&
      insetThemeToggle.querySelectorAll("[data-theme-icon][data-ready]").length >= 2 &&
      links.every((expected) =>
        actualLinks.some((link) => link.href === expected.href && link.label === expected.label),
      )
    );
  }, expectedLinks);
}
