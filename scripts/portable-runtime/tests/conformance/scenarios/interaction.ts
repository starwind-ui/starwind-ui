import { expect } from "vitest";
import type { Ui } from "../ui";
import type { Scenario } from "./types";

type Layer = { label: string; prefix: string };
const layers: Layer[] = [
  { label: "primitive", prefix: "p" },
  { label: "styled", prefix: "s" },
];

function pressMovesFocus(ui: Ui, key: string, from: string, to: string) {
  return (async () => {
    await ui.t(from).focus();
    await ui.page.keyboard.press(key);
    await ui.expectFocus(to);
  })();
}

const keyboard: Scenario[] = layers.flatMap(({ label, prefix }): Scenario[] => [
  {
    id: `keyboard ${label} tabs: arrow keys loop at both ends`,
    page: "keyboard",
    async run(ui) {
      const tab = (name: string) => `${prefix}t-tab-${name}`;
      await ui.t(tab("three")).click();
      await pressMovesFocus(ui, "ArrowRight", tab("three"), tab("one"));
      await pressMovesFocus(ui, "ArrowLeft", tab("one"), tab("three"));
      await pressMovesFocus(ui, "ArrowLeft", tab("three"), tab("two"));
    },
  },
  {
    id: `keyboard ${label} toggle group: arrow keys loop at both ends`,
    page: "keyboard",
    async run(ui) {
      const item = (name: string) => `${prefix}g-${name}`;
      await pressMovesFocus(ui, "ArrowRight", item("c"), item("a"));
      await pressMovesFocus(ui, "ArrowLeft", item("a"), item("c"));
      await pressMovesFocus(ui, "ArrowLeft", item("c"), item("b"));
    },
  },
  {
    id: `keyboard ${label} dialog: focus returns to the trigger`,
    page: "keyboard",
    async run(ui) {
      const id = `${prefix}d`;
      await ui.t(`${id}-trigger`).click();
      await ui.expectVisible(`${id}-popup`);
      await ui.page.keyboard.press("Escape");
      await ui.expectVisible(`${id}-popup`, false);
      await ui.expectFocus(`${id}-trigger`);
    },
  },
  {
    id: `keyboard ${label} menu: focus returns to the trigger`,
    page: "keyboard",
    async run(ui) {
      const id = `${prefix}m`;
      await ui.t(`${id}-trigger`).click();
      await ui.expectVisible(`${id}-popup`);
      await ui.page.keyboard.press("Escape");
      await ui.expectVisible(`${id}-popup`, false);
      await ui.expectFocus(`${id}-trigger`);
    },
  },
  {
    id: `keyboard ${label} input: mid-text typing keeps the caret`,
    page: "keyboard",
    async run(ui) {
      const id = `${prefix}i`;
      await ui.t(id).click();
      await ui.page.keyboard.press("Home");
      await ui.page.keyboard.press("ArrowRight");
      await ui.page.keyboard.press("ArrowRight");
      await ui.page.keyboard.type("XY");
      await ui.expectValue(id, "heXYllo");
    },
  },
  {
    id: `keyboard ${label} input: parent-held mid-text typing keeps the caret`,
    page: "keyboard",
    async run(ui) {
      const id = `${prefix}h`;
      await ui.t(id).click();
      await ui.page.keyboard.press("Home");
      await ui.page.keyboard.press("ArrowRight");
      await ui.page.keyboard.press("ArrowRight");
      await ui.page.keyboard.type("XY");
      await ui.expectValue(id, "heXYllo");
    },
  },
]);

const childKinds = [
  { kind: "native child", suffix: "n" },
  { kind: "component child", suffix: "c" },
];

async function stateOf(ui: Ui, id: string, owner: string): Promise<string | null> {
  return ui.t(id).evaluate((element, selector) => {
    return element.closest(selector)?.getAttribute("data-state") ?? null;
  }, owner);
}

const asChild: Scenario[] = childKinds.flatMap(({ kind, suffix }): Scenario[] => [
  ...layers.map(
    ({ label, prefix }): Scenario => ({
      id: `asChild ${label} dialog trigger and close with a ${kind}`,
      page: "composition",
      async run(ui) {
        const id = `${prefix}${suffix}`;
        expect(await ui.t(`${id}-trigger`).evaluate((node) => node.tagName)).toBe("BUTTON");
        // A child takes the part's role, so it never nests inside another button.
        expect(
          await ui
            .t(`${id}-trigger`)
            .evaluate((node) => Boolean(node.parentElement?.closest("button"))),
        ).toBe(false);
        expect(await stateOf(ui, `${id}-trigger`, "[data-sw-dialog-trigger]")).toBe("closed");
        await ui.t(`${id}-trigger`).click();
        await ui.expectVisible(`${id}-popup`);
        expect(await stateOf(ui, `${id}-trigger`, "[data-sw-dialog-trigger]")).toBe("open");
        expect(
          await ui
            .t(`${id}-close`)
            .evaluate((node) => Boolean(node.closest("[data-sw-dialog-close]"))),
        ).toBe(true);
        await ui.t(`${id}-close`).click();
        await ui.expectVisible(`${id}-popup`, false);
        await ui.expectFocus(`${id}-trigger`);
      },
    }),
  ),
  {
    id: `asChild primitive select trigger with a ${kind}`,
    page: "composition",
    async run(ui) {
      const id = `e${suffix}`;
      await ui.t(`${id}-trigger`).click();
      await ui.expectVisible(`${id}-popup`);
    },
  },
]);

const tooltipLayers = [
  { label: "primitive", prefix: "t" },
  { label: "styled", prefix: "u" },
];
const tooltipKinds = [
  { kind: "a button", id: "b" },
  { kind: "a link", id: "l" },
  { kind: "text", id: "t" },
];

const tooltip: Scenario[] = tooltipLayers.flatMap(({ label, prefix }) =>
  tooltipKinds.map(
    ({ kind, id }): Scenario => ({
      id: `tooltip ${label} on ${kind}: opens on hover with no disabled marks`,
      page: "composition",
      async run(ui) {
        const trigger = `${prefix}${id}-trigger`;
        for (const name of ["disabled", "data-disabled", "data-trigger-disabled"]) {
          await ui.expectAttr(trigger, name, null);
        }
        await ui.t(trigger).hover();
        await ui.expectVisible(`${prefix}${id}-popup`);
        expect(await stateOf(ui, trigger, "[data-sw-tooltip-trigger]")).toBe("open");
        await ui.page.mouse.move(0, 0);
        await ui.expectVisible(`${prefix}${id}-popup`, false);
      },
    }),
  ),
);

export const interactionScenarios: Scenario[] = [...keyboard, ...asChild, ...tooltip];
