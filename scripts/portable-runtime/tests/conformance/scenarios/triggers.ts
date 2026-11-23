import { expect } from "vitest";
import type { Ui } from "../ui";
import type { Scenario } from "./types";

async function togglesPopup(ui: Ui, trigger: string, popup: string): Promise<void> {
  await ui.t(trigger).click();
  await ui.expectVisible(popup);
  await ui.expectFocus("ct-input");
  await ui.t(trigger).click();
  await ui.expectVisible(popup, false);
  await ui.expectFocus("ct-input");
  await ui.t(trigger).click();
  await ui.expectVisible(popup);
  await ui.t(trigger).click();
  await ui.expectVisible(popup, false);
}

const comboboxTriggers: Scenario[] = [
  { label: "a trigger beside ComboboxInput", trigger: "ct-authored" },
  { label: "a trigger outside the input group", trigger: "ct-outer" },
].map(({ label, trigger }) => ({
  id: `combobox ${label}: a second press closes the popup`,
  page: "triggers",
  run: (ui) => togglesPopup(ui, trigger, "ct-popup"),
}));

async function refTag(ui: Ui, id: string): Promise<unknown> {
  return ui.page.evaluate((name) => window.__cf.parents[name]?.read(), id);
}

const linkTriggers: Scenario[] = [
  {
    id: "link child popover trigger: opens with no owner warning",
    page: "triggers",
    async run(ui) {
      expect(await ui.t("lp-trigger").evaluate((node) => node.tagName)).toBe("A");
      await ui.t("lp-trigger").click();
      await ui.expectVisible("lp-popup");
    },
  },
  {
    id: "link child tooltip trigger: opens with no owner warning",
    page: "triggers",
    async run(ui) {
      expect(await ui.t("lt-trigger").evaluate((node) => node.tagName)).toBe("A");
      await ui.t("lt-trigger").hover();
      await ui.expectVisible("lt-popup");
    },
  },
  {
    id: "link child navigation menu trigger: opens with no owner warning",
    page: "triggers",
    async run(ui) {
      expect(await ui.t("ln-trigger").evaluate((node) => node.tagName)).toBe("A");
      await ui.t("ln-trigger").click();
      await ui.expectVisible("ln-content");
    },
  },
  {
    id: "link child ref: each trigger ref receives the link",
    page: "triggers",
    async run(ui) {
      for (const id of ["lp-ref", "lt-ref", "ln-ref"]) {
        expect(await refTag(ui, id)).toBe("A");
      }
    },
  },
];

// The Runtime keeps a hover-opened panel open for a mouse press that starts within 500 ms of the
// open. A busy machine can take longer than that between two harness steps, so these scenarios stop
// the page clock and move it by exact amounts.
const NAV_OPEN_DELAY_MS = 50;
const NAV_HOVER_PRESS_WINDOW_MS = 500;

/** Stops page time, then hovers the trigger and runs the open delay. Page time is then the open time. */
async function hoverOpenWithPausedClock(ui: Ui): Promise<void> {
  await ui.page.clock.install();
  // A far target, so a slow call cannot land after it. No fixture reads the absolute time.
  await ui.page.clock.pauseAt(Date.now() + 3_600_000);
  await ui.t("ln-trigger").hover();
  await ui.page.clock.runFor(NAV_OPEN_DELAY_MS);
  await ui.expectVisible("ln-content");
}

const navigationPresses: Scenario[] = [
  {
    id: "navigation menu trigger: a press soon after hover keeps the panel, the next press closes",
    page: "triggers",
    async run(ui) {
      await hoverOpenWithPausedClock(ui);
      await ui.page.clock.runFor(NAV_HOVER_PRESS_WINDOW_MS - 50);
      await ui.t("ln-trigger").click();
      await ui.page.clock.runFor(32);
      await ui.expectVisible("ln-content");
      // Keep the clock paused. If the first press failed to end the window, a slow second press
      // could otherwise land after it and close the panel for the wrong reason.
      await ui.t("ln-trigger").click();
      await ui.page.clock.runFor(32);
      await ui.expectVisible("ln-content", false);
    },
  },
  {
    id: "navigation menu trigger: a later press after hover closes the panel",
    page: "triggers",
    async run(ui) {
      await hoverOpenWithPausedClock(ui);
      await ui.page.clock.runFor(NAV_HOVER_PRESS_WINDOW_MS + 50);
      await ui.expectVisible("ln-content");
      await ui.t("ln-trigger").click();
      await ui.page.clock.runFor(32);
      await ui.expectVisible("ln-content", false);
    },
  },
  {
    id: "navigation menu trigger: the keyboard toggles the panel right after hover",
    page: "triggers",
    async run(ui) {
      await ui.t("ln-trigger").hover();
      await ui.expectVisible("ln-content");
      await ui.t("ln-trigger").focus();
      await ui.page.keyboard.press("Enter");
      await ui.expectVisible("ln-content", false);
    },
  },
];

export const triggerScenarios: Scenario[] = [
  ...comboboxTriggers,
  ...linkTriggers,
  ...navigationPresses,
];
