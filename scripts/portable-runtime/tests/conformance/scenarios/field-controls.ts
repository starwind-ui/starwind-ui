import { expect } from "vitest";
import type { Ui } from "../ui";
import type { Scenario } from "./types";

type Control = {
  kind: string;
  label: string;
  /** The form entry before and after the change. */
  entry: [before: string | null, after: string | null];
  /** The value that the listener and the parent see after the change. */
  changed: unknown;
  written: unknown;
  change(ui: Ui, id: string): Promise<void>;
  shows(ui: Ui, id: string, entry: string | null): Promise<void>;
};

const fruit = (value: string | null) => (value === "a" ? "Apple" : value === "b" ? "Banana" : "");
const slider = (ui: Ui, id: string) => ui.t(`${id}-root`).locator('[role="slider"]');
const pressAndType = async (ui: Ui, id: string) => {
  await ui.t(`${id}-root`).click();
  await ui.page.keyboard.press("End");
  await ui.page.keyboard.type("x");
};
const pick = async (ui: Ui, id: string) => {
  await ui.t(`${id}-trigger`).click();
  await ui.t(`${id}-item-b`).click();
};

const controls: Control[] = [
  {
    kind: "sel",
    label: "Select",
    entry: ["a", "b"],
    changed: "b",
    written: "a",
    change: pick,
    shows: (ui, id, entry) => ui.expectText(`${id}-value`, fruit(entry)),
  },
  {
    kind: "cmb",
    label: "Combobox",
    entry: ["a", "b"],
    changed: "b",
    written: "a",
    change: pick,
    shows: (ui, id, entry) => ui.expectValue(`${id}-input`, fruit(entry)),
  },
  {
    kind: "chk",
    label: "Checkbox",
    entry: [null, "yes"],
    changed: true,
    written: false,
    change: (ui, id) => ui.t(`${id}-root`).click(),
    shows: (ui, id, entry) => ui.expectAttr(`${id}-root`, "aria-checked", entry ? "true" : "false"),
  },
  {
    kind: "swi",
    label: "Switch",
    entry: [null, "yes"],
    changed: true,
    written: false,
    change: (ui, id) => ui.t(`${id}-root`).click(),
    shows: (ui, id, entry) => ui.expectAttr(`${id}-root`, "aria-checked", entry ? "true" : "false"),
  },
  {
    kind: "sld",
    label: "Slider",
    entry: ["20", "21"],
    changed: 21,
    written: 20,
    async change(ui, id) {
      await slider(ui, id).focus();
      await ui.page.keyboard.press("ArrowRight");
    },
    async shows(ui, id, entry) {
      await slider(ui, id)
        .and(ui.page.locator(`[aria-valuenow="${entry}"]`))
        .waitFor({ state: "attached" });
    },
  },
  {
    kind: "rad",
    label: "RadioGroup",
    entry: ["a", "b"],
    changed: "b",
    written: "a",
    change: (ui, id) => ui.t(`${id}-item-b`).click(),
    shows: (ui, id, entry) =>
      ui.expectAttr(`${id}-item-b`, "aria-checked", entry === "b" ? "true" : "false"),
  },
  {
    kind: "inp",
    label: "Input",
    entry: ["hello", "hellox"],
    changed: "hellox",
    written: "hello",
    change: pressAndType,
    shows: (ui, id, entry) => ui.expectValue(`${id}-root`, entry ?? ""),
  },
];

const FIELD = "f";

/** A Slider reports an array when a parent holds an array, so scenarios compare the first number. */
const single = (value: unknown) => (Array.isArray(value) ? value[0] : value);

async function changeEvents(ui: Ui, id: string): Promise<unknown[]> {
  const entries = await ui.entries(id);
  return entries.filter((entry) => entry.event === "change").map((entry) => single(entry.value));
}

async function submitted(ui: Ui, id: string): Promise<string | null> {
  await ui.t(`${id}-submit`).click();
  await ui.settle();
  const entries = await ui.page.evaluate((form) => window.__cf.submits[form] ?? [], id);
  return entries.find(([name]) => name === FIELD)?.[1] ?? null;
}

export const fieldControlScenarios: Scenario[] = [
  { style: "p", styleLabel: "Primitive" },
  { style: "s", styleLabel: "Styled" },
].flatMap(({ style, styleLabel }) =>
  controls.flatMap((control): Scenario[] => [
    {
      id: `field control, ${styleLabel} ${control.label}: uncontrolled change reaches the listener and the form`,
      page: "field-controls",
      async run(ui) {
        const id = `${style}${control.kind}-u`;
        const [before, after] = control.entry;
        await ui.expectFormEntry(id, FIELD, before);
        await control.shows(ui, id, before);
        await control.change(ui, id);
        await ui.settle();
        expect(await changeEvents(ui, id)).toEqual([control.changed]);
        await ui.expectFormEntry(id, FIELD, after);
        await control.shows(ui, id, after);
        expect(await submitted(ui, id)).toBe(after);
        await ui.resetForm(id);
        await ui.expectFormEntry(id, FIELD, before);
        await control.shows(ui, id, before);
      },
    },
    {
      id: `field control, ${styleLabel} ${control.label}, parent-held: the parent owns the value`,
      page: "field-controls",
      async run(ui) {
        const id = `${style}${control.kind}-h`;
        const [before, after] = control.entry;
        await ui.expectFormEntry(id, FIELD, before);
        await control.shows(ui, id, before);

        // A refused change holds the value on the screen, in the form, and in the parent.
        await ui.refuse(id);
        const held = await ui.parentValue(id);
        await control.change(ui, id);
        await ui.settle();
        expect(await changeEvents(ui, id)).toEqual([control.changed]);
        expect(await ui.parentValue(id)).toEqual(held);
        await ui.expectFormEntry(id, FIELD, before);
        await control.shows(ui, id, before);
        await ui.refuse(id, false);
        await ui.clearEvents();

        // An accepted change reaches the parent once.
        await control.change(ui, id);
        await ui.settle();
        expect(await changeEvents(ui, id)).toEqual([control.changed]);
        expect(single(await ui.parentValue(id))).toEqual(control.changed);
        await ui.expectFormEntry(id, FIELD, after);
        await control.shows(ui, id, after);
        expect(await submitted(ui, id)).toBe(after);

        // A native reset leaves a value that the parent owns.
        await ui.resetForm(id);
        await ui.expectFormEntry(id, FIELD, after);
        await control.shows(ui, id, after);

        // A parent write is silent.
        await ui.clearEvents();
        await ui.parentWrite(id, control.written);
        await ui.settle();
        await ui.expectFormEntry(id, FIELD, before);
        await control.shows(ui, id, before);
        expect(await changeEvents(ui, id)).toEqual([]);
      },
    },
  ]),
);

fieldControlScenarios.push({
  id: "parent-held combobox with spread props, no Field: a parent write after a pick moves the text",
  page: "field-controls",
  async run(ui) {
    await pick(ui, "pcmb-n");
    await ui.expectValue("pcmb-n-input", "Banana");
    await ui.parentWrite("pcmb-n", "a");
    await ui.expectValue("pcmb-n-input", "Apple");
  },
});
