// One scenario definition plays against all four targets in Chromium. Each target renders the same
// test ids from its own small fixture under `fixtures/`, and each target has its own entry file under
// `targets/`, so Vitest plays the targets in separate workers. `differences.ts` names every expected
// difference and every known defect, so a new difference fails the suite until someone names it.
import {
  type Browser,
  type BrowserContext,
  type ConsoleMessage,
  chromium,
  firefox,
  type Page,
  webkit,
} from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { allowedConsoleErrors, intendedDifferences, knownDefects } from "./differences";
import { attributeScenarios } from "./scenarios/attributes";
import { eventScenarios, parentScenarios } from "./scenarios/events";
import { fieldControlScenarios } from "./scenarios/field-controls";
import { formScenarios } from "./scenarios/form";
import { interactionScenarios } from "./scenarios/interaction";
import { lateWriteScenarios } from "./scenarios/late-writes";
import { markerScenarios } from "./scenarios/markers";
import { triggerScenarios } from "./scenarios/triggers";
import type { Scenario } from "./scenarios/types";
import { type Target, Ui } from "./ui";

const scenarios: Scenario[] = [
  ...eventScenarios,
  ...parentScenarios,
  ...lateWriteScenarios,
  ...formScenarios,
  ...fieldControlScenarios,
  ...interactionScenarios,
  ...triggerScenarios,
  ...attributeScenarios,
  ...markerScenarios,
];

function pageUrl(target: Target, page: string): string {
  const base = inject("conformanceBaseUrl");
  return target === "astro" ? `${base}/astro/${page}/` : `${base}/${target}.html?page=${page}`;
}

let browser: Browser;

type Lease = { context: BrowserContext; page: Page };
type Opened = { ui: Ui; errors: string[]; release(passed: boolean): Promise<void> };

/**
 * Pages that a passed scenario gave back. A new page starts a new renderer process, which costs
 * more than most scenarios, so a scenario reuses an idle page and loads its fixture as a new
 * document. A page from a failed scenario is closed, so its state cannot reach a later scenario.
 */
const idle: Lease[] = [];

/** Pages that changed state that outlives a document, such as an installed clock or a route. */
const marked = new WeakSet<Page>();

/** Keys and mouse buttons that a scenario pressed and did not release, per page. */
const held = new WeakMap<Page, Set<string>>();

type Emitter = { eventNames(): (string | symbol)[]; listenerCount(name: string | symbol): number };

/** Listener counts per event on a new page and its context, before the harness adds any. */
const baselines = new WeakMap<Page, Map<Emitter, Map<string | symbol, number>>>();

function listenerCounts(emitter: Emitter): Map<string | symbol, number> {
  return new Map(emitter.eventNames().map((name) => [name, emitter.listenerCount(name)]));
}

/**
 * Finds a listener that a scenario added to the page or its context and did not remove. Playwright
 * adds listeners of its own while it waits, so only counts above the new-page counts are left over.
 */
function hasLeftoverListeners(page: Page): boolean {
  for (const [emitter, baseline] of baselines.get(page) ?? []) {
    for (const [name, count] of listenerCounts(emitter)) {
      if (count > (baseline.get(name) ?? 0)) return true;
    }
  }
  return false;
}

/** Records keys and mouse buttons that stay pressed, because Playwright keeps them across documents. */
function trackHeldInput(page: Page): void {
  const pressed = new Set<string>();
  held.set(page, pressed);
  const keyboard = page.keyboard;
  const keyDown = keyboard.down.bind(keyboard);
  const keyUp = keyboard.up.bind(keyboard);
  keyboard.down = async (key, ...rest) => {
    pressed.add(`key:${key}`);
    return keyDown(key, ...rest);
  };
  keyboard.up = async (key, ...rest) => {
    pressed.delete(`key:${key}`);
    return keyUp(key, ...rest);
  };
  const mouse = page.mouse;
  const mouseDown = mouse.down.bind(mouse);
  const mouseUp = mouse.up.bind(mouse);
  mouse.down = async (options) => {
    pressed.add(`mouse:${options?.button ?? "left"}`);
    return mouseDown(options);
  };
  mouse.up = async (options) => {
    pressed.delete(`mouse:${options?.button ?? "left"}`);
    return mouseUp(options);
  };
}

/**
 * Marks the page when a scenario calls a page method whose effect reaches the next document. A
 * paused clock, for example, stops all timers and frames on every later document in the tab.
 */
function markLastingChanges(context: BrowserContext, page: Page): void {
  const watch = (owner: object, names: string[]) => {
    const methods = owner as Record<string, (...args: unknown[]) => unknown>;
    for (const name of names) {
      const method = methods[name]!;
      methods[name] = (...args: unknown[]) => {
        marked.add(page);
        return method.apply(owner, args);
      };
    }
  };
  const shared = ["addInitScript", "exposeBinding", "exposeFunction", "route", "routeFromHAR"];
  watch(page, [
    ...shared,
    "addLocatorHandler",
    "emulateMedia",
    "routeWebSocket",
    "setDefaultNavigationTimeout",
    "setDefaultTimeout",
    "setExtraHTTPHeaders",
    "setViewportSize",
  ]);
  watch(context, [
    ...shared,
    "grantPermissions",
    "routeWebSocket",
    "setExtraHTTPHeaders",
    "setGeolocation",
    "setDefaultNavigationTimeout",
    "setDefaultTimeout",
    "setOffline",
  ]);
  // The page clock is the context clock, so one watch covers both.
  const clock = Object.getPrototypeOf(page.clock) as object;
  watch(
    page.clock,
    Object.getOwnPropertyNames(clock).filter(
      (name) =>
        name !== "constructor" &&
        typeof Object.getOwnPropertyDescriptor(clock, name)?.value === "function",
    ),
  );
}

async function lease(): Promise<Lease> {
  const reused = idle.pop();
  if (reused) return reused;
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(2000);
  markLastingChanges(context, page);
  trackHeldInput(page);
  baselines.set(
    page,
    new Map<Emitter, Map<string | symbol, number>>([
      [page, listenerCounts(page)],
      [context, listenerCounts(context)],
    ]),
  );
  return { context, page };
}

/** Clears the state that outlives a document, then keeps the page for the next scenario. */
async function giveBack({ context, page }: Lease): Promise<void> {
  if (marked.has(page) || held.get(page)?.size || hasLeftoverListeners(page)) {
    await context.close();
    return;
  }
  try {
    await page.evaluate(async () => {
      localStorage.clear();
      sessionStorage.clear();
      const databases = (await indexedDB.databases?.()) ?? [];
      await Promise.all(
        databases.map(
          ({ name }) =>
            new Promise<void>((resolve) => {
              if (!name) return resolve();
              const request = indexedDB.deleteDatabase(name);
              request.onsuccess = request.onerror = request.onblocked = () => resolve();
            }),
        ),
      );
      if (globalThis.caches) {
        for (const key of await caches.keys()) await caches.delete(key);
      }
      for (const registration of (await navigator.serviceWorker?.getRegistrations()) ?? []) {
        await registration.unregister();
      }
    });
    await page.goto("about:blank");
    // The next document must not see a hover from this scenario.
    await page.mouse.move(0, 0);
    await context.clearCookies();
    idle.push({ context, page });
  } catch {
    await context.close();
  }
}

async function open(target: Target, pageName: string): Promise<Opened> {
  const leased = await lease();
  const { page } = leased;
  const errors: string[] = [];
  const onPageError = (error: Error) => errors.push(`pageerror: ${error.message}`);
  const onConsole = (message: ConsoleMessage) => {
    // Owner warnings from a `child` snippet are defects too, so they fail the scenario.
    if (message.type() === "error" || message.text().includes("child props")) {
      errors.push(`console: ${message.text()}`);
    }
  };
  page.on("pageerror", onPageError);
  page.on("console", onConsole);
  const release = async (passed: boolean) => {
    page.off("pageerror", onPageError);
    page.off("console", onConsole);
    await (passed ? giveBack(leased) : leased.context.close());
  };
  try {
    await page.goto(pageUrl(target, pageName));
    // A cold page load on a busy CI runner can take longer than one interaction step.
    await page.waitForFunction(() => window.__cf?.ready === true, undefined, { timeout: 15000 });
    // A reused page keeps its pointer at (0, 0), and Chrome sends a hover there on a new document.
    // An element at that point would then get pointer events that the scenario did not cause.
    const corner = await page.evaluate(() => document.elementFromPoint(0, 0)?.localName ?? "none");
    if (!["html", "body", "none"].includes(corner)) {
      throw new Error(`The ${target} ${pageName} fixture puts a <${corner}> at (0, 0).`);
    }
  } catch (error) {
    await release(false);
    throw error;
  }
  const ui = new Ui(page, target, (name, capture) => astroReference(pageName, name, capture));
  return { ui, errors, release };
}

// Astro drives the Runtime directly, so its attributes are the reference for the other targets.
const astroReferences = new Map<string, Promise<unknown>>();

function astroReference(
  pageName: string,
  name: string,
  capture: (astro: Ui) => Promise<unknown>,
): Promise<unknown> {
  let reference = astroReferences.get(name);
  if (!reference) {
    reference = (async () => {
      const opened = await open("astro", pageName);
      let passed = false;
      try {
        const captured = await capture(opened.ui);
        passed = true;
        return captured;
      } finally {
        await opened.release(passed);
      }
    })();
    astroReferences.set(name, reference);
  }
  return reference;
}

async function play(target: Target, scenario: Scenario): Promise<void> {
  const opened = await open(target, scenario.page);
  let passed = false;
  try {
    await scenario.run(opened.ui);
    const allowed = allowedConsoleErrors.filter(
      (entry) => entry.targets.includes(target) && entry.scenarios.test(scenario.id),
    );
    const errors = opened.errors.filter(
      (error) => !allowed.some((entry) => entry.errors.test(String(error))),
    );
    expect(errors).toEqual([]);
    passed = true;
  } finally {
    await opened.release(passed);
  }
}

/** Plays every scenario against one target. Each target entry file calls this once. */
export function defineConformance(target: Target): void {
  beforeAll(async () => {
    // Chrome is the default. Set CONFORMANCE_BROWSER to play a scenario in another engine.
    const { CONFORMANCE_BROWSER: engine } = process.env;
    browser = await (engine === "firefox"
      ? firefox.launch()
      : engine === "webkit"
        ? webkit.launch()
        : chromium.launch({ channel: "chrome" }));
  });

  afterAll(async () => {
    await browser.close();
  });

  describe.concurrent(target, () => {
    for (const scenario of scenarios) {
      const applies = <T extends { targets: readonly Target[]; scenarios: RegExp }>(entry: T) =>
        entry.targets.includes(target) && entry.scenarios.test(scenario.id);
      const difference = intendedDifferences.find(applies);
      const defect = knownDefects.find(applies);
      if (difference) {
        it.skip(`${scenario.id} [intended difference: ${difference.name}]`, () => {});
      } else if (defect) {
        it.fails(`${scenario.id} [known defect: ${defect.name}]`, () => play(target, scenario));
      } else {
        it(scenario.id, () => play(target, scenario));
      }
    }
  });
}
