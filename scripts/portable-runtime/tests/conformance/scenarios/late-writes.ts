// The late-write rule: when a model input starts `undefined` at mount, a later defined value that
// differs from the last incoming value is a silent Runtime command. The component shows it, and no
// change callback, Runtime DOM change event, or Vue model update fires for it. For Slider, Input OTP,
// and Color Picker the Runtime also keeps ownership, so a stale input never reverts a later user
// interaction. Astro has no reactive parent input, so `differences.ts` excludes it. The check that no
// Runtime DOM change event fires is strongest for the contract families, whose interaction proves that
// the recorder hears their DOM change event (`domEvent`).
import { parseColor } from "@starwind-ui/runtime/color-picker";
import { expect } from "vitest";
import type { Ui } from "../ui";
import type { Scenario } from "./types";

type Family = {
  /** Instance id in the `late-writes` fixture page. */
  id: string;
  name: string;
  /** The change callback name, which is also the Vue model name the fixture records. */
  event: string;
  later: unknown;
  laterShown: unknown;
  interact(ui: Ui): Promise<void>;
  /** The shown state after the interaction, or a check for it. */
  interacted: unknown | ((shown: unknown) => boolean);
  shown(ui: Ui): Promise<unknown>;
  /** True when the Runtime sends a DOM change event for the interaction. */
  domEvent?: boolean;
};

/** Waits for `read` to give `expected`. `expect.poll` needs a test context that concurrent scenarios lack. */
async function until(
  label: string,
  read: () => Promise<unknown>,
  expected: unknown,
): Promise<void> {
  const want = JSON.stringify(expected);
  const deadline = Date.now() + 1500;
  while (true) {
    const value = JSON.stringify(await read());
    if (value === want) return;
    if (Date.now() > deadline) throw new Error(`${label}: expected ${want}, received ${value}`);
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

const sliderValue = (id: string) => async (ui: Ui) =>
  JSON.parse((await ui.attr(`${id}-root`, "data-value")) ?? "null");

const otpValue = (id: string) => (ui: Ui) =>
  ui.page.locator(`[data-testid="${id}-root"] [data-sw-input-otp-input]`).inputValue();

const colorValue = (id: string) => async (ui: Ui) => {
  const value = await ui.attr(`${id}-root`, "data-value");
  return value ? (parseColor(value)?.toString("hex") ?? value) : value;
};

/** The item suffixes of `<id>-a`, `<id>-b`, `<id>-c` whose attribute is `"true"`. */
const marked =
  (id: string, attribute: string, part = "") =>
  async (ui: Ui) => {
    const result: string[] = [];
    for (const item of ["a", "b", "c"]) {
      if ((await ui.attr(`${id}-${item}${part}`, attribute)) === "true") result.push(item);
    }
    return result;
  };

async function pressKey(ui: Ui, selector: string, key: string): Promise<void> {
  await ui.page.locator(selector).first().focus();
  await ui.page.keyboard.press(key);
}

async function typeAtEnd(ui: Ui, selector: string, text: string): Promise<void> {
  await ui.page.locator(selector).first().click();
  await ui.page.keyboard.press("End");
  await ui.page.keyboard.type(text);
}

async function pick(ui: Ui, id: string, item: string): Promise<void> {
  await ui.t(`${id}-trigger`).click();
  await ui.expectVisible(`${id}-popup`);
  await ui.t(`${id}-item-${item}`).click();
}

/** Drags the slider from 10% to 45% of its width, so the first thumb moves. */
async function drag(ui: Ui, id: string): Promise<void> {
  const control = ui.t(`${id}-control`);
  await control.scrollIntoViewIfNeeded();
  const box = await control.boundingBox();
  if (!box || box.width === 0 || box.height === 0) throw new Error(`${id} control has no box`);
  const y = box.y + box.height / 2;
  await ui.page.mouse.move(box.x + box.width * 0.1, y);
  await ui.page.mouse.down();
  await ui.page.mouse.move(box.x + box.width * 0.45, y, { steps: 5 });
  await ui.page.mouse.up();
}

const sliderThumb = (id: string) => `[data-testid="${id}-thumb"] input`;
const otpInput = (id: string) => `[data-testid="${id}-root"] [data-sw-input-otp-input]`;

/** Slider, Input OTP, and Color Picker, which the late-write contract fact drives. */
const contractFamilies: Family[] = [
  {
    id: "lsu",
    name: "slider",
    event: "value",
    later: 40,
    laterShown: 40,
    interact: (ui) => pressKey(ui, sliderThumb("lsu"), "ArrowRight"),
    interacted: 41,
    shown: sliderValue("lsu"),
    domEvent: true,
  },
  {
    id: "lsa",
    name: "range slider",
    event: "value",
    // Each write reaches the component as a fresh array, so the stale write is an equal fresh array.
    later: [30, 70],
    laterShown: [30, 70],
    interact: (ui) => drag(ui, "lsa"),
    interacted: (shown) => Array.isArray(shown) && shown[0] !== 30 && shown[1] === 70,
    shown: sliderValue("lsa"),
    domEvent: true,
  },
  {
    id: "lou",
    name: "input otp",
    event: "value",
    later: "1234",
    laterShown: "1234",
    interact: (ui) => typeAtEnd(ui, otpInput("lou"), "9"),
    interacted: "12349",
    shown: otpValue("lou"),
    domEvent: true,
  },
  {
    id: "lcu",
    name: "color picker value",
    event: "value",
    // The fixture parses each write into a fresh Color object, so the stale write is an equal
    // fresh object.
    later: "#00ff00",
    laterShown: "#00ff00",
    interact: (ui) => ui.t("lcu-swatch").click(),
    interacted: "#ff0000",
    shown: colorValue("lcu"),
    domEvent: true,
  },
  {
    id: "lfu",
    name: "color picker format",
    event: "format",
    later: "hsl",
    laterShown: "hsl",
    interact: async (ui) => {
      await ui.t("lfu-select").selectOption("rgb");
    },
    interacted: "rgb",
    shown: (ui) => ui.t("lfu-select").inputValue(),
    domEvent: true,
  },
];

/** Other value-like model families, which the audit checks against the same rule. */
const auditedFamilies: Family[] = [
  {
    id: "tab",
    name: "tabs",
    event: "value",
    later: "b",
    laterShown: ["b"],
    interact: (ui) => ui.t("tab-c").click(),
    interacted: ["c"],
    shown: marked("tab", "aria-selected"),
  },
  {
    id: "acc",
    name: "accordion",
    event: "value",
    later: "b",
    laterShown: ["b"],
    interact: (ui) => ui.t("acc-c-trigger").click(),
    interacted: ["c"],
    shown: marked("acc", "aria-expanded", "-trigger"),
  },
  {
    id: "cbg",
    name: "checkbox group",
    event: "value",
    later: ["b"],
    laterShown: ["b"],
    interact: (ui) => ui.t("cbg-c").click(),
    interacted: ["b", "c"],
    shown: marked("cbg", "aria-checked"),
  },
  {
    id: "chk",
    name: "checkbox",
    event: "checked",
    later: true,
    laterShown: "true",
    interact: (ui) => ui.t("chk-root").click(),
    interacted: "false",
    shown: (ui) => ui.attr("chk-root", "aria-checked"),
  },
  {
    id: "swi",
    name: "switch",
    event: "checked",
    later: true,
    laterShown: "true",
    interact: (ui) => ui.t("swi-root").click(),
    interacted: "false",
    shown: (ui) => ui.attr("swi-root", "aria-checked"),
  },
  {
    id: "rdg",
    name: "radio group",
    event: "value",
    later: "b",
    laterShown: ["b"],
    interact: (ui) => ui.t("rdg-c").click(),
    interacted: ["c"],
    shown: marked("rdg", "aria-checked"),
  },
  {
    id: "tgg",
    name: "toggle group",
    event: "value",
    later: ["b"],
    laterShown: ["b"],
    interact: (ui) => ui.t("tgg-c").click(),
    interacted: ["c"],
    shown: marked("tgg", "aria-pressed"),
  },
  {
    id: "tgl",
    name: "toggle",
    event: "pressed",
    later: true,
    laterShown: "true",
    interact: (ui) => ui.t("tgl-root").click(),
    interacted: "false",
    shown: (ui) => ui.attr("tgl-root", "aria-pressed"),
  },
  {
    id: "sel",
    name: "select",
    event: "value",
    later: "b",
    laterShown: "Banana",
    interact: (ui) => pick(ui, "sel", "a"),
    interacted: "Apple",
    shown: async (ui) => (await ui.t("sel-value").textContent())?.trim(),
  },
  {
    id: "cmb",
    name: "combobox",
    event: "value",
    later: "b",
    laterShown: "Banana",
    interact: (ui) => pick(ui, "cmb", "a"),
    interacted: "Apple",
    shown: (ui) => ui.t("cmb-input").inputValue(),
  },
  {
    id: "inp",
    name: "input",
    event: "value",
    later: "written",
    laterShown: "written",
    interact: (ui) => typeAtEnd(ui, '[data-testid="inp-root"]', "x"),
    interacted: "writtenx",
    shown: (ui) => ui.t("inp-root").inputValue(),
  },
];

async function expectShown(ui: Ui, family: Family, expected: Family["interacted"]) {
  if (typeof expected === "function") {
    const check = expected as (shown: unknown) => boolean;
    await until(`${family.id} shown`, async () => check(await family.shown(ui)), true);
  } else {
    await until(`${family.id} shown`, () => family.shown(ui), expected);
  }
}

/** A parent command: the component shows the value, and nothing fires back. */
async function expectSilentWrite(
  ui: Ui,
  family: Family,
  value: unknown,
  shown: Family["interacted"],
): Promise<void> {
  await ui.clearEvents();
  await ui.parentWrite(family.id, value);
  await expectShown(ui, family, shown);
  // No change callback and no Runtime DOM change event.
  await ui.expectChanges(family.id, []);
  await ui.expectModelWrites(family.id, family.event, []);
}

/** The interaction reaches the same recorder, so the silent checks above can fail. */
async function expectInteraction(ui: Ui, family: Family): Promise<unknown> {
  await ui.clearEvents();
  await family.interact(ui);
  await expectShown(ui, family, family.interacted);
  await until(
    `${family.id} interaction events`,
    async () => {
      const changes = await ui.changes(family.id);
      return (
        changes.some(([event]) => event === family.event) &&
        (!family.domEvent || changes.some(([event]) => event.startsWith("dom:")))
      );
    },
    true,
  );
  if (ui.target === "vue") {
    const writes = (await ui.entries(family.id)).filter(
      (entry) => entry.event === `model:${family.event}`,
    );
    expect(writes.length).toBeGreaterThan(0);
  }
  return family.shown(ui);
}

async function staleInputKeepsInteraction(ui: Ui, family: Family): Promise<void> {
  await expectSilentWrite(ui, family, family.later, family.laterShown);
  const interacted = await expectInteraction(ui, family);

  // The parent rerenders with the same stale input. The interaction stays.
  await ui.clearEvents();
  await ui.parentWrite(family.id, family.later);
  await ui.settle();
  expect(await family.shown(ui), "shown after a stale rerender").toEqual(interacted);
  expect(
    (await ui.changes(family.id)).filter(
      ([event]) => event === family.event || event.startsWith("dom:"),
    ),
  ).toEqual([]);
  // Vue one-way readback may publish the accepted value again, never the stale input.
  const stale = JSON.stringify(family.later);
  const writes = (await ui.entries(family.id)).filter(
    (entry) => entry.event === `model:${family.event}`,
  );
  expect(writes.filter((entry) => JSON.stringify(entry.value) === stale)).toEqual([]);
}

// A one-way parent goes back to undefined, then sends the same value again. The last input is now
// undefined, so the value differs from it and applies silently.
const resetScenarios: Scenario[] = contractFamilies.map((family) => ({
  id: `late write ${family.name}, one-way parent: undefined then the same value applies it again`,
  page: "late-writes",
  async run(ui) {
    await expectSilentWrite(ui, family, family.later, family.laterShown);
    const interacted = await expectInteraction(ui, family);
    await ui.clearEvents();
    await ui.parentWrite(family.id, undefined);
    await ui.settle();
    expect(await family.shown(ui), "shown after undefined").toEqual(interacted);
    await expectSilentWrite(ui, family, family.later, family.laterShown);
  },
}));

// Every value-like family shows a late value and fires nothing for it.
const silentScenarios: Scenario[] = [...contractFamilies, ...auditedFamilies].map((family) => ({
  id: `late write ${family.name}: a late value applies silently`,
  page: "late-writes",
  run: (ui) => expectSilentWrite(ui, family, family.later, family.laterShown),
}));

// The Runtime keeps ownership after the late value, so a one-way parent's stale input never
// reverts a user interaction. `differences.ts` names the families where this is not guaranteed.
const ruleScenarios: Scenario[] = [...contractFamilies, ...auditedFamilies].map((family) => ({
  id: `late write ${family.name}, one-way parent: a stale input keeps the interaction`,
  page: "late-writes",
  run: (ui) => staleInputKeepsInteraction(ui, family),
}));

/** Parents that mirror each change back into the model: React state, Vue v-model, Svelte bind. */
const mirroredFamilies = [
  {
    id: "lsm",
    name: "slider",
    later: 40,
    interact: (ui: Ui) => pressKey(ui, sliderThumb("lsm"), "ArrowRight"),
    interacted: 41,
    shown: sliderValue("lsm"),
  },
  {
    id: "lom",
    name: "input otp",
    later: "1234",
    interact: (ui: Ui) => typeAtEnd(ui, otpInput("lom"), "9"),
    interacted: "12349",
    shown: otpValue("lom"),
  },
  {
    id: "lcm",
    name: "color picker",
    later: "#00ff00",
    interact: (ui: Ui) => ui.t("lcm-swatch").click(),
    interacted: "#ff0000",
    shown: colorValue("lcm"),
  },
].map((family) => ({
  ...family,
  event: "value",
  laterShown: family.later,
  domEvent: true,
}));

const mirroredScenarios: Scenario[] = mirroredFamilies.map((family) => ({
  id: `late write ${family.name}, mirrored parent: a later write after an interaction applies silently`,
  page: "late-writes",
  async run(ui) {
    await expectSilentWrite(ui, family, family.later, family.later);
    await expectInteraction(ui, family);
    expect(await ui.parentValue(family.id)).toEqual(family.interacted);
    // Back to undefined keeps the accepted value. The same earlier value then differs from the
    // last input, so it applies again, with no change callback or model update.
    await ui.clearEvents();
    await ui.parentWrite(family.id, undefined);
    await ui.settle();
    expect(await family.shown(ui)).toEqual(family.interacted);
    await expectSilentWrite(ui, family, family.later, family.later);
    expect(await ui.parentValue(family.id)).toEqual(family.later);
  },
}));

const invalidScenarios: Scenario[] = [
  {
    id: "late write color picker value: an invalid later input changes nothing",
    page: "late-writes",
    async run(ui) {
      const family = contractFamilies.find((entry) => entry.id === "lcu")!;
      await expectSilentWrite(ui, family, family.later, family.laterShown);
      await expectSilentWrite(ui, family, "not-a-color", family.laterShown);
      await expectInteraction(ui, family);
      await expectSilentWrite(ui, family, "not-a-color", family.interacted);
    },
  },
];

const normalizedScenarios: Scenario[] = [
  {
    id: "late write slider, mirrored parent: a value past max shows the normalized value",
    page: "late-writes",
    async run(ui) {
      const family = mirroredFamilies[0]!;
      await ui.clearEvents();
      await ui.parentWrite("lsm", 150);
      await expectShown(ui, family, 100);
      await ui.settle();
      // No change callback and no Runtime DOM change event in any target.
      expect(await ui.changes("lsm")).toEqual([]);
      // React keeps its prop. Vue v-model and Svelte bind:value may publish only the normalized
      // value, so the model matches what the user sees.
      const writes = (await ui.entries("lsm"))
        .filter((entry) => entry.event === "model:value")
        .map((entry) => entry.value);
      expect(writes.filter((value) => value !== 100)).toEqual([]);
      const parentValue = await ui.parentValue("lsm");
      if (ui.target === "react") expect(parentValue).toBe(150);
      else expect([100, 150]).toContain(parentValue);
    },
  },
];

const controlledScenarios: Scenario[] = [
  {
    id: "late write input otp, controlled then undefined: a refused edit keeps the last parent value",
    page: "late-writes",
    async run(ui) {
      const shown = otpValue("loc");
      await until("loc shown", () => shown(ui), "12");
      await ui.parentWrite("loc", undefined);
      expect(await shown(ui)).toBe("12");
      await ui.refuse("loc");
      await ui.clearEvents();
      await typeAtEnd(ui, otpInput("loc"), "3");
      // The parent saw the proposal and refused it.
      await until(
        "loc proposal",
        async () => (await ui.changes("loc")).some(([event]) => event === "value"),
        true,
      );
      await ui.settle();
      expect(await shown(ui)).toBe("12");
      await ui.expectFormEntry("late-form", "code", "12");
    },
  },
];

export const lateWriteScenarios: Scenario[] = [
  ...silentScenarios,
  ...ruleScenarios,
  ...resetScenarios,
  ...mirroredScenarios,
  ...invalidScenarios,
  ...normalizedScenarios,
  ...controlledScenarios,
];
