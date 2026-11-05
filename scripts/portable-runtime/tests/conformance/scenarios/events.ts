import { expect } from "vitest";
import type { Ui } from "../ui";
import type { Scenario } from "./types";

async function openCombobox(ui: Ui, id: string): Promise<void> {
  await ui.t(`${id}-trigger`).click();
  await ui.expectVisible(`${id}-popup`);
  await ui.clearEvents();
}

async function pickCombobox(ui: Ui, id: string): Promise<void> {
  await openCombobox(ui, id);
  await ui.t(`${id}-item-a`).click();
  await ui.expectVisible(`${id}-popup`, false);
  await ui.clearEvents();
}

const comboboxTextModes = [
  { id: "cu", mode: "uncontrolled text" },
  { id: "cc", mode: "parent text" },
];

export const eventScenarios: Scenario[] = [
  ...comboboxTextModes.flatMap(({ id, mode }): Scenario[] => [
    {
      id: `combobox item press order, ${mode}`,
      page: "events",
      async run(ui) {
        await openCombobox(ui, id);
        await ui.t(`${id}-item-a`).click();
        await ui.expectChanges(id, [
          ["value", "a", "item-press"],
          ["input", "Apple", "item-press"],
          ["open", false, "item-press"],
        ]);
        await ui.expectValue(`${id}-input`, "Apple");
        await ui.expectModelWrites(id, "input", ["Apple"]);
        await ui.expectFields(id, "value", [
          "cancel",
          "event",
          "item",
          "previousValue",
          "reason",
          "value",
        ]);
        await ui.expectFields(id, "input", [
          "cancel",
          "event",
          "inputValue",
          "previousInputValue",
          "reason",
        ]);
        await ui.expectFields(id, "open", ["cancel", "event", "open", "previousOpen", "reason"]);
        await ui.expectPrevious(id, "value", null);
        await ui.expectPrevious(id, "input", "");
        await ui.expectPrevious(id, "open", true);
      },
    },
    {
      id: `combobox clear order, ${mode}`,
      page: "events",
      async run(ui) {
        await pickCombobox(ui, id);
        await ui.t(`${id}-clear`).click();
        await ui.expectChanges(id, [
          ["value", null, "clear"],
          ["input", "", "clear"],
        ]);
        await ui.expectValue(`${id}-input`, "");
        await ui.expectModelWrites(id, "input", [""]);
      },
    },
    {
      id: `combobox item press with canceled input, ${mode}`,
      page: "events",
      async run(ui) {
        await openCombobox(ui, id);
        await ui.cancel(id, "input");
        await ui.t(`${id}-item-a`).click();
        await ui.expectChanges(id, [
          ["value", "a", "item-press"],
          ["input", "Apple", "item-press"],
          ["open", false, "item-press"],
        ]);
        await ui.expectValue(`${id}-input`, "");
        await ui.expectModelWrites(id, "input", []);
      },
    },
    {
      id: `combobox clear with canceled input, ${mode}`,
      page: "events",
      async run(ui) {
        await pickCombobox(ui, id);
        await ui.cancel(id, "input");
        await ui.t(`${id}-clear`).click();
        await ui.expectChanges(id, [
          ["value", null, "clear"],
          ["input", "", "clear"],
        ]);
        await ui.expectValue(`${id}-input`, "Apple");
      },
    },
    {
      id: `combobox typing with canceled input, ${mode}`,
      page: "events",
      async run(ui) {
        await openCombobox(ui, id);
        await ui.cancel(id, "input");
        await ui.t(`${id}-input`).click();
        await ui.clearEvents();
        await ui.page.keyboard.type("x");
        await ui.expectChanges(id, [["input", "x", "input"]]);
        await ui.expectValue(`${id}-input`, "");
      },
    },
    {
      id: `combobox canceled value holds, ${mode}`,
      page: "events",
      async run(ui) {
        await openCombobox(ui, id);
        await ui.cancel(id, "value");
        await ui.t(`${id}-item-a`).click();
        await ui.expectChanges(id, [["value", "a", "item-press"]]);
        await ui.expectValue(`${id}-input`, "");
        await ui.expectVisible(`${id}-popup`);
      },
    },
    {
      id: `combobox canceled close keeps the popup open, ${mode}`,
      page: "events",
      async run(ui) {
        await openCombobox(ui, id);
        await ui.cancel(id, "open");
        await ui.t(`${id}-item-a`).click();
        await ui.expectChanges(id, [
          ["value", "a", "item-press"],
          ["input", "Apple", "item-press"],
          ["open", false, "item-press"],
        ]);
        await ui.expectVisible(`${id}-popup`);
      },
    },
  ]),
  {
    id: "combobox closes when focus leaves it",
    page: "events",
    async run(ui) {
      await ui.t("cu-input").click();
      await ui.page.keyboard.type("a");
      await ui.expectVisible("cu-popup");
      await ui.page.keyboard.press("Shift+Tab");
      await ui.expectFocus("outside");
      await ui.expectVisible("cu-popup", false);
    },
  },
  {
    id: "combobox stays open through its trigger and clear button, then closes when Tab leaves",
    page: "events",
    async run(ui) {
      await ui.t("cu-input").click();
      await ui.page.keyboard.type("a");
      await ui.expectVisible("cu-popup");
      await ui.page.keyboard.press("Tab");
      await ui.expectFocus("cu-trigger");
      await ui.expectVisible("cu-popup");
      await ui.page.keyboard.press("Tab");
      await ui.expectFocus("cu-clear");
      await ui.expectVisible("cu-popup");
      await ui.page.keyboard.press("Tab");
      await ui.expectVisible("cu-popup", false);
    },
  },
  {
    id: "dialog open and close order with payload",
    page: "events",
    async run(ui) {
      await ui.t("du-trigger").click();
      await ui.expectChanges("du", [["open", true, "trigger-press"]]);
      await ui.expectFields("du", "open", [
        "cancel",
        "event",
        "open",
        "previousOpen",
        "reason",
        "trigger",
      ]);
      await ui.expectPrevious("du", "open", false);
      await ui.expectVisible("du-popup");
      await ui.clearEvents();
      await ui.t("du-close").click();
      await ui.expectChanges("du", [["open", false, "close-press"]]);
      await ui.expectVisible("du-popup", false);
    },
  },
  {
    id: "dialog Escape closes with its reason",
    page: "events",
    async run(ui) {
      await ui.t("du-trigger").click();
      await ui.expectVisible("du-popup");
      await ui.clearEvents();
      await ui.page.keyboard.press("Escape");
      await ui.expectChanges("du", [["open", false, "escape-key"]]);
      await ui.expectVisible("du-popup", false);
    },
  },
  {
    id: "dialog canceled open and close hold",
    page: "events",
    async run(ui) {
      await ui.cancel("du", "open");
      await ui.t("du-trigger").click();
      await ui.expectChanges("du", [["open", true, "trigger-press"]]);
      await ui.expectVisible("du-popup", false);
      await ui.page.evaluate(() => {
        window.__cf.cancel = {};
      });
      await ui.t("du-trigger").click();
      await ui.expectVisible("du-popup");
      await ui.clearEvents();
      await ui.cancel("du", "open");
      await ui.page.keyboard.press("Escape");
      await ui.expectChanges("du", [["open", false, "escape-key"]]);
      await ui.expectVisible("du-popup");
    },
  },
  {
    id: "select open, pick, and close order with payload",
    page: "events",
    async run(ui) {
      await ui.t("su-trigger").click();
      await ui.expectChanges("su", [["open", true, "trigger-press"]]);
      await ui.expectVisible("su-popup");
      await ui.clearEvents();
      await ui.t("su-item-b").click();
      await ui.expectChanges("su", [
        ["value", "b", "item-press"],
        ["open", false, "item-press"],
      ]);
      await ui.expectFields("su", "value", [
        "cancel",
        "event",
        "item",
        "previousValue",
        "reason",
        "value",
      ]);
      await ui.expectPrevious("su", "value", null);
      await ui.expectText("su-value", "Banana");
    },
  },
  {
    id: "select shows the picked label when a child component holds the items",
    page: "events",
    async run(ui) {
      await ui.t("sw-trigger").click();
      await ui.expectVisible("sw-popup");
      await ui.t("sw-item-b").click();
      await ui.expectChanges("sw", [["value", "b", "item-press"]]);
      await ui.expectText("sw-value", "Banana");
    },
  },
  {
    id: "select canceled value holds",
    page: "events",
    async run(ui) {
      await ui.t("su-trigger").click();
      await ui.expectVisible("su-popup");
      await ui.clearEvents();
      await ui.cancel("su", "value");
      await ui.t("su-item-b").click();
      await ui.expectChanges("su", [["value", "b", "item-press"]]);
      await ui.expectText("su-value", "Pick");
    },
  },
  {
    id: "tabs change order with payload",
    page: "events",
    async run(ui) {
      await ui.t("tu-tab-two").click();
      await ui.expectChanges("tu", [["value", "two"]]);
      await ui.expectFields("tu", "value", [
        "activationDirection",
        "event",
        "previousValue",
        "reason",
        "trigger",
        "value",
      ]);
      await ui.expectPrevious("tu", "value", "one");
      await ui.expectAttr("tu-tab-two", "aria-selected", "true");
      await ui.expectVisible("tu-panel-two");
    },
  },
  {
    id: "tabs canceled change holds",
    page: "events",
    async run(ui) {
      await ui.cancel("tu", "value");
      await ui.t("tu-tab-two").click();
      await ui.expectChanges("tu", [["value", "two"]]);
      await ui.expectAttr("tu-tab-one", "aria-selected", "true");
      await ui.expectVisible("tu-panel-one");
    },
  },
  {
    id: "checkbox change order with payload",
    page: "events",
    async run(ui) {
      await ui.t("ku-root").click();
      await ui.expectChanges("ku", [["checked", true]]);
      await ui.expectFields("ku", "checked", [
        "checked",
        "event",
        "previousChecked",
        "reason",
        "trigger",
      ]);
      await ui.expectPrevious("ku", "checked", false);
      await ui.expectAttr("ku-root", "aria-checked", "true");
    },
  },
  {
    id: "checkbox canceled change holds",
    page: "events",
    async run(ui) {
      await ui.cancel("ku", "checked");
      await ui.t("ku-root").click();
      await ui.expectChanges("ku", [["checked", true]]);
      await ui.expectAttr("ku-root", "aria-checked", "false");
    },
  },
];

async function holdsThenWrites(
  ui: Ui,
  options: {
    id: string;
    act(): Promise<void>;
    held(): Promise<void>;
    written: unknown;
    applied(): Promise<void>;
    event: string;
  },
): Promise<void> {
  await ui.clearEvents();
  await ui.refuse(options.id);
  const before = await ui.parentValue(options.id);
  await options.act();
  await ui.settle();
  expect(await ui.parentValue(options.id)).toEqual(before);
  await options.held();
  await ui.refuse(options.id, false);
  await ui.clearEvents();
  await ui.parentWrite(options.id, options.written);
  await options.applied();
  // A parent write is silent. It must not publish a change back to the parent.
  expect((await ui.changes(options.id)).filter(([event]) => event === options.event)).toEqual([]);
}

export const parentScenarios: Scenario[] = [
  {
    id: "parent-held dialog: refused change holds, parent write applies",
    page: "events",
    run: (ui) =>
      holdsThenWrites(ui, {
        id: "dp",
        event: "open",
        act: () => ui.t("dp-trigger").click(),
        held: () => ui.expectVisible("dp-popup", false),
        written: true,
        applied: () => ui.expectVisible("dp-popup"),
      }),
  },
  {
    id: "parent-held select: refused change holds, parent write applies",
    page: "events",
    run: (ui) =>
      holdsThenWrites(ui, {
        id: "sp",
        event: "value",
        act: async () => {
          await ui.t("sp-trigger").click();
          await ui.expectVisible("sp-popup");
          await ui.t("sp-item-b").click();
        },
        held: () => ui.expectText("sp-value", "Apple"),
        written: "b",
        applied: () => ui.expectText("sp-value", "Banana"),
      }),
  },
  {
    id: "parent-held tabs: refused change holds, parent write applies",
    page: "events",
    run: (ui) =>
      holdsThenWrites(ui, {
        id: "tp",
        event: "value",
        act: () => ui.t("tp-tab-two").click(),
        held: () => ui.expectAttr("tp-tab-one", "aria-selected", "true"),
        written: "two",
        applied: () => ui.expectAttr("tp-tab-two", "aria-selected", "true"),
      }),
  },
  {
    id: "parent-held checkbox: refused change holds, parent write applies",
    page: "events",
    run: (ui) =>
      holdsThenWrites(ui, {
        id: "kp",
        event: "checked",
        act: () => ui.t("kp-root").click(),
        held: () => ui.expectAttr("kp-root", "aria-checked", "false"),
        written: true,
        applied: () => ui.expectAttr("kp-root", "aria-checked", "true"),
      }),
  },
  {
    id: "parent-held switch: refused change holds, parent write applies",
    page: "events",
    run: (ui) =>
      holdsThenWrites(ui, {
        id: "wp",
        event: "checked",
        act: () => ui.t("wp-root").click(),
        held: () => ui.expectAttr("wp-root", "aria-checked", "false"),
        written: true,
        applied: () => ui.expectAttr("wp-root", "aria-checked", "true"),
      }),
  },
  {
    id: "parent-held input: refused change holds, parent write applies",
    page: "events",
    run: (ui) =>
      holdsThenWrites(ui, {
        id: "ip",
        event: "value",
        act: async () => {
          await ui.t("ip-root").click();
          await ui.page.keyboard.type("x");
        },
        held: () => ui.expectValue("ip-root", "hello"),
        written: "written",
        applied: () => ui.expectValue("ip-root", "written"),
      }),
  },
  {
    id: "parent-held combobox: refused pick holds the value, parent write applies",
    page: "events",
    run: (ui) =>
      holdsThenWrites(ui, {
        id: "cv",
        event: "value",
        act: async () => {
          await ui.t("cv-trigger").click();
          await ui.expectVisible("cv-popup");
          await ui.t("cv-item-a").click();
        },
        held: () => ui.expectAttr("cv-root", "data-value", null),
        written: "b",
        applied: () => ui.expectValue("cv-input", "Banana"),
      }),
  },
  {
    id: "parent-held combobox shows the written label when a child component holds the items",
    page: "events",
    async run(ui) {
      await ui.parentWrite("cw", "b");
      await ui.expectValue("cw-input", "Banana");
      await ui.expectAttr("cw-root", "data-value", "b");
    },
  },
  {
    id: "parent-held combobox names a written value after the popup has opened once",
    page: "events",
    async run(ui) {
      await ui.t("cw-trigger").click();
      await ui.expectVisible("cw-popup");
      await ui.page.keyboard.press("Escape");
      await ui.expectVisible("cw-popup", false);
      await ui.settle();
      await ui.parentWrite("cw", "b");
      await ui.expectValue("cw-input", "Banana");
      await ui.expectAttr("cw-root", "data-value", "b");
    },
  },
  {
    id: "parent-held select names a written value after the popup has opened once",
    page: "events",
    async run(ui) {
      await ui.t("sp-trigger").click();
      await ui.expectVisible("sp-popup");
      await ui.page.keyboard.press("Escape");
      await ui.expectVisible("sp-popup", false);
      await ui.settle();
      await ui.parentWrite("sp", "b");
      await ui.expectText("sp-value", "Banana");
      await ui.expectAttr("sp-root", "data-value", "b");
    },
  },
  {
    id: "parent-held combobox: refused pick keeps the text empty",
    page: "events",
    async run(ui) {
      await ui.refuse("cv");
      await ui.t("cv-trigger").click();
      await ui.expectVisible("cv-popup");
      await ui.t("cv-item-a").click();
      await ui.settle();
      await ui.expectValue("cv-input", "");
    },
  },
];
