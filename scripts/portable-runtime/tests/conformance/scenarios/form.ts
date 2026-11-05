import { expect } from "vitest";
import type { Ui } from "../ui";
import type { Scenario } from "./types";

type Control = {
  name: string;
  field: string;
  initial: string | null;
  changed: string | null;
  change(ui: Ui, form: string): Promise<void>;
  /** The visible state must agree with the form value. */
  shows(ui: Ui, form: string, entry: string | null): Promise<void>;
};

const fruit = (value: string | null) => (value === "a" ? "Apple" : value === "b" ? "Banana" : "");

const controls: Control[] = [
  {
    name: "select",
    field: "sel",
    initial: "a",
    changed: "b",
    async change(ui, form) {
      await ui.t(`${form}-sel-trigger`).click();
      await ui.t(`${form}-sel-item-b`).click();
    },
    shows: (ui, form, entry) => ui.expectText(`${form}-sel-value`, fruit(entry)),
  },
  {
    name: "combobox",
    field: "cmb",
    initial: "a",
    changed: "b",
    async change(ui, form) {
      await ui.t(`${form}-cmb-trigger`).click();
      await ui.t(`${form}-cmb-item-b`).click();
    },
    shows: (ui, form, entry) => ui.expectValue(`${form}-cmb-input`, fruit(entry)),
  },
  {
    name: "checkbox",
    field: "chk",
    initial: null,
    changed: "yes",
    change: (ui, form) => ui.t(`${form}-chk`).click(),
    shows: (ui, form, entry) =>
      ui.expectAttr(`${form}-chk`, "aria-checked", entry ? "true" : "false"),
  },
  {
    name: "switch",
    field: "swi",
    initial: null,
    changed: "yes",
    change: (ui, form) => ui.t(`${form}-swi`).click(),
    shows: (ui, form, entry) =>
      ui.expectAttr(`${form}-swi`, "aria-checked", entry ? "true" : "false"),
  },
  {
    name: "slider",
    field: "sld",
    initial: "20",
    changed: "21",
    async change(ui, form) {
      await ui.t(`${form}-sld-thumb`).focus();
      await ui.page.keyboard.press("ArrowRight");
    },
    shows: (ui, form, entry) => ui.expectAttr(`${form}-sld-thumb`, "aria-valuenow", entry),
  },
  {
    name: "input",
    field: "inp",
    initial: "hello",
    changed: "hellox",
    async change(ui, form) {
      await ui.t(`${form}-inp`).click();
      await ui.page.keyboard.press("End");
      await ui.page.keyboard.type("x");
    },
    shows: (ui, form, entry) => ui.expectValue(`${form}-inp`, entry ?? ""),
  },
  {
    name: "textarea with initial text",
    field: "txt",
    initial: "notes",
    changed: "notesx",
    async change(ui, form) {
      await ui.t(`${form}-txt`).click();
      await ui.page.keyboard.press("End");
      await ui.page.keyboard.type("x");
    },
    shows: (ui, form, entry) => ui.expectValue(`${form}-txt`, entry ?? ""),
  },
  {
    name: "textarea with no initial text",
    field: "txe",
    initial: "",
    changed: "x",
    async change(ui, form) {
      await ui.t(`${form}-txe`).click();
      await ui.page.keyboard.type("x");
    },
    shows: (ui, form, entry) => ui.expectValue(`${form}-txe`, entry ?? ""),
  },
];

async function submitted(ui: Ui, form: string, field: string): Promise<string | null> {
  await ui.t(`${form}-submit`).click();
  await ui.settle();
  const entries = await ui.page.evaluate((id) => window.__cf.submits[id] ?? [], form);
  return entries.find(([name]) => name === field)?.[1] ?? null;
}

type DefaultedControl = {
  name: string;
  field: string;
  changed: string | null;
  change(ui: Ui): Promise<void>;
  shows(ui: Ui, entry: string | null): Promise<void>;
};

const typesInto = (id: string) => async (ui: Ui) => {
  await ui.t(id).click();
  await ui.page.keyboard.press("End");
  await ui.page.keyboard.type("x");
};

const defaultedControls: DefaultedControl[] = [
  {
    name: "select",
    field: "sel",
    changed: "b",
    async change(ui) {
      await ui.t("fd-sel-trigger").click();
      await ui.t("fd-sel-item-b").click();
    },
    shows: (ui, entry) => ui.expectText("fd-sel-value", fruit(entry)),
  },
  {
    name: "combobox",
    field: "cmb",
    changed: "b",
    async change(ui) {
      await ui.t("fd-cmb-trigger").click();
      await ui.t("fd-cmb-item-b").click();
    },
    shows: (ui, entry) => ui.expectValue("fd-cmb-input", fruit(entry)),
  },
  {
    name: "checkbox",
    field: "chk",
    changed: null,
    change: (ui) => ui.t("fd-chk").click(),
    shows: (ui, entry) => ui.expectAttr("fd-chk", "aria-checked", entry ? "true" : "false"),
  },
  {
    name: "switch",
    field: "swi",
    changed: null,
    change: (ui) => ui.t("fd-swi").click(),
    shows: (ui, entry) => ui.expectAttr("fd-swi", "aria-checked", entry ? "true" : "false"),
  },
  {
    name: "slider",
    field: "sld",
    changed: "21",
    async change(ui) {
      await ui.t("fd-sld-thumb").focus();
      await ui.page.keyboard.press("ArrowRight");
    },
    shows: (ui, entry) => ui.expectAttr("fd-sld-thumb", "aria-valuenow", entry),
  },
  {
    name: "input",
    field: "inp",
    changed: "hellox",
    change: typesInto("fd-inp"),
    shows: (ui, entry) => ui.expectValue("fd-inp", entry ?? ""),
  },
  {
    name: "styled input",
    field: "sin",
    changed: "hellox",
    change: typesInto("fd-sin"),
    shows: (ui, entry) => ui.expectValue("fd-sin", entry ?? ""),
  },
];

const parentValueWithDefault: Scenario[] = [
  ...defaultedControls.map(
    (control): Scenario => ({
      id: `form ${control.name}, parent-held with a default: reset keeps the parent value`,
      page: "form-default",
      async run(ui) {
        await control.change(ui);
        await ui.expectFormEntry("fd", control.field, control.changed);
        await ui.resetForm("fd");
        await ui.expectFormEntry("fd", control.field, control.changed);
        await control.shows(ui, control.changed);
      },
    }),
  ),
  {
    id: "form textarea, parent-held with a default: reset takes the default",
    page: "form-default",
    async run(ui) {
      await typesInto("fd-txt")(ui);
      await ui.expectFormEntry("fd", "txt", "hellox");
      await ui.resetForm("fd");
      await ui.expectFormEntry("fd", "txt", "seed");
      await ui.expectValue("fd-txt", "seed");
      expect(await ui.page.evaluate(() => window.__cf.parents["fd-txt"]?.read())).toBe("seed");
      // Typing works again, and the parent follows.
      await typesInto("fd-txt")(ui);
      expect(await ui.page.evaluate(() => window.__cf.parents["fd-txt"]?.read())).toBe("seedx");
    },
  },
];

const pick = async (ui: Ui, form: string) => {
  await ui.t(`${form}-trigger`).click();
  await ui.t(`${form}-item-b`).click();
};

/** Renders every framework control again. React then writes each hidden input name again. */
const renderAgain = async (ui: Ui) => {
  await ui.t("ff-tick").click();
  await ui.settle();
};

const fieldNamedControls = [
  { kind: "ps", label: "Primitive Select" },
  { kind: "pc", label: "Primitive Combobox" },
  { kind: "ss", label: "Styled Select" },
  { kind: "sc", label: "Styled Combobox" },
];

const fieldName: Scenario[] = fieldNamedControls.flatMap(({ kind, label }): Scenario[] => [
  {
    id: `form field name, ${label}: defaultValue submits under the Field name`,
    page: "form-field",
    async run(ui) {
      await ui.expectFormEntry(`${kind}-def`, "fruit", "a");
      await renderAgain(ui);
      expect(await submitted(ui, `${kind}-def`, "fruit")).toBe("a");
    },
  },
  {
    id: `form field name, ${label}: a pick submits under the Field name`,
    page: "form-field",
    async run(ui) {
      await ui.expectFormEntry(`${kind}-pick`, "fruit", "");
      await pick(ui, `${kind}-pick`);
      await ui.expectFormEntry(`${kind}-pick`, "fruit", "b");
      await renderAgain(ui);
      expect(await submitted(ui, `${kind}-pick`, "fruit")).toBe("b");
      await ui.resetForm(`${kind}-pick`);
      await ui.expectFormEntry(`${kind}-pick`, "fruit", "");
    },
  },
  {
    id: `form field name, ${label}: items in a child component`,
    page: "form-field",
    async run(ui) {
      await ui.expectFormEntry(`${kind}-kid`, "fruit", "a");
      await pick(ui, `${kind}-kid`);
      await renderAgain(ui);
      expect(await submitted(ui, `${kind}-kid`, "fruit")).toBe("b");
    },
  },
  {
    id: `form field name, ${label}: a name on the control wins`,
    page: "form-field",
    async run(ui) {
      await ui.expectFormEntry(`${kind}-own`, "own", "a");
      await ui.expectFormEntry(`${kind}-own`, "fruit", null);
      await pick(ui, `${kind}-own`);
      await renderAgain(ui);
      expect(await submitted(ui, `${kind}-own`, "own")).toBe("b");
      await ui.expectFormEntry(`${kind}-own`, "fruit", null);
    },
  },
]);

export const formScenarios: Scenario[] = [
  ...fieldName,
  ...parentValueWithDefault,
  ...controls.flatMap((control): Scenario[] => [
    {
      id: `form ${control.name}: uncontrolled submit and reset`,
      page: "form",
      async run(ui) {
        await ui.expectFormEntry("fu", control.field, control.initial);
        await control.shows(ui, "fu", control.initial);
        await control.change(ui, "fu");
        await ui.expectFormEntry("fu", control.field, control.changed);
        await control.shows(ui, "fu", control.changed);
        expect(await submitted(ui, "fu", control.field)).toBe(control.changed);
        await ui.resetForm("fu");
        await ui.expectFormEntry("fu", control.field, control.initial);
        await control.shows(ui, "fu", control.initial);
      },
    },
    {
      id: `form ${control.name}: parent-held submit and reset`,
      page: "form",
      async run(ui) {
        await ui.expectFormEntry("fp", control.field, control.initial);
        await control.shows(ui, "fp", control.initial);
        await control.change(ui, "fp");
        await ui.expectFormEntry("fp", control.field, control.changed);
        await control.shows(ui, "fp", control.changed);
        expect(await submitted(ui, "fp", control.field)).toBe(control.changed);
        // The parent owns the value, so a native reset leaves it and the display in place.
        await ui.resetForm("fp");
        await ui.expectFormEntry("fp", control.field, control.changed);
        await control.shows(ui, "fp", control.changed);
      },
    },
  ]),
];
