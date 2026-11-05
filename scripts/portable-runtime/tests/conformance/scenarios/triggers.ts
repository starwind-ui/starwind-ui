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

const navigationPresses: Scenario[] = [
  {
    id: "navigation menu trigger: a press soon after hover keeps the panel, the next press closes",
    page: "triggers",
    async run(ui) {
      await ui.t("ln-trigger").hover();
      await ui.expectVisible("ln-content");
      await ui.t("ln-trigger").click();
      await ui.settle();
      await ui.expectVisible("ln-content");
      await ui.t("ln-trigger").click();
      await ui.expectVisible("ln-content", false);
    },
  },
  {
    id: "navigation menu trigger: a later press after hover closes the panel",
    page: "triggers",
    async run(ui) {
      await ui.t("ln-trigger").hover();
      await ui.expectVisible("ln-content");
      await ui.page.waitForTimeout(700);
      await ui.expectVisible("ln-content");
      await ui.t("ln-trigger").click();
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
