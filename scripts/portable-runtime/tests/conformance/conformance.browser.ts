// One scenario definition plays against all four targets in Chromium. Each target renders the same
// test ids from its own small fixture under `fixtures/`. `differences.ts` names every expected
// difference and every known defect, so a new difference fails the suite until someone names it.
import { type Browser, chromium, firefox, type Page, webkit } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { intendedDifferences, knownDefects } from "./differences";
import { attributeScenarios } from "./scenarios/attributes";
import { eventScenarios, parentScenarios } from "./scenarios/events";
import { fieldControlScenarios } from "./scenarios/field-controls";
import { formScenarios } from "./scenarios/form";
import { interactionScenarios } from "./scenarios/interaction";
import { triggerScenarios } from "./scenarios/triggers";
import type { Scenario } from "./scenarios/types";
import { TARGETS, type Target, Ui } from "./ui";

const scenarios: Scenario[] = [
  ...eventScenarios,
  ...parentScenarios,
  ...formScenarios,
  ...fieldControlScenarios,
  ...interactionScenarios,
  ...triggerScenarios,
  ...attributeScenarios,
];

function pageUrl(target: Target, page: string): string {
  const base = inject("conformanceBaseUrl");
  return target === "astro" ? `${base}/astro/${page}/` : `${base}/${target}.html?page=${page}`;
}

let browser: Browser;

beforeAll(async () => {
  // Chromium is the default. Set CONFORMANCE_BROWSER to play a scenario in another engine.
  const { CONFORMANCE_BROWSER: engine } = process.env;
  browser = await (
    engine === "firefox" ? firefox : engine === "webkit" ? webkit : chromium
  ).launch();
});

afterAll(async () => {
  await browser.close();
});

type Opened = { ui: Ui; errors: string[]; close(): Promise<void> };

async function open(target: Target, pageName: string): Promise<Opened> {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page: Page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    // Owner warnings from a `child` snippet are defects too, so they fail the scenario.
    if (message.type() === "error" || message.text().includes("child props")) {
      errors.push(`console: ${message.text()}`);
    }
  });
  page.setDefaultTimeout(2000);
  await page.goto(pageUrl(target, pageName));
  // A cold page load on a busy CI runner can take longer than one interaction step.
  await page.waitForFunction(() => window.__cf?.ready === true, undefined, { timeout: 15000 });
  const ui = new Ui(page, target, (name, capture) => astroReference(pageName, name, capture));
  return { ui, errors, close: () => context.close() };
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
      try {
        return await capture(opened.ui);
      } finally {
        await opened.close();
      }
    })();
    astroReferences.set(name, reference);
  }
  return reference;
}

async function play(target: Target, scenario: Scenario): Promise<void> {
  const opened = await open(target, scenario.page);
  try {
    await scenario.run(opened.ui);
    expect(opened.errors).toEqual([]);
  } finally {
    await opened.close();
  }
}

for (const target of TARGETS) {
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
